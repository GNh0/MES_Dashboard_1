# MES Dashboard

WinForms `WebView2`에서 사용할 MES 대시보드 화면입니다.

## 확인용 페이지

GitHub Pages를 켜면 아래 주소에서 화면을 바로 확인할 수 있습니다.

```text
https://gnh0.github.io/MES_Dashboard_1/
```

캐시 때문에 변경사항이 늦게 보이면 `Ctrl + F5`로 새로고침하면 됩니다.

---

# 사용 방식 2가지

이 대시보드는 C#에서 아래 2가지 방식으로 사용할 수 있습니다.

```text
1. 리소스 통합본 방식
   - HTML/CSS/JS를 하나로 합친 HTML을 C# 리소스에 넣고 NavigateToString으로 실행
   - CI 이미지도 리소스에 넣고 WebResourceRequested로 가상 URL 응답
   - 실행 파일 옆에 Dashboard 폴더가 필요 없음

2. 파일 배포 방식
   - index.html, css, js 폴더를 프로그램과 같이 배포
   - WebView2가 실제 파일 경로의 index.html을 로드
   - 개발/수정/디버깅이 쉬움
```

권장 기준은 이렇습니다.

```text
개발 중 / 수정 잦음     → 파일 배포 방식
배포 파일을 줄이고 싶음 → 리소스 통합본 방식
```

---

# 파일 구조

```text
MES_Dashboard_1/
  index.html                         # 파일 배포 방식에서 사용하는 HTML
  standalone.html                    # 리소스 등록용 통합본 후보
  css/
    dashboard.css
    board-scroll.css
    proposal-layout.css
    flat-metric.css
    board-actions.css
    board-date.css
    ci-clean.css
  js/
    dashboard-app.js                 # 실제 동작 전체 JS
    sample-data.js                   # 테스트 데이터
  csharp/
    MesDashboardKernel.cs            # C# WebView2 헬퍼
  samples/
    WinFormsWebView2Sample/          # WinForms 샘플 프로젝트
```

실제 C# 프로그램에서는 `sample-data.js`는 보통 사용하지 않습니다. C#에서 `ConfigureAsync`, `RenderValuesAsync`로 데이터를 넣습니다.

---

# 공통 C# 구조

## 1. WebView2 메시지 수신

카드 클릭, 전체보기 클릭, 행 클릭은 모두 WebView2 메시지로 C#에 전달됩니다.

```csharp
private void Dashboard_DashboardMessageReceived(object? sender, DashboardMessage e)
{
    switch (e.Type)
    {
        case "DASHBOARD_BOX_CLICK":
            OpenDashboardProgram(e.Target);
            break;

        case "BOARD_MORE_CLICK":
            OpenBoardList(e.Target);
            break;

        case "NOTICE_DETAIL":
            MessageBox.Show($"공지사항 상세: {e.Key}\n{e.Title}");
            break;

        case "WORK_REQUEST_DETAIL":
            MessageBox.Show($"업무지시요청 상세: {e.Key}\n{e.Title}");
            break;
    }
}

private void OpenDashboardProgram(string? target)
{
    switch (target)
    {
        case "ATTENDANCE":
            MessageBox.Show("근태현황 프로그램 실행");
            break;

        case "APPROVAL_1":
            MessageBox.Show("전자결재 프로그램 실행");
            break;

        case "NOTICE":
            MessageBox.Show("공지사항 카드 클릭");
            break;

        case "WORK_REQUEST":
            MessageBox.Show("업무지시요청 카드 클릭");
            break;
    }
}

private void OpenBoardList(string? target)
{
    switch (target)
    {
        case "NOTICE":
            MessageBox.Show("공지사항 전체보기");
            break;

        case "WORK_REQUEST":
            MessageBox.Show("업무지시요청 전체보기");
            break;
    }
}
```

이벤트 구분은 다음과 같습니다.

```text
카드 빈 영역 클릭       → DASHBOARD_BOX_CLICK
오른쪽 상단 전체보기 클릭 → BOARD_MORE_CLICK
공지사항 행 클릭        → NOTICE_DETAIL
업무지시요청 행 클릭    → WORK_REQUEST_DETAIL
```

## 2. 제목/푸터 설정

처음 화면을 띄운 뒤 카드 제목, 푸터, 라벨, CI 이미지를 설정합니다.

```csharp
private async Task ConfigureDashboardAsync()
{
    var config = new
    {
        ciImageUrl = "https://mes-dashboard.local/assets/ci-logo.png",
        ciTitle = "KONE MES", // 이미지 로드 실패 시 fallback

        attendanceTitle = "근태현황",

        approvalItems = new[]
        {
            new { title = "전자결재", foot = "결재 대기" },
            new { title = "구매승인", foot = "검토 대기" },
            new { title = "생산확인", foot = "확인 대기" }
        },

        proposalTitle = "제안",
        proposalTargetLabel = "목표",
        proposalSubmitLabel = "제출",

        noticeTitle = "공지사항",
        workRequestTitle = "업무지시요청",
        exchangeTitle = "환율"
    };

    await dashboard!.ConfigureAsync(config);
}
```

부분 설정도 가능합니다.

```csharp
await dashboard!.ExecuteScriptAsync("configureDashboardAttendance({ title: '근태현황' });");
await dashboard!.ExecuteScriptAsync("configureDashboardApproval(1, { title: '전자결재', foot: '결재 대기' });");
await dashboard!.ExecuteScriptAsync("configureDashboardBoard('NOTICE', { title: '공지사항' });");
```

프로젝트에 있는 `MesDashboardKernel`을 그대로 쓴다면 위처럼 직접 `ExecuteScriptAsync`를 호출하거나, 필요한 경우 부분 설정 메서드를 래핑해서 쓰면 됩니다.

## 3. 값 갱신

제목/푸터는 이미 설정했으므로 실제 조회값만 넣습니다.

```csharp
private async Task RenderValuesAsync()
{
    var values = new
    {
        attendanceFieldMap = new { name = "GUBUNNM", count = "CNT", unit = "UNIT" },
        attendanceItems = new[]
        {
            new { GUBUNNM = "연차", CNT = 2, UNIT = "건" },
            new { GUBUNNM = "반차", CNT = 1, UNIT = "건" },
            new { GUBUNNM = "외근", CNT = 3, UNIT = "건" },
            new { GUBUNNM = "남은연차", CNT = 12, UNIT = "일" }
        },

        approvalItems = new[]
        {
            new { count = 3 },
            new { count = 1 },
            new { count = 4 }
        },

        proposalTargetCount = 12,
        proposalSubmitCount = 7,

        noticeFieldMap = new { key = "SEQ", title = "TITLE", writer = "WRITER", date = "WRTDT" },
        notices = new[]
        {
            new { SEQ = "N001", TITLE = "공지사항 샘플 제목입니다.", WRITER = "관리자", WRTDT = "20260424" },
            new { SEQ = "N002", TITLE = "시스템 점검 안내입니다.", WRITER = "관리자", WRTDT = "20260423" }
        },

        workRequestFieldMap = new { key = "REQNO", title = "TITLE", writer = "WRITER", date = "REQDT" },
        workRequests = new[]
        {
            new { REQNO = "W001", TITLE = "작업지시 확인 요청입니다.", WRITER = "생산팀", REQDT = "20260424" },
            new { REQNO = "W002", TITLE = "품질 확인 요청입니다.", WRITER = "품질팀", REQDT = "20260424" }
        },

        exchangeFieldMap = new { name = "CURRNM", value = "RATE", unit = "UNIT", date = "BASISDT" },
        exchangeRates = new[]
        {
            new { CURRNM = "달러", RATE = 1380.5m, UNIT = "원", BASISDT = "20260424" },
            new { CURRNM = "엔화", RATE = 9.12m, UNIT = "원", BASISDT = "20260424" },
            new { CURRNM = "유로", RATE = 1472.3m, UNIT = "원", BASISDT = "20260424" }
        }
    };

    await dashboard!.RenderValuesAsync(values);
}
```

`WRTDT`, `REQDT`가 `yyyyMMdd`로 들어오면 화면에서는 기본 `yyyy-MM-dd`로 표시됩니다.

```text
20260424 → 2026-04-24
```

환율 기준일과 근태현황 기준일은 DB 날짜와 상관없이 화면 기준 당일 날짜로 표시됩니다.

---

# 1. 리소스 통합본 방식

## 개념

HTML/CSS/JS를 하나로 합친 통합본을 `Resources.resx`에 문자열로 등록해서 사용합니다.

```text
Resources.resx
  DashboardHtml   # 통합 HTML 문자열
  CiLogo          # PNG/JPG 이미지 리소스
```

이 방식은 실행 파일 옆에 `Dashboard` 폴더가 없어도 됩니다.

```csharp
webView21.NavigateToString(Properties.Resources.DashboardHtml);
```

CI 이미지는 Base64로 변환하지 않고, WebView2의 `WebResourceRequested`를 이용해서 C# 리소스 이미지를 가상 URL로 응답합니다.

```text
https://mes-dashboard.local/assets/ci-logo.png
```

## 리소스 방식 초기화 코드

```csharp
using Microsoft.Web.WebView2.Core;
using System;
using System.Drawing.Imaging;
using System.IO;
using System.Windows.Forms;

private MesDashboardKernel? dashboard;

private async Task InitDashboardFromResourceAsync()
{
    await webView21.EnsureCoreWebView2Async();

    webView21.CoreWebView2.Settings.IsWebMessageEnabled = true;

    webView21.CoreWebView2.AddWebResourceRequestedFilter(
        "https://mes-dashboard.local/assets/*",
        CoreWebView2WebResourceContext.Image
    );

    webView21.CoreWebView2.WebResourceRequested -= CoreWebView2_WebResourceRequested;
    webView21.CoreWebView2.WebResourceRequested += CoreWebView2_WebResourceRequested;

    webView21.CoreWebView2.WebMessageReceived -= CoreWebView2_WebMessageReceived;
    webView21.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;

    webView21.NavigationCompleted -= WebView21_NavigationCompleted;
    webView21.NavigationCompleted += WebView21_NavigationCompleted;

    webView21.NavigateToString(Properties.Resources.DashboardHtml);
}
```

## CI 이미지 리소스 응답 코드

```csharp
private void CoreWebView2_WebResourceRequested(object? sender, CoreWebView2WebResourceRequestedEventArgs e)
{
    string uri = e.Request.Uri;

    if (uri.Equals("https://mes-dashboard.local/assets/ci-logo.png", StringComparison.OrdinalIgnoreCase))
    {
        using var ms = new MemoryStream();

        // Resources.resx에 CiLogo 이미지로 등록되어 있다고 가정합니다.
        Properties.Resources.CiLogo.Save(ms, ImageFormat.Png);

        byte[] bytes = ms.ToArray();
        var stream = new MemoryStream(bytes);

        e.Response = webView21.CoreWebView2.Environment.CreateWebResourceResponse(
            stream,
            200,
            "OK",
            "Content-Type: image/png"
        );
    }
}
```

## 리소스 방식 NavigationCompleted

```csharp
private async void WebView21_NavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
{
    if (!e.IsSuccess)
    {
        MessageBox.Show("대시보드 로딩 실패");
        return;
    }

    dashboard = new MesDashboardKernel(webView21);
    dashboard.DashboardMessageReceived += Dashboard_DashboardMessageReceived;

    await ConfigureDashboardAsync();
    await RenderValuesAsync();
}
```

`ciImageUrl`은 반드시 가상 URL로 넣습니다.

```csharp
ciImageUrl = "https://mes-dashboard.local/assets/ci-logo.png"
```

---

# 2. 파일 배포 방식

## 개념

HTML/CSS/JS 파일을 프로그램과 같이 배포하고, WebView2가 실제 `index.html` 파일을 로드합니다.

배포 구조 예시입니다.

```text
프로그램.exe
Dashboard/
  index.html
  css/
    dashboard.css
    board-scroll.css
    proposal-layout.css
    flat-metric.css
    board-actions.css
    board-date.css
    ci-clean.css
  js/
    dashboard-app.js
  assets/
    ci-logo.png
```

## 파일 배포 방식 초기화 코드

```csharp
private MesDashboardKernel? dashboard;

private async Task InitDashboardFromFileAsync()
{
    dashboard = new MesDashboardKernel(webView21);
    dashboard.DashboardMessageReceived += Dashboard_DashboardMessageReceived;

    string dashboardDirectory = Path.Combine(Application.StartupPath, "Dashboard");
    await dashboard.InitializeAsync(dashboardDirectory);

    webView21.NavigationCompleted -= WebView21_NavigationCompleted;
    webView21.NavigationCompleted += WebView21_NavigationCompleted;
}
```

## 파일 배포 방식 NavigationCompleted

```csharp
private async void WebView21_NavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
{
    if (!e.IsSuccess)
    {
        MessageBox.Show("대시보드 로딩 실패");
        return;
    }

    await ConfigureDashboardAsync();
    await RenderValuesAsync();
}
```

파일 배포 방식에서는 CI 이미지를 상대경로로 지정하면 됩니다.

```csharp
ciImageUrl = "assets/ci-logo.png"
```

---

# DataTable 컬럼 구조 예시

근태현황은 아래처럼 한 행이 화면의 한 줄입니다.

```text
GUBUNNM    CNT    UNIT
연차        2      건
반차        1      건
외근        3      건
남은연차    12     일
```

컬럼명이 다르면 `attendanceFieldMap`만 바꾸면 됩니다.

```csharp
attendanceFieldMap = new { name = "TITLE", count = "VALUE", unit = "UNITNM" }
```

공지사항/업무지시요청도 같은 방식입니다.

```text
SEQ    TITLE              WRITER    WRTDT
N001   공지사항 제목       관리자     20260424
```

---

# 샘플 프로젝트 실행

샘플 프로젝트 위치:

```text
samples/WinFormsWebView2Sample/WinFormsWebView2Sample.csproj
```

실행 방법:

```bash
cd samples/WinFormsWebView2Sample
dotnet restore
dotnet run
```

샘플 프로젝트는 빌드 시 `index.html`, `css`, `js`, `assets`를 출력 폴더의 `Dashboard` 폴더로 복사합니다.

```text
bin/Debug/net8.0-windows/
  WinFormsWebView2Sample.exe
  Dashboard/
    index.html
    css/
    js/
    assets/
```

---

# 참고

```text
configureDashboard(...)        전체 설정
configureDashboardCi(...)      CI만 설정
configureDashboardAttendance(...) 근태 제목만 설정
configureDashboardApproval(...)   결재 카드 한 개 또는 전체 설정
configureDashboardProposal(...)   제안 라벨 설정
configureDashboardBoard(...)      공지사항/업무지시요청 제목 설정
configureDashboardExchange(...)   환율 제목 설정
renderDashboardValues(...)        실제 값 갱신
```

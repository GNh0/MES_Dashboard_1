# MES Dashboard

WinForms `WebView2`에서 사용할 MES 대시보드 화면입니다.

## 확인용 페이지

GitHub Pages를 켜면 아래 주소에서 화면을 바로 확인할 수 있습니다.

```text
https://gnh0.github.io/MES_Dashboard_1/
```

캐시 때문에 변경사항이 늦게 보이면 `Ctrl + F5`로 새로고침하면 됩니다.

## 파일 구조

```text
MES_Dashboard_1/
  index.html                         # 실제 WebView2에서 사용할 화면
  standalone.html                    # 단독 확인용 통합본
  css/
    dashboard.css
    board-scroll.css
    proposal-layout.css
    flat-metric.css
  js/
    dashboard.js                     # 기본 렌더링 함수
    dashboard-config.js              # 제목/푸터 설정 API
    sample-data.js                   # 테스트 데이터
  csharp/
    MesDashboardKernel.cs            # C# WebView2 헬퍼
  samples/
    WinFormsWebView2Sample/          # WinForms 샘플 프로젝트
```

## C# 사용 방식

구조는 두 단계입니다.

```text
1. configureDashboard(...)
   - 카드 제목, 푸터, 라벨, CI 이미지 같은 고정 문구 설정

2. renderDashboardValues(...)
   - 실제 숫자, 게시판 목록, 환율 데이터만 갱신
```

즉, 카드 위치는 고정 프레임이고, C#에서 제목/푸터를 먼저 정한 뒤 나중에 값만 계속 갈아끼우는 방식입니다.

## WebView2 초기화 예시

```csharp
using MesDashboard;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

public partial class FrmDashboard : Form
{
    private MesDashboardKernel? dashboard;

    private async void FrmDashboard_Load(object sender, EventArgs e)
    {
        dashboard = new MesDashboardKernel(webView21);
        dashboard.DashboardMessageReceived += Dashboard_DashboardMessageReceived;

        string dashboardDirectory = Path.Combine(Application.StartupPath, "Dashboard");
        await dashboard.InitializeAsync(dashboardDirectory);

        webView21.NavigationCompleted += async (_, ev) =>
        {
            if (!ev.IsSuccess)
            {
                MessageBox.Show("대시보드 로딩 실패");
                return;
            }

            await ConfigureDashboardAsync();
            await RenderValuesAsync();
        };
    }
}
```

## HTML/이미지 모두 C# 리소스로 사용할 때

실행 파일 옆에 `Dashboard` 폴더를 두지 않고, HTML과 이미지까지 전부 `Resources.resx`에 넣어서 쓸 수도 있습니다.

이 경우 추천 방식은 다음과 같습니다.

```text
1. DashboardHtml
   - 통합 HTML 문자열 리소스
   - NavigateToString(Properties.Resources.DashboardHtml)로 로드

2. CiLogo
   - PNG/JPG 이미지 리소스
   - Base64로 바꾸지 않음
   - 임시 파일로 풀지도 않음
   - WebView2의 WebResourceRequested에서 가상 URL로 응답
```

HTML에서는 이미지를 실제 파일 경로가 아니라 가상 URL로 사용합니다.

```csharp
ciImageUrl = "https://mes-dashboard.local/assets/ci-logo.png"
```

WebView2 초기화 예시입니다.

```csharp
using Microsoft.Web.WebView2.Core;
using System;
using System.Drawing.Imaging;
using System.IO;
using System.Windows.Forms;

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

이미지 리소스 응답 예시입니다.

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

리소스 방식에서 CI 이미지는 이렇게 설정합니다.

```csharp
private async Task ConfigureDashboardAsync()
{
    var config = new
    {
        ciImageUrl = "https://mes-dashboard.local/assets/ci-logo.png",
        ciTitle = "KONE MES", // 이미지 로드 실패 시 fallback

        attendanceTitle = "근태현황",
        attendanceFoot = "오늘 기준",

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

정리하면, 리소스 방식에서는 다음 방식이 가장 깔끔합니다.

```text
DashboardHtml → NavigateToString으로 로드
CiLogo        → WebResourceRequested로 가상 URL 응답
ciImageUrl    → https://mes-dashboard.local/assets/ci-logo.png
```

## 제목/푸터 설정 예시

```csharp
private async Task ConfigureDashboardAsync()
{
    var config = new
    {
        // 실제 CI 이미지를 사용할 때는 Dashboard/assets/ci-logo.png 같은 상대 경로나 base64를 넣으면 됩니다.
        ciImageUrl = "assets/ci-logo.png",
        ciTitle = "KONE MES", // 이미지가 없을 때만 fallback으로 보입니다.

        attendanceTitle = "근태현황",
        attendanceFoot = "오늘 기준",

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

## 값 갱신 예시

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

        // 제목/푸터는 configureDashboard에서 정했으므로 count만 넘기면 됩니다.
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

## 클릭 이벤트 수신 예시

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

## DataTable 컬럼 구조 예시

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

## 샘플 프로젝트 실행

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

## 참고

- `configureDashboard(...)`: 고정 문구 설정
- `renderDashboardValues(...)`: 실제 값 갱신
- `renderDashboard(...)`: 기존 호환용 전체 렌더링

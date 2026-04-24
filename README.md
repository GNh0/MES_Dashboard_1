# MES Dashboard

WebView2에서 사용할 MES 대시보드 화면입니다.

## 파일 구조

```text
MES_Dashboard_1/
  index.html
  css/
    dashboard.css
  js/
    dashboard.js
    sample-data.js
```

## 실행 방식

`index.html`을 WebView2에서 열면 됩니다.

```csharp
string dashboardPath = Path.Combine(Application.StartupPath, "Dashboard", "index.html");
webView21.Source = new Uri(dashboardPath);
```

또는 C#에서 HTML 로딩 후 아래처럼 데이터를 다시 주입할 수 있습니다.

```csharp
string json = JsonSerializer.Serialize(data);
await webView21.CoreWebView2.ExecuteScriptAsync($"renderDashboard({json});");
```

## 데이터 형태 예시

```javascript
renderDashboard({
    ciTitle: 'KONE MES',
    ciImageUrl: '',

    attendanceFieldMap: { name: 'GUBUNNM', count: 'CNT', unit: 'UNIT' },
    attendanceItems: [
        { GUBUNNM: '연차', CNT: 2, UNIT: '건' },
        { GUBUNNM: '반차', CNT: 1, UNIT: '건' },
        { GUBUNNM: '외근', CNT: 3, UNIT: '건' }
    ],

    approvalItems: [
        { title: '전자결재', count: 3 },
        { title: '구매승인', count: 1 },
        { title: '생산확인', count: 4 }
    ],

    proposalTargetCount: 12,
    proposalSubmitCount: 7,

    noticeFieldMap: { key: 'SEQ', title: 'TITLE', writer: 'WRITER', date: 'WRTDT' },
    notices: [
        { SEQ: 'N001', TITLE: '공지사항 제목', WRITER: '관리자', WRTDT: '20260424' }
    ],

    workRequestFieldMap: { key: 'REQNO', title: 'TITLE', writer: 'WRITER', date: 'REQDT' },
    workRequests: [
        { REQNO: 'W001', TITLE: '업무지시요청 제목', WRITER: '생산팀', REQDT: '20260424' }
    ],

    exchangeFieldMap: { name: 'CURRNM', value: 'RATE', unit: 'UNIT', date: 'BASISDT' },
    exchangeRates: [
        { CURRNM: '달러', RATE: 1380.5, UNIT: '원', BASISDT: '20260424' },
        { CURRNM: '엔화', RATE: 9.12, UNIT: '원', BASISDT: '20260424' }
    ]
});
```

## 클릭 이벤트

카드 클릭 시 WebView2로 메시지를 보냅니다.

- 일반 카드: `DASHBOARD_BOX_CLICK`
- 공지사항 행: `NOTICE_DETAIL`
- 업무지시요청 행: `WORK_REQUEST_DETAIL`

C#에서는 `CoreWebView2.WebMessageReceived`에서 받으면 됩니다.

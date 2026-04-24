using MesDashboard;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace WinFormsWebView2Sample;

public sealed class MainForm : Form
{
    private readonly WebView2 webView;
    private readonly Button btnReload;
    private MesDashboardKernel? dashboard;

    public MainForm()
    {
        Text = "MES Dashboard WebView2 Sample";
        Width = 1280;
        Height = 820;
        StartPosition = FormStartPosition.CenterScreen;

        btnReload = new Button
        {
            Text = "데이터 다시 넣기",
            Dock = DockStyle.Top,
            Height = 38
        };
        btnReload.Click += async (_, _) => await RenderValuesAsync();

        webView = new WebView2
        {
            Dock = DockStyle.Fill
        };

        Controls.Add(webView);
        Controls.Add(btnReload);

        Load += async (_, _) => await InitializeDashboardAsync();
    }

    private async Task InitializeDashboardAsync()
    {
        dashboard = new MesDashboardKernel(webView);
        dashboard.DashboardMessageReceived += Dashboard_DashboardMessageReceived;

        string dashboardDirectory = Path.Combine(AppContext.BaseDirectory, "Dashboard");
        await dashboard.InitializeAsync(dashboardDirectory);

        webView.NavigationCompleted += async (_, e) =>
        {
            if (!e.IsSuccess)
            {
                MessageBox.Show("대시보드 로딩 실패");
                return;
            }

            await ConfigureDashboardAsync();
            await RenderValuesAsync();
        };
    }

    private async Task ConfigureDashboardAsync()
    {
        if (dashboard == null) return;

        var config = new
        {
            // 실제 사용 시에는 Dashboard/assets/ci-logo.png 같은 상대 경로나 base64 이미지를 넣으면 됩니다.
            ciImageUrl = "",
            ciTitle = "KONE MES",

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

        await dashboard.ConfigureAsync(config);
    }

    private async Task RenderValuesAsync()
    {
        if (dashboard == null) return;

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

            // configureDashboard에서 제목/푸터를 정했으므로 여기서는 count만 넣으면 됩니다.
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
                new { SEQ = "N002", TITLE = "시스템 점검 안내입니다.", WRITER = "관리자", WRTDT = "20260423" },
                new { SEQ = "N003", TITLE = "업무 공지 안내입니다.", WRITER = "총무팀", WRTDT = "20260422" },
                new { SEQ = "N004", TITLE = "월말 재고조사 일정 안내입니다.", WRITER = "자재팀", WRTDT = "20260421" },
                new { SEQ = "N005", TITLE = "품질 기준 변경 공지입니다.", WRITER = "품질팀", WRTDT = "20260420" },
                new { SEQ = "N006", TITLE = "출하 마감시간 변경 안내입니다.", WRITER = "영업팀", WRTDT = "20260419" },
                new { SEQ = "N007", TITLE = "사내 교육 일정 안내입니다.", WRITER = "총무팀", WRTDT = "20260418" }
            },

            workRequestFieldMap = new { key = "REQNO", title = "TITLE", writer = "WRITER", date = "REQDT" },
            workRequests = new[]
            {
                new { REQNO = "W001", TITLE = "작업지시 확인 요청입니다.", WRITER = "생산팀", REQDT = "20260424" },
                new { REQNO = "W002", TITLE = "품질 확인 요청입니다.", WRITER = "품질팀", REQDT = "20260424" },
                new { REQNO = "W003", TITLE = "설비 점검 요청입니다.", WRITER = "공무팀", REQDT = "20260423" },
                new { REQNO = "W004", TITLE = "부품 재고 확인 요청입니다.", WRITER = "자재팀", REQDT = "20260422" },
                new { REQNO = "W005", TITLE = "도면 최신본 확인 요청입니다.", WRITER = "설계팀", REQDT = "20260421" },
                new { REQNO = "W006", TITLE = "현장 개선사항 검토 요청입니다.", WRITER = "관리자", REQDT = "20260420" }
            },

            exchangeFieldMap = new { name = "CURRNM", value = "RATE", unit = "UNIT", date = "BASISDT" },
            exchangeRates = new[]
            {
                new { CURRNM = "달러", RATE = 1380.5m, UNIT = "원", BASISDT = "20260424" },
                new { CURRNM = "엔화", RATE = 9.12m, UNIT = "원", BASISDT = "20260424" },
                new { CURRNM = "유로", RATE = 1472.3m, UNIT = "원", BASISDT = "20260424" }
            }
        };

        await dashboard.RenderValuesAsync(values);
    }

    private void Dashboard_DashboardMessageReceived(object? sender, DashboardMessage e)
    {
        switch (e.Type)
        {
            case "DASHBOARD_BOX_CLICK":
                OpenDashboardProgram(e.Target);
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
        MessageBox.Show($"카드 클릭: {target}");
    }
}

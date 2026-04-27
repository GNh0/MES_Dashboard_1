using MesDashboard;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace WinFormsNet472WebView2Sample
{
    public sealed class MainForm : Form
    {
        private readonly WebView2 webView;
        private readonly Button btnReload;
        private MesDashboardKernel dashboard;

        public MainForm()
        {
            Text = "MES Dashboard - .NET Framework 4.7.2 Sample";
            Width = 1280;
            Height = 820;
            StartPosition = FormStartPosition.CenterScreen;

            btnReload = new Button
            {
                Text = "데이터 다시 넣기",
                Dock = DockStyle.Top,
                Height = 38
            };
            btnReload.Click += async delegate { await RenderValuesAsync(); };

            webView = new WebView2
            {
                Dock = DockStyle.Fill
            };

            Controls.Add(webView);
            Controls.Add(btnReload);

            Load += async delegate { await InitializeDashboardAsync(); };
        }

        private async Task InitializeDashboardAsync()
        {
            dashboard = new MesDashboardKernel(webView);
            dashboard.DashboardMessageReceived += Dashboard_DashboardMessageReceived;

            webView.NavigationCompleted -= WebView_NavigationCompleted;
            webView.NavigationCompleted += WebView_NavigationCompleted;

            string dashboardDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Dashboard");
            await dashboard.InitializeAsync(dashboardDirectory);
        }

        private async void WebView_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (!e.IsSuccess)
            {
                MessageBox.Show("대시보드 로딩 실패");
                return;
            }

            await ConfigureDashboardAsync();
            await RenderValuesAsync();
        }

        private async Task ConfigureDashboardAsync()
        {
            if (dashboard == null) return;

            var config = new
            {
                // 파일 배포 방식 기준입니다.
                // Dashboard/assets/ci-logo.png 파일을 넣으면 아래 경로로 표시됩니다.
                // 샘플에서는 sample-data.js의 임시 CI 이미지가 먼저 보일 수 있습니다.
                ciImageUrl = "",
                ciTitle = "KONE MES",

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
                    new { SEQ = "N001", TITLE = "공지사항 제목이 매우 길어졌을 때 말줄임으로 처리되는지 확인하기 위한 샘플 제목입니다.", WRITER = "관리자", WRTDT = "20260424" },
                    new { SEQ = "N002", TITLE = "시스템 정기점검 및 네트워크 장비 교체 작업으로 인한 MES 접속 제한 안내입니다.", WRITER = "관리자", WRTDT = "20260423" },
                    new { SEQ = "N003", TITLE = "업무 공지 안내입니다.", WRITER = "총무팀", WRTDT = "20260422" },
                    new { SEQ = "N004", TITLE = "월말 재고조사 일정 안내입니다.", WRITER = "자재팀", WRTDT = "20260421" },
                    new { SEQ = "N005", TITLE = "품질 기준 변경 공지입니다.", WRITER = "품질팀", WRTDT = "20260420" },
                    new { SEQ = "N006", TITLE = "출하 마감시간 변경 안내입니다.", WRITER = "영업팀", WRTDT = "20260419" }
                },

                workRequestFieldMap = new { key = "REQNO", title = "TITLE", writer = "WRITER", date = "REQDT" },
                workRequests = new[]
                {
                    new { REQNO = "W001", TITLE = "작업지시 확인 요청입니다.", WRITER = "생산팀", REQDT = "20260424" },
                    new { REQNO = "W002", TITLE = "품질 확인 요청입니다.", WRITER = "품질팀", REQDT = "20260424" },
                    new { REQNO = "W003", TITLE = "업무지시요청 제목이 길어질 경우 행 제목 영역에서 말줄임 처리되는지 확인하는 샘플입니다.", WRITER = "관리자", REQDT = "20260423" },
                    new { REQNO = "W004", TITLE = "설비 점검 요청입니다.", WRITER = "공무팀", REQDT = "20260422" },
                    new { REQNO = "W005", TITLE = "자재 입고 지연으로 인한 생산계획 변경 가능 여부 확인 요청입니다.", WRITER = "구매팀", REQDT = "20260421" }
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

        private void Dashboard_DashboardMessageReceived(object sender, DashboardMessage e)
        {
            switch (e.Type)
            {
                case "DASHBOARD_BOX_CLICK":
                    MessageBox.Show("카드 클릭: " + e.Target);
                    break;

                case "BOARD_MORE_CLICK":
                    MessageBox.Show("전체보기 클릭: " + e.Target);
                    break;

                case "NOTICE_DETAIL":
                    MessageBox.Show("공지사항 상세: " + e.Key + Environment.NewLine + e.Title);
                    break;

                case "WORK_REQUEST_DETAIL":
                    MessageBox.Show("업무지시요청 상세: " + e.Key + Environment.NewLine + e.Title);
                    break;
            }
        }
    }
}

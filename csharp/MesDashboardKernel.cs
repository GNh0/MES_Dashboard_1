using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace MesDashboard;

/// <summary>
/// WebView2 기반 MES Dashboard 로딩/설정/데이터 전달/클릭 이벤트 수신용 헬퍼입니다.
/// WinForms에서 WebView2 컨트롤을 넘겨서 사용합니다.
/// </summary>
public sealed class MesDashboardKernel
{
    private readonly WebView2 _webView;

    public event EventHandler<DashboardMessage>? DashboardMessageReceived;

    public MesDashboardKernel(WebView2 webView)
    {
        _webView = webView ?? throw new ArgumentNullException(nameof(webView));
    }

    /// <summary>
    /// index.html 파일을 WebView2에 로드합니다.
    /// dashboardDirectory는 index.html이 들어있는 폴더입니다.
    /// </summary>
    public async Task InitializeAsync(string dashboardDirectory)
    {
        if (string.IsNullOrWhiteSpace(dashboardDirectory))
            throw new ArgumentException("대시보드 폴더 경로가 비어 있습니다.", nameof(dashboardDirectory));

        string indexPath = Path.Combine(dashboardDirectory, "index.html");

        if (!File.Exists(indexPath))
            throw new FileNotFoundException("대시보드 index.html 파일을 찾을 수 없습니다.", indexPath);

        await _webView.EnsureCoreWebView2Async();

        _webView.CoreWebView2.Settings.IsWebMessageEnabled = true;
        _webView.CoreWebView2.WebMessageReceived -= CoreWebView2_WebMessageReceived;
        _webView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;

        _webView.Source = new Uri(indexPath);
    }

    /// <summary>
    /// 카드 제목, 푸터, 라벨 등 정적인 문구를 설정합니다.
    /// JS의 configureDashboard(config)를 호출합니다.
    /// </summary>
    public async Task ConfigureAsync(object config)
    {
        await ExecuteJsonFunctionAsync("configureDashboard", config);
    }

    /// <summary>
    /// 숫자, 게시판, 환율 등 실제 값만 갱신합니다.
    /// JS의 renderDashboardValues(values)를 호출합니다.
    /// </summary>
    public async Task RenderValuesAsync(object values)
    {
        await ExecuteJsonFunctionAsync("renderDashboardValues", values);
    }

    /// <summary>
    /// 기존 방식 호환용입니다. JS의 renderDashboard(data)를 직접 호출합니다.
    /// </summary>
    public async Task RenderAsync(object dashboardData)
    {
        await ExecuteJsonFunctionAsync("renderDashboard", dashboardData);
    }

    private async Task ExecuteJsonFunctionAsync(string functionName, object argument)
    {
        if (_webView.CoreWebView2 == null)
            throw new InvalidOperationException("WebView2가 아직 초기화되지 않았습니다.");

        string json = JsonSerializer.Serialize(argument, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await _webView.CoreWebView2.ExecuteScriptAsync($"{functionName}({json});");
    }

    private void CoreWebView2_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        DashboardMessage? message;

        try
        {
            message = JsonSerializer.Deserialize<DashboardMessage>(e.WebMessageAsJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch
        {
            message = new DashboardMessage
            {
                Type = "RAW",
                RawJson = e.WebMessageAsJson
            };
        }

        if (message != null)
            DashboardMessageReceived?.Invoke(this, message);
    }
}

public sealed class DashboardMessage
{
    public string? Type { get; set; }
    public string? Target { get; set; }
    public string? Key { get; set; }
    public string? Title { get; set; }
    public string? Writer { get; set; }
    public string? Date { get; set; }
    public JsonElement? Row { get; set; }
    public string? RawJson { get; set; }
}

(() => {
    function getTodayText() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}년 ${mm}월${dd}일기준`;
    }

    function withTodayDefaults(data) {
        const next = { ...(data || {}) };

        // 환율 기준일은 DB에서 넘어온 값과 상관없이 무조건 클라이언트 당일 기준으로 표시합니다.
        next.exchangeBaseDate = getTodayText();

        return next;
    }

    function applyAttendanceTodayText() {
        const foot = document.querySelector('.attendance .card-foot, .attendance .attendance-foot');

        if (foot) {
            foot.innerText = getTodayText();
        }
    }

    const originalRenderDashboard = window.renderDashboard;
    if (typeof originalRenderDashboard === 'function') {
        window.renderDashboard = function (data) {
            originalRenderDashboard(withTodayDefaults(data));
            applyAttendanceTodayText();
        };
    }

    const originalRenderDashboardValues = window.renderDashboardValues;
    if (typeof originalRenderDashboardValues === 'function') {
        window.renderDashboardValues = function (values) {
            originalRenderDashboardValues(withTodayDefaults(values));
            applyAttendanceTodayText();
        };
    }

    const originalConfigureDashboard = window.configureDashboard;
    if (typeof originalConfigureDashboard === 'function') {
        window.configureDashboard = function (config) {
            const next = { ...(config || {}) };
            next.attendanceFoot = getTodayText();
            originalConfigureDashboard(next);
            applyAttendanceTodayText();
        };
    }

    document.addEventListener('DOMContentLoaded', applyAttendanceTodayText);
})();

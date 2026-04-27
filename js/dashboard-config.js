const DashboardConfig = (() => {
    let config = {
        ciTitle: 'KONE MES',
        ciImageUrl: '',
        attendanceTitle: '근태현황',
        attendanceFoot: '오늘 기준',
        approvalItems: [
            { title: '전자결재', foot: '결재 대기' },
            { title: '구매승인', foot: '검토 대기' },
            { title: '생산확인', foot: '확인 대기' }
        ],
        proposalTitle: '제안',
        proposalTargetLabel: '목표',
        proposalSubmitLabel: '제출',
        noticeTitle: '공지사항',
        workRequestTitle: '업무지시요청',
        exchangeTitle: '환율'
    };

    function configureDashboard(newConfig) {
        config = mergeConfig(config, newConfig || {});
        applyStaticText(config);
    }

    function configureDashboardCi(newConfig) {
        config = mergeConfig(config, {
            ciTitle: newConfig?.ciTitle ?? newConfig?.title ?? config.ciTitle,
            ciImageUrl: newConfig?.ciImageUrl ?? newConfig?.imageUrl ?? config.ciImageUrl
        });

        applyStaticText(config);
        setCiImage(config.ciImageUrl);
    }

    function configureDashboardAttendance(newConfig) {
        config = mergeConfig(config, {
            attendanceTitle: newConfig?.attendanceTitle ?? newConfig?.title ?? config.attendanceTitle,
            attendanceFoot: newConfig?.attendanceFoot ?? newConfig?.foot ?? config.attendanceFoot
        });

        applyStaticText(config);
    }

    function configureDashboardApproval(indexOrItems, newConfig) {
        if (Array.isArray(indexOrItems)) {
            config = mergeConfig(config, { approvalItems: indexOrItems });
            applyStaticText(config);
            return;
        }

        const index = Number(indexOrItems) - 1;

        if (index < 0 || index >= config.approvalItems.length) {
            return;
        }

        const approvalItems = config.approvalItems.map(function (item, itemIndex) {
            if (itemIndex !== index) {
                return item;
            }

            return {
                ...item,
                ...(newConfig || {})
            };
        });

        config = mergeConfig(config, { approvalItems: approvalItems });
        applyStaticText(config);
    }

    function configureDashboardProposal(newConfig) {
        config = mergeConfig(config, {
            proposalTitle: newConfig?.proposalTitle ?? newConfig?.title ?? config.proposalTitle,
            proposalTargetLabel: newConfig?.proposalTargetLabel ?? newConfig?.targetLabel ?? config.proposalTargetLabel,
            proposalSubmitLabel: newConfig?.proposalSubmitLabel ?? newConfig?.submitLabel ?? config.proposalSubmitLabel
        });

        applyStaticText(config);
    }

    function configureDashboardBoard(boardType, newConfig) {
        const target = String(boardType || '').toUpperCase();
        const title = newConfig?.title ?? newConfig?.boardTitle;

        if (target === 'NOTICE') {
            config = mergeConfig(config, { noticeTitle: title ?? config.noticeTitle });
        }
        else if (target === 'WORK_REQUEST') {
            config = mergeConfig(config, { workRequestTitle: title ?? config.workRequestTitle });
        }

        applyStaticText(config);
    }

    function configureDashboardExchange(newConfig) {
        config = mergeConfig(config, {
            exchangeTitle: newConfig?.exchangeTitle ?? newConfig?.title ?? config.exchangeTitle
        });

        applyStaticText(config);
    }

    function renderDashboardValues(values) {
        const data = buildRenderData(values || {});
        window.renderDashboard(data);
        applyStaticText(config);
        setCiImage(config.ciImageUrl);
    }

    function buildRenderData(values) {
        return {
            ciTitle: values.ciTitle ?? config.ciTitle,
            ciImageUrl: values.ciImageUrl ?? config.ciImageUrl,

            attendanceFieldMap: values.attendanceFieldMap,
            attendanceItems: values.attendanceItems ?? [],

            approvalItems: buildApprovalItems(values),

            proposalTargetCount: values.proposalTargetCount ?? 0,
            proposalSubmitCount: values.proposalSubmitCount ?? 0,

            noticeFieldMap: values.noticeFieldMap,
            notices: values.notices ?? [],

            workRequestFieldMap: values.workRequestFieldMap,
            workRequests: values.workRequests ?? [],

            exchangeFieldMap: values.exchangeFieldMap,
            exchangeBaseDate: values.exchangeBaseDate,
            exchangeRates: values.exchangeRates ?? []
        };
    }

    function buildApprovalItems(values) {
        const valueItems = values.approvalItems || [];

        return config.approvalItems.map(function (item, index) {
            const valueItem = valueItems[index] || {};

            return {
                title: valueItem.title ?? item.title,
                count: valueItem.count ?? valueItem.Count ?? 0,
                foot: valueItem.foot ?? valueItem.footer ?? item.foot
            };
        });
    }

    function applyStaticText(model) {
        setText('ciTitle', model.ciTitle || 'CI');
        setTextBySelector('.attendance .card-title', model.attendanceTitle);
        setTextBySelector('.attendance .card-foot', model.attendanceFoot);

        setText('approvalTitle1', model.approvalItems[0]?.title || '');
        setText('approvalTitle2', model.approvalItems[1]?.title || '');
        setText('approvalTitle3', model.approvalItems[2]?.title || '');
        setText('approvalFoot1', model.approvalItems[0]?.foot || '');
        setText('approvalFoot2', model.approvalItems[1]?.foot || '');
        setText('approvalFoot3', model.approvalItems[2]?.foot || '');

        setTextBySelector('.proposal .card-title', model.proposalTitle);
        setTextBySelector('.proposal-stat:nth-child(1) .proposal-stat-label', model.proposalTargetLabel);
        setTextBySelector('.proposal-stat:nth-child(2) .proposal-stat-label', model.proposalSubmitLabel);

        setTextBySelector('.notice .board-title', model.noticeTitle);
        setTextBySelector('.work-request .board-title', model.workRequestTitle);
        setTextBySelector('.exchange-title', model.exchangeTitle);
    }

    function mergeConfig(base, next) {
        const merged = { ...base, ...next };

        if (next.approvalItems) {
            merged.approvalItems = base.approvalItems.map(function (item, index) {
                return { ...item, ...(next.approvalItems[index] || {}) };
            });
        }

        return merged;
    }

    function setCiImage(url) {
        const ci = document.querySelector('.ci');
        const img = document.getElementById('ciImage');

        if (!ci || !img) {
            return;
        }

        if (!url) {
            img.removeAttribute('src');
            ci.classList.remove('has-image');
            return;
        }

        img.src = url;
        ci.classList.add('has-image');
    }

    function setText(id, value) {
        const el = document.getElementById(id);

        if (el && value !== undefined && value !== null) {
            el.innerText = value;
        }
    }

    function setTextBySelector(selector, value) {
        const el = document.querySelector(selector);

        if (el && value !== undefined && value !== null) {
            el.innerText = value;
        }
    }

    return {
        configureDashboard,
        configureDashboardCi,
        configureDashboardAttendance,
        configureDashboardApproval,
        configureDashboardProposal,
        configureDashboardBoard,
        configureDashboardExchange,
        renderDashboardValues
    };
})();

window.configureDashboard = DashboardConfig.configureDashboard;
window.configureDashboardCi = DashboardConfig.configureDashboardCi;
window.configureDashboardAttendance = DashboardConfig.configureDashboardAttendance;
window.configureDashboardApproval = DashboardConfig.configureDashboardApproval;
window.configureDashboardProposal = DashboardConfig.configureDashboardProposal;
window.configureDashboardBoard = DashboardConfig.configureDashboardBoard;
window.configureDashboardExchange = DashboardConfig.configureDashboardExchange;
window.renderDashboardValues = DashboardConfig.renderDashboardValues;

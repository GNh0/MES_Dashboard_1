const DashboardApp = (() => {
    const defaultConfig = {
        ciTitle: 'CI',
        ciImageUrl: '',
        attendanceTitle: '근태현황',
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

    const defaultData = {
        attendanceFieldMap: { name: 'GUBUNNM', count: 'CNT', unit: 'UNIT' },
        attendanceItems: [],
        approvalItems: [{ count: 0 }, { count: 0 }, { count: 0 }],
        proposalTargetCount: 0,
        proposalSubmitCount: 0,
        noticeFieldMap: { key: 'SEQ', title: 'TITLE', writer: 'WRITER', date: 'WRTDT' },
        workRequestFieldMap: { key: 'REQNO', title: 'TITLE', writer: 'WRITER', date: 'REQDT' },
        exchangeFieldMap: { name: 'CURRNM', value: 'RATE', unit: 'UNIT', date: 'BASISDT' },
        notices: [],
        workRequests: [],
        exchangeRates: []
    };

    let config = structuredCloneSafe(defaultConfig);

    document.addEventListener('click', function (e) {
        const actionElement = e.target.closest('[data-click-type]');

        if (actionElement) {
            e.stopPropagation();
            postToCSharp({
                type: actionElement.dataset.clickType,
                target: actionElement.dataset.target || ''
            });
            return;
        }

        const targetElement = e.target.closest('[data-target]');

        if (!targetElement) {
            return;
        }

        postToCSharp({
            type: 'DASHBOARD_BOX_CLICK',
            target: targetElement.dataset.target || ''
        });
    });

    function configureDashboard(newConfig) {
        config = mergeConfig(config, newConfig || {});
        applyStaticText();
    }

    function configureDashboardCi(newConfig) {
        config = mergeConfig(config, {
            ciTitle: newConfig?.ciTitle ?? newConfig?.title ?? config.ciTitle,
            ciImageUrl: newConfig?.ciImageUrl ?? newConfig?.imageUrl ?? config.ciImageUrl
        });
        applyStaticText();
    }

    function configureDashboardAttendance(newConfig) {
        config = mergeConfig(config, {
            attendanceTitle: newConfig?.attendanceTitle ?? newConfig?.title ?? config.attendanceTitle
        });
        applyStaticText();
    }

    function configureDashboardApproval(indexOrItems, newConfig) {
        if (Array.isArray(indexOrItems)) {
            config = mergeConfig(config, { approvalItems: indexOrItems });
            applyStaticText();
            return;
        }

        const index = Number(indexOrItems) - 1;

        if (index < 0 || index >= config.approvalItems.length) {
            return;
        }

        const approvalItems = config.approvalItems.map(function (item, itemIndex) {
            return itemIndex === index ? { ...item, ...(newConfig || {}) } : item;
        });

        config = mergeConfig(config, { approvalItems });
        applyStaticText();
    }

    function configureDashboardProposal(newConfig) {
        config = mergeConfig(config, {
            proposalTitle: newConfig?.proposalTitle ?? newConfig?.title ?? config.proposalTitle,
            proposalTargetLabel: newConfig?.proposalTargetLabel ?? newConfig?.targetLabel ?? config.proposalTargetLabel,
            proposalSubmitLabel: newConfig?.proposalSubmitLabel ?? newConfig?.submitLabel ?? config.proposalSubmitLabel
        });
        applyStaticText();
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

        applyStaticText();
    }

    function configureDashboardExchange(newConfig) {
        config = mergeConfig(config, {
            exchangeTitle: newConfig?.exchangeTitle ?? newConfig?.title ?? config.exchangeTitle
        });
        applyStaticText();
    }

    function renderDashboard(rawData) {
        const model = normalizeFullData(rawData || {});

        setCiImage(model.ciImageUrl);
        setText('ciTitle', model.ciTitle || config.ciTitle || 'CI');
        renderAttendance(model.attendanceItems, model.attendanceFieldMap);
        renderApproval(model.approvalItems);
        renderProposalChart(model.proposalTargetCount, model.proposalSubmitCount);
        renderBoard('noticeList', model.notices, 'NOTICE_DETAIL', model.noticeFieldMap);
        renderBoard('workRequestList', model.workRequests, 'WORK_REQUEST_DETAIL', model.workRequestFieldMap);
        renderExchangeRates(model.exchangeRates, model.exchangeFieldMap);
        applyStaticText();
    }

    function renderDashboardValues(values) {
        const data = values || {};
        renderDashboard({
            ...data,
            ciTitle: data.ciTitle ?? config.ciTitle,
            ciImageUrl: data.ciImageUrl ?? config.ciImageUrl,
            approvalItems: buildApprovalItems(data.approvalItems || [])
        });
    }

    function normalizeFullData(data) {
        return {
            ciTitle: data.ciTitle ?? data.CiTitle ?? config.ciTitle,
            ciImageUrl: data.ciImageUrl ?? data.CiImageUrl ?? config.ciImageUrl,
            attendanceFieldMap: data.attendanceFieldMap ?? data.AttendanceFieldMap ?? defaultData.attendanceFieldMap,
            attendanceItems: data.attendanceItems ?? data.AttendanceItems ?? makeLegacyAttendanceItems(data),
            approvalItems: data.approvalItems ?? data.ApprovalItems ?? buildApprovalItems([]),
            proposalTargetCount: data.proposalTargetCount ?? data.ProposalTargetCount ?? defaultData.proposalTargetCount,
            proposalSubmitCount: data.proposalSubmitCount ?? data.ProposalSubmitCount ?? defaultData.proposalSubmitCount,
            noticeFieldMap: data.noticeFieldMap ?? data.NoticeFieldMap ?? defaultData.noticeFieldMap,
            workRequestFieldMap: data.workRequestFieldMap ?? data.WorkRequestFieldMap ?? defaultData.workRequestFieldMap,
            exchangeFieldMap: data.exchangeFieldMap ?? data.ExchangeFieldMap ?? defaultData.exchangeFieldMap,
            exchangeRates: data.exchangeRates ?? data.ExchangeRates ?? makeLegacyExchangeRates(data),
            notices: data.notices ?? data.Notices ?? defaultData.notices,
            workRequests: data.workRequests ?? data.WorkRequests ?? defaultData.workRequests
        };
    }

    function buildApprovalItems(valueItems) {
        return config.approvalItems.map(function (item, index) {
            const valueItem = valueItems[index] || {};

            return {
                title: valueItem.title ?? valueItem.Title ?? item.title,
                count: valueItem.count ?? valueItem.Count ?? 0,
                foot: valueItem.foot ?? valueItem.Foot ?? valueItem.footer ?? valueItem.Footer ?? item.foot
            };
        });
    }

    function renderAttendance(rows, fieldMap) {
        const list = document.getElementById('attendanceList');
        list.innerHTML = '';

        if (!rows || rows.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'attendance-row attendance-empty';
            empty.innerText = '조회된 근태현황이 없습니다.';
            list.appendChild(empty);
            return;
        }

        rows.forEach(function (row) {
            const name = getFieldValue(row, fieldMap.name, ['name', 'Name', 'TITLE', 'title', 'GUBUNNM', 'gubunnm', 'ATTNM', 'attnm']);
            const count = getFieldValue(row, fieldMap.count, ['count', 'Count', 'CNT', 'cnt', 'QTY', 'qty']);
            const unit = getFieldValue(row, fieldMap.unit, ['unit', 'Unit', 'UNIT', 'unitnm', 'UNITNM']) || '건';
            const item = document.createElement('div');

            item.className = 'attendance-row';
            item.innerHTML =
                '<div class="attendance-name">' + escapeHtml(name || '-') + '</div>' +
                '<div class="attendance-count-wrap">' +
                    '<span class="attendance-count">' + escapeHtml(formatCountValue(count)) + '</span>' +
                    '<span class="attendance-unit">' + escapeHtml(unit) + '</span>' +
                '</div>';

            list.appendChild(item);
        });
    }

    function renderApproval(items) {
        for (let i = 0; i < 3; i++) {
            const defaultItem = config.approvalItems[i] || { title: '미결', count: 0, foot: '' };
            const item = items[i] || defaultItem;

            setText('approvalTitle' + (i + 1), item.title ?? item.Title ?? defaultItem.title);
            setText('approvalCount' + (i + 1), item.count ?? item.Count ?? defaultItem.count ?? 0);
            setText('approvalFoot' + (i + 1), item.foot ?? item.Foot ?? item.footer ?? item.Footer ?? defaultItem.foot);
        }
    }

    function renderProposalChart(targetCount, submitCount) {
        const target = toNumber(targetCount);
        const submit = toNumber(submitCount);
        const donut = document.getElementById('proposalDonut');
        const percentEl = document.getElementById('proposalPercent');
        const ratioEl = document.getElementById('proposalRatio');

        setText('proposalTargetCount', target);
        setText('proposalSubmitCount', submit);

        if (!donut || !percentEl || !ratioEl) {
            return;
        }

        const percent = target > 0 ? (submit / target) * 100 : 0;
        const displayPercent = Math.round(percent);
        const chartPercent = Math.max(0, Math.min(percent, 100));

        donut.style.setProperty('--rate', chartPercent + '%');
        percentEl.innerText = displayPercent + '%';
        ratioEl.innerText = submit + ' / ' + target;
    }

    function renderBoard(elementId, rows, detailType, fieldMap) {
        const list = document.getElementById(elementId);
        list.innerHTML = '';

        if (!rows || rows.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'board-row empty-row';
            empty.innerHTML = '<div class="board-row-title">조회된 내용이 없습니다.</div>';
            list.appendChild(empty);
            return;
        }

        rows.forEach(function (row) {
            const key = getFieldValue(row, fieldMap.key, ['key', 'Key', 'SEQ', 'seq', 'NO', 'no', 'ID', 'id']);
            const title = getFieldValue(row, fieldMap.title, ['title', 'Title', 'TITLE', 'SUBJECT', 'subject', 'SUBJECTNM', 'subjectnm', 'CONTENT', 'content']);
            const writer = getFieldValue(row, fieldMap.writer, ['writer', 'Writer', 'WRITER', 'USERNM', 'usernm', 'EMPNM', 'empnm']);
            const date = formatBoardDate(getFieldValue(row, fieldMap.date, ['date', 'Date', 'DATE', 'WRTDT', 'wrtdt', 'REGDT', 'regdt', 'INDT', 'indt']));
            const itemTitle = title || '(제목 없음)';
            const boardRow = document.createElement('div');

            boardRow.className = 'board-row';
            boardRow.title = writer ? itemTitle + ' / ' + writer : itemTitle;
            boardRow.addEventListener('click', function (e) {
                e.stopPropagation();
                postToCSharp({
                    type: detailType,
                    key: key,
                    title: itemTitle,
                    writer: writer,
                    date: date,
                    row: row
                });
            });
            boardRow.innerHTML =
                '<div class="board-row-title">' + escapeHtml(itemTitle) + '</div>' +
                '<div class="board-row-date">' + escapeHtml(date) + '</div>';

            list.appendChild(boardRow);
        });
    }

    function renderExchangeRates(rows, fieldMap) {
        const list = document.getElementById('exchangeRateList');
        list.innerHTML = '';
        setHtml('exchangeBaseDate', getTodayText());

        if (!rows || rows.length === 0) {
            const empty = document.createElement('div');
            empty.innerHTML = '<span class="rate-name">조회된 환율이 없습니다.</span>';
            list.appendChild(empty);
            return;
        }

        rows.slice(0, 4).forEach(function (row) {
            const name = getFieldValue(row, fieldMap.name, ['name', 'Name', 'CURRNM', 'currnm', 'CURCD', 'curcd', 'CODE', 'code', 'currency', 'Currency']);
            const value = getFieldValue(row, fieldMap.value, ['value', 'Value', 'RATE', 'rate', 'EXRATE', 'exrate', 'AMT', 'amt']);
            const unit = getFieldValue(row, fieldMap.unit, ['unit', 'Unit', 'UNIT', 'unitnm', 'UNITNM']);
            const item = document.createElement('div');

            item.innerHTML =
                '<span class="rate-name">' + escapeHtml(name || '-') + '</span>' +
                '<span class="rate-value">' + escapeHtml(formatRateValue(value, unit)) + '</span>';

            list.appendChild(item);
        });
    }

    function applyStaticText() {
        setText('ciTitle', config.ciTitle || 'CI');
        setCiImage(config.ciImageUrl);
        setTextBySelector('.attendance .card-title', config.attendanceTitle);
        setTextBySelector('.attendance .card-foot', getTodayText());
        setText('approvalTitle1', config.approvalItems[0]?.title || '');
        setText('approvalTitle2', config.approvalItems[1]?.title || '');
        setText('approvalTitle3', config.approvalItems[2]?.title || '');
        setText('approvalFoot1', config.approvalItems[0]?.foot || '');
        setText('approvalFoot2', config.approvalItems[1]?.foot || '');
        setText('approvalFoot3', config.approvalItems[2]?.foot || '');
        setTextBySelector('.proposal .card-title', config.proposalTitle);
        setTextBySelector('.proposal-stat:nth-child(1) .proposal-stat-label', config.proposalTargetLabel);
        setTextBySelector('.proposal-stat:nth-child(2) .proposal-stat-label', config.proposalSubmitLabel);
        setTextBySelector('.notice .board-title', config.noticeTitle);
        setTextBySelector('.work-request .board-title', config.workRequestTitle);
        setTextBySelector('.exchange-title', config.exchangeTitle);
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

    function makeLegacyAttendanceItems(data) {
        const annualCount = data.annualCount ?? data.AnnualCount;

        if (annualCount === undefined || annualCount === null) {
            return defaultData.attendanceItems || [];
        }

        return [{ name: '연차', count: annualCount, unit: '건' }];
    }

    function makeLegacyExchangeRates(data) {
        const rates = [];
        const dollarRate = data.dollarRate ?? data.DollarRate;
        const yenRate = data.yenRate ?? data.YenRate;

        if (dollarRate !== undefined && dollarRate !== null && dollarRate !== '') {
            rates.push({ name: '달러', value: dollarRate });
        }

        if (yenRate !== undefined && yenRate !== null && yenRate !== '') {
            rates.push({ name: '엔화', value: yenRate });
        }

        return rates;
    }

    function getFieldValue(row, fieldName, fallbackNames) {
        if (!row) {
            return '';
        }

        if (fieldName && row[fieldName] !== undefined && row[fieldName] !== null) {
            return row[fieldName];
        }

        for (const name of fallbackNames || []) {
            if (row[name] !== undefined && row[name] !== null) {
                return row[name];
            }
        }

        return '';
    }

    function formatBoardDate(value) {
        const text = String(value ?? '').trim();

        if (isYmd(text)) {
            return text.substring(0, 4) + '-' + text.substring(4, 6) + '-' + text.substring(6, 8);
        }

        if (text.length >= 10 && text.charAt(4) === '-' && text.charAt(7) === '-') {
            return text.substring(0, 10);
        }

        return text;
    }

    function getTodayText() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}년 ${mm}월${dd}일기준`;
    }

    function formatRateValue(value, unit) {
        const text = String(value ?? '').trim();
        const unitText = String(unit ?? '').trim();

        if (!text) {
            return '-';
        }

        const number = Number(text.replaceAll(',', ''));

        if (!isNaN(number)) {
            return number.toLocaleString(undefined, { maximumFractionDigits: 4 }) + (unitText ? ' ' + unitText : '');
        }

        return text + (unitText ? ' ' + unitText : '');
    }

    function formatCountValue(value) {
        const number = Number(String(value ?? '').replaceAll(',', ''));

        if (!isNaN(number)) {
            return number.toLocaleString();
        }

        return String(value ?? '0');
    }

    function postToCSharp(message) {
        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage(message);
            return;
        }

        console.log('[WebView2 message]', message);
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

    function setHtml(id, value) {
        const el = document.getElementById(id);

        if (el && value !== undefined && value !== null) {
            el.innerHTML = value;
        }
    }

    function setTextBySelector(selector, value) {
        const el = document.querySelector(selector);

        if (el && value !== undefined && value !== null) {
            el.innerText = value;
        }
    }

    function toNumber(value) {
        const number = Number(value ?? 0);
        return isNaN(number) ? 0 : number;
    }

    function isYmd(value) {
        if (!value || value.length !== 8) {
            return false;
        }

        for (let i = 0; i < value.length; i++) {
            const code = value.charCodeAt(i);
            if (code < 48 || code > 57) {
                return false;
            }
        }

        return true;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function structuredCloneSafe(value) {
        return JSON.parse(JSON.stringify(value));
    }

    return {
        configureDashboard,
        configureDashboardCi,
        configureDashboardAttendance,
        configureDashboardApproval,
        configureDashboardProposal,
        configureDashboardBoard,
        configureDashboardExchange,
        renderDashboard,
        renderDashboardValues
    };
})();

window.configureDashboard = DashboardApp.configureDashboard;
window.configureDashboardCi = DashboardApp.configureDashboardCi;
window.configureDashboardAttendance = DashboardApp.configureDashboardAttendance;
window.configureDashboardApproval = DashboardApp.configureDashboardApproval;
window.configureDashboardProposal = DashboardApp.configureDashboardProposal;
window.configureDashboardBoard = DashboardApp.configureDashboardBoard;
window.configureDashboardExchange = DashboardApp.configureDashboardExchange;
window.renderDashboard = DashboardApp.renderDashboard;
window.renderDashboardValues = DashboardApp.renderDashboardValues;

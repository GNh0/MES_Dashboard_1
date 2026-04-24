const Dashboard = (() => {
    const defaultData = {
        ciTitle: 'CI',
        ciImageUrl: '',

        attendanceFieldMap: { name: 'GUBUNNM', count: 'CNT', unit: 'UNIT' },
        attendanceItems: [],

        approvalItems: [
            { title: '미결', count: 0 },
            { title: '미결', count: 0 },
            { title: '미결', count: 0 }
        ],

        proposalTargetCount: 0,
        proposalSubmitCount: 0,

        noticeFieldMap: { key: 'SEQ', title: 'TITLE', writer: 'WRITER', date: 'WRTDT' },
        workRequestFieldMap: { key: 'REQNO', title: 'TITLE', writer: 'WRITER', date: 'REQDT' },
        exchangeFieldMap: { name: 'CURRNM', value: 'RATE', unit: 'UNIT', date: 'BASISDT' },

        exchangeBaseDate: '',
        exchangeRates: [],
        notices: [],
        workRequests: []
    };

    document.addEventListener('click', function (e) {
        const targetElement = e.target.closest('[data-target]');

        if (!targetElement) {
            return;
        }

        sendBoxClick(targetElement.dataset.target);
    });

    function renderDashboard(data) {
        const model = normalizeData(data);

        setText('ciTitle', model.ciTitle || 'CI');
        setCiImage(model.ciImageUrl);

        renderAttendance(model.attendanceItems || [], model.attendanceFieldMap);
        renderApproval(model.approvalItems || []);
        renderProposalChart(model.proposalTargetCount ?? 0, model.proposalSubmitCount ?? 0);
        renderBoard('noticeList', model.notices || [], 'NOTICE_DETAIL', model.noticeFieldMap);
        renderBoard('workRequestList', model.workRequests || [], 'WORK_REQUEST_DETAIL', model.workRequestFieldMap);
        renderExchangeRates(model.exchangeRates || [], model.exchangeFieldMap, model.exchangeBaseDate);
    }

    function normalizeData(data) {
        if (!data) {
            return { ...defaultData };
        }

        const exchangeRates = data.exchangeRates ?? data.ExchangeRates ?? makeLegacyExchangeRates(data);

        return {
            ciTitle: data.ciTitle ?? data.CiTitle ?? defaultData.ciTitle,
            ciImageUrl: data.ciImageUrl ?? data.CiImageUrl ?? defaultData.ciImageUrl,

            attendanceFieldMap: data.attendanceFieldMap ?? data.AttendanceFieldMap ?? defaultData.attendanceFieldMap,
            attendanceItems: data.attendanceItems ?? data.AttendanceItems ?? makeLegacyAttendanceItems(data),

            approvalItems: data.approvalItems ?? data.ApprovalItems ?? makeApprovalItems(data),
            proposalTargetCount: data.proposalTargetCount ?? data.ProposalTargetCount ?? defaultData.proposalTargetCount,
            proposalSubmitCount: data.proposalSubmitCount ?? data.ProposalSubmitCount ?? defaultData.proposalSubmitCount,

            noticeFieldMap: data.noticeFieldMap ?? data.NoticeFieldMap ?? defaultData.noticeFieldMap,
            workRequestFieldMap: data.workRequestFieldMap ?? data.WorkRequestFieldMap ?? defaultData.workRequestFieldMap,
            exchangeFieldMap: data.exchangeFieldMap ?? data.ExchangeFieldMap ?? defaultData.exchangeFieldMap,

            exchangeBaseDate: data.exchangeBaseDate ?? data.ExchangeBaseDate ?? defaultData.exchangeBaseDate,
            exchangeRates: exchangeRates,
            notices: data.notices ?? data.Notices ?? defaultData.notices,
            workRequests: data.workRequests ?? data.WorkRequests ?? defaultData.workRequests
        };
    }

    function makeLegacyAttendanceItems(data) {
        const annualCount = data.annualCount ?? data.AnnualCount;

        if (annualCount === undefined || annualCount === null) {
            return defaultData.attendanceItems || [];
        }

        return [
            { name: '연차', count: annualCount, unit: '건' }
        ];
    }

    function makeApprovalItems(data) {
        return [
            { title: data.approvalTitle1 ?? data.ApprovalTitle1 ?? '미결', count: data.approvalCount1 ?? data.ApprovalCount1 ?? 0 },
            { title: data.approvalTitle2 ?? data.ApprovalTitle2 ?? '미결', count: data.approvalCount2 ?? data.ApprovalCount2 ?? 0 },
            { title: data.approvalTitle3 ?? data.ApprovalTitle3 ?? '미결', count: data.approvalCount3 ?? data.ApprovalCount3 ?? 0 }
        ];
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

        rows.slice(0, 3).forEach(function (row) {
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
            const item = items[i] || { title: '미결', count: 0 };
            setText('approvalTitle' + (i + 1), item.title ?? item.Title ?? '미결');
            setText('approvalCount' + (i + 1), item.count ?? item.Count ?? 0);
        }
    }

    function renderProposalChart(targetCount, submitCount) {
        const target = toNumber(targetCount);
        const submit = toNumber(submitCount);

        setText('proposalTargetCount', target);
        setText('proposalSubmitCount', submit);

        const donut = document.getElementById('proposalDonut');
        const percentEl = document.getElementById('proposalPercent');
        const ratioEl = document.getElementById('proposalRatio');

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

    function renderExchangeRates(rows, fieldMap, baseDate) {
        const list = document.getElementById('exchangeRateList');
        list.innerHTML = '';

        const firstDate = rows && rows.length > 0
            ? getFieldValue(rows[0], fieldMap.date, ['date', 'Date', 'DATE', 'BASISDT', 'basisdt', 'BASEDT', 'basedt', 'EXCHDT', 'exchdt'])
            : '';

        setHtml('exchangeBaseDate', formatBaseDate(baseDate || firstDate));

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
            return text.substring(4, 6) + '-' + text.substring(6, 8);
        }

        if (text.length >= 10 && text.charAt(4) === '-' && text.charAt(7) === '-') {
            return text.substring(5, 10);
        }

        return text;
    }

    function formatBaseDate(value) {
        const text = String(value ?? '').trim();

        if (isYmd(text)) {
            return text.substring(0, 4) + '년 ' + text.substring(4, 6) + '월' + text.substring(6, 8) + '일기준';
        }

        const crlf = String.fromCharCode(13) + String.fromCharCode(10);
        const lf = String.fromCharCode(10);

        return escapeHtml(text || '0000년 00월00일기준')
            .replaceAll(crlf, ' ')
            .replaceAll(lf, ' ');
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

    function sendBoxClick(target) {
        postToCSharp({
            type: 'DASHBOARD_BOX_CLICK',
            target: target
        });
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

        if (el) {
            el.innerText = value;
        }
    }

    function setHtml(id, value) {
        const el = document.getElementById(id);

        if (el) {
            el.innerHTML = value;
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

    return {
        renderDashboard
    };
})();

window.renderDashboard = Dashboard.renderDashboard;

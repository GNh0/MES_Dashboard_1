(() => {
    function id(name) {
        return document.getElementById(name);
    }

    function esc(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function formatCount(value) {
        const number = Number(String(value ?? '').replaceAll(',', ''));
        return !isNaN(number) ? number.toLocaleString() : String(value ?? '0');
    }

    function getValueIgnoreCase(obj, name) {
        if (!obj || !name) return undefined;
        if (obj[name] != null) return obj[name];

        const key = Object.keys(obj).find(function (item) {
            return item.toLowerCase() === String(name).toLowerCase();
        });

        return key ? obj[key] : undefined;
    }

    function getField(row, fieldName, fallbackNames) {
        if (!row) return '';

        const names = [];
        if (fieldName) names.push(fieldName);
        for (const fallbackName of fallbackNames || []) names.push(fallbackName);

        for (const name of names) {
            if (row[name] != null) return row[name];
        }

        const rowKeys = Object.keys(row);
        for (const name of names) {
            const key = rowKeys.find(function (item) {
                return item.toLowerCase() === String(name).toLowerCase();
            });

            if (key && row[key] != null) return row[key];
        }

        return '';
    }

    function filterRowsByKey(rows, keyColumn, keyData) {
        if (!Array.isArray(rows)) return [];
        if (!keyColumn || keyData == null || keyData === '') return rows;

        return rows.filter(function (row) {
            const value = getField(row, keyColumn, [keyColumn]);
            return String(value ?? '').toLowerCase() === String(keyData ?? '').toLowerCase();
        });
    }

    function getApprovalRows(model) {
        model = model || {};

        const fieldMap = model.fieldMap || {};
        const sourceRows = model.items ?? model.metrics ?? model.values ?? [];
        const rows = filterRowsByKey(sourceRows, model.keyColumn, model.keyData);

        const labelField = getValueIgnoreCase(fieldMap, 'label');
        const countField = getValueIgnoreCase(fieldMap, 'count');
        const unitField = getValueIgnoreCase(fieldMap, 'unit');

        if (Array.isArray(rows)) {
            return rows.map(function (row) {
                return {
                    // label은 C# fieldMap에 label을 명시한 경우에만 표시합니다.
                    // 미결재/기결재처럼 count만 보여야 하는 카드는 GUBUNNM이 있어도 중앙 숫자만 표시됩니다.
                    label: labelField ? getField(row, labelField, ['label', 'LABEL', 'title', 'TITLE', 'name', 'NAME', 'GUBUNNM']) : '',
                    count: getField(row, countField, ['count', 'COUNT', 'Count', 'CNT']),
                    unit: getField(row, unitField, ['unit', 'UNIT', 'Unit']) || model.unit || model.UNIT || '건'
                };
            }).filter(function (row) {
                return row.label !== '' || row.count !== '' || row.unit !== '';
            });
        }

        return [];
    }

    function renderApproval(index, model) {
        const list = id('approvalList' + index);
        if (!list) return;

        const rows = getApprovalRows(model);

        if (rows.length === 0) {
            list.className = 'metric-list empty';
            list.innerHTML = '';
            return;
        }

        const isSingle = rows.length <= 1 && !rows[0].label;
        list.className = 'metric-list' + (isSingle ? ' single' : '');
        list.innerHTML = '';

        rows.slice(0, 5).forEach(function (row) {
            const item = document.createElement('div');
            item.className = 'metric-row';
            item.innerHTML =
                '<div class="metric-label">' + esc(row.label) + '</div>' +
                '<div class="metric-count-wrap">' +
                '<span class="metric-count">' + esc(formatCount(row.count)) + '</span>' +
                '<span class="metric-row-unit">' + esc(row.unit || '건') + '</span>' +
                '</div>';
            list.appendChild(item);
        });
    }

    const oldConfigureDashboardApproval = window.configureDashboardApproval;

    window.configureDashboardApproval = function (indexOrItems, model) {
        if (Array.isArray(indexOrItems)) {
            if (typeof oldConfigureDashboardApproval === 'function') {
                oldConfigureDashboardApproval(indexOrItems, model);
            }

            indexOrItems.slice(0, 3).forEach(function (item, index) {
                renderApproval(index + 1, item);
            });
            return;
        }

        if (typeof oldConfigureDashboardApproval === 'function') {
            oldConfigureDashboardApproval(indexOrItems, model);
        }

        renderApproval(Number(indexOrItems), model || {});
    };

    window.renderDashboardApproval = renderApproval;
    window.renderDashboardApproval1 = function (model) { renderApproval(1, model || {}); };
    window.renderDashboardApproval2 = function (model) { renderApproval(2, model || {}); };
    window.renderDashboardApproval3 = function (model) { renderApproval(3, model || {}); };
})();

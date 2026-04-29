# Dashboard rendering rules

이 문서는 대시보드 HTML/JS에서 자주 바뀌는 데이터 매핑 규칙을 정리한 문서입니다.

## 결재 카드 표시 규칙

결재 카드 1, 2, 3은 `configureDashboardApproval(index, model)`로 렌더링합니다.

### 1. label이 없는 단일 행은 중앙 숫자 표시

`fieldMap`에 `label`을 넘기지 않고, `keyColumn/keyData` 필터 결과가 1행이면 카드 중앙에 숫자와 단위만 표시합니다.

```csharp
await ExecuteDashboardFunctionAsync("configureDashboardApproval", 1, new
{
    title = "미결재",
    foot = "",
    keyColumn = "APPSTS",
    keyData = "N",
    fieldMap = new
    {
        count = "CNT",
        unit = "UNIT"
    },
    items = dt
});
```

DataTable 예시:

```sql
SELECT 'N' AS APPSTS
     , '미결재' AS GUBUNNM
     , 1 AS CNT
     , '건' AS UNIT
```

`GUBUNNM` 컬럼이 있어도 `fieldMap.label`이 없으면 label을 표시하지 않습니다. 따라서 화면에는 중앙에 다음처럼 표시됩니다.

```text
1 건
```

단위가 `개`이면 다음처럼 표시됩니다.

```text
1 개
```

### 2. label이 있는 다중 행은 리스트 표시

`fieldMap.label`을 명시하면 label + count + unit 형태로 리스트 표시합니다.

```csharp
await ExecuteDashboardFunctionAsync("configureDashboardApproval", 3, new
{
    title = "참조",
    foot = "",
    keyColumn = "APPSTS",
    keyData = "S",
    fieldMap = new
    {
        label = "GUBUNNM",
        count = "CNT",
        unit = "UNIT"
    },
    items = dt
});
```

DataTable 예시:

```sql
SELECT 'S' AS APPSTS, '확인' AS GUBUNNM, 2 AS CNT, '건' AS UNIT
UNION ALL
SELECT 'S' AS APPSTS, '미확인' AS GUBUNNM, 5 AS CNT, '건' AS UNIT
```

화면은 다음처럼 표시됩니다.

```text
확인    2 건
미확인  5 건
```

## keyColumn/keyData 규칙

하나의 DataTable을 여러 카드에서 공유할 때 사용합니다.

```csharp
keyColumn = "APPSTS",
keyData = "N"
```

JS에서는 `APPSTS = N`인 행만 필터링해서 해당 카드에 표시합니다.

## fieldMap 규칙

`fieldMap`은 C# DataTable 컬럼명을 JS의 표시 역할에 매핑합니다.

```csharp
fieldMap = new
{
    label = "GUBUNNM",
    count = "CNT",
    unit = "UNIT"
}
```

대소문자는 JS에서 가능한 한 무시합니다. 예를 들어 `CNT`, `cnt`, `Cnt`는 같은 의미로 찾습니다.

## 파일 구조 기준

현재 GitHub Pages용 파일 배포 방식은 아래 파일들이 기준입니다.

```text
index.html
css/dashboard.css
js/dashboard-app.js
js/dashboard-fix.js
js/sample-data.js
```

`dashboard-fix.js`는 결재 카드의 단일 행 중앙 숫자 표시 규칙을 보정합니다.

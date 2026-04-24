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
        { SEQ: 'N001', TITLE: '공지사항 샘플 제목입니다.', WRITER: '관리자', WRTDT: '20260424' },
        { SEQ: 'N002', TITLE: '시스템 점검 안내입니다.', WRITER: '관리자', WRTDT: '20260423' },
        { SEQ: 'N003', TITLE: '업무 공지 안내입니다.', WRITER: '총무팀', WRTDT: '20260422' },
        { SEQ: 'N004', TITLE: '공지사항 네 번째 샘플입니다.', WRITER: '관리자', WRTDT: '20260421' },
        { SEQ: 'N005', TITLE: '공지사항 다섯 번째 샘플입니다.', WRITER: '관리자', WRTDT: '20260420' },
        { SEQ: 'N006', TITLE: '보안 점검 일정 안내입니다.', WRITER: '전산팀', WRTDT: '20260419' },
        { SEQ: 'N007', TITLE: '월말 재고조사 일정 안내입니다.', WRITER: '자재팀', WRTDT: '20260418' },
        { SEQ: 'N008', TITLE: '생산라인 정기점검 안내입니다.', WRITER: '생산팀', WRTDT: '20260417' },
        { SEQ: 'N009', TITLE: '품질 기준 변경 공지입니다.', WRITER: '품질팀', WRTDT: '20260416' },
        { SEQ: 'N010', TITLE: '사내 교육 일정 안내입니다.', WRITER: '총무팀', WRTDT: '20260415' },
        { SEQ: 'N011', TITLE: '출하 마감시간 변경 안내입니다.', WRITER: '영업팀', WRTDT: '20260414' },
        { SEQ: 'N012', TITLE: '시스템 사용 유의사항 안내입니다.', WRITER: '관리자', WRTDT: '20260413' }
    ],

    workRequestFieldMap: { key: 'REQNO', title: 'TITLE', writer: 'WRITER', date: 'REQDT' },
    workRequests: [
        { REQNO: 'W001', TITLE: '작업지시 확인 요청입니다.', WRITER: '생산팀', REQDT: '20260424' },
        { REQNO: 'W002', TITLE: '품질 확인 요청입니다.', WRITER: '품질팀', REQDT: '20260424' },
        { REQNO: 'W003', TITLE: '업무지시요청 샘플입니다.', WRITER: '관리자', REQDT: '20260423' },
        { REQNO: 'W004', TITLE: '설비 점검 요청입니다.', WRITER: '공무팀', REQDT: '20260422' },
        { REQNO: 'W005', TITLE: '자재 확인 요청입니다.', WRITER: '구매팀', REQDT: '20260421' },
        { REQNO: 'W006', TITLE: '긴급 출하 준비 요청입니다.', WRITER: '영업팀', REQDT: '20260420' },
        { REQNO: 'W007', TITLE: '공정 변경 확인 요청입니다.', WRITER: '생산관리', REQDT: '20260419' },
        { REQNO: 'W008', TITLE: '작업자 배정 확인 요청입니다.', WRITER: '생산팀', REQDT: '20260418' },
        { REQNO: 'W009', TITLE: '불량 원인 분석 요청입니다.', WRITER: '품질팀', REQDT: '20260417' },
        { REQNO: 'W010', TITLE: '부품 재고 확인 요청입니다.', WRITER: '자재팀', REQDT: '20260416' },
        { REQNO: 'W011', TITLE: '도면 최신본 확인 요청입니다.', WRITER: '설계팀', REQDT: '20260415' },
        { REQNO: 'W012', TITLE: '현장 개선사항 검토 요청입니다.', WRITER: '관리자', REQDT: '20260414' }
    ],

    exchangeFieldMap: { name: 'CURRNM', value: 'RATE', unit: 'UNIT', date: 'BASISDT' },
    exchangeBaseDate: '',
    exchangeRates: [
        { CURRNM: '달러', RATE: 1380.5, UNIT: '원', BASISDT: '20260424' },
        { CURRNM: '엔화', RATE: 9.12, UNIT: '원', BASISDT: '20260424' },
        { CURRNM: '유로', RATE: 1472.3, UNIT: '원', BASISDT: '20260424' }
    ]
});

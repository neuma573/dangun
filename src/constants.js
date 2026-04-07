// ════════════════════════════════════════
//  App-wide constants (extracted from original inline script)
// ════════════════════════════════════════

export const PLANS = {
  'E':  { name:'E플랜',  target:1000,  fee:880000,   maxTarget:1000  },
  'D':  { name:'D플랜',  target:2000,  fee:1760000,  maxTarget:2000  },
  'C':  { name:'C플랜',  target:3000,  fee:2640000,  maxTarget:3000  },
  'B':  { name:'B플랜',  target:4000,  fee:3520000,  maxTarget:4000  },
  'A':  { name:'A플랜',  target:5000,  fee:4400000,  maxTarget:5000  },
  'A1': { name:'A1플랜', target:6000,  fee:5280000,  maxTarget:6000  },
  'A2': { name:'A2플랜', target:7000,  fee:6160000,  maxTarget:7000  },
  'S':  { name:'S플랜',  target:8000,  fee:7040000,  maxTarget:8000  },
  'S1': { name:'S1플랜', target:9000,  fee:7920000,  maxTarget:9000  },
  'S2': { name:'S2플랜', target:10000, fee:8800000,  maxTarget:10000 },
};

export const STEPS = [
  { label:'1차콜' }, { label:'2차콜' }, { label:'계약서 완료' },
  { label:'일일보고 요청' }, { label:'신용 조회' }, { label:'PDF 전달' },
  { label:'사업계획서' }, { label:'보증드림' },
  { label:'보증료 안내' }, { label:'신청완료' },
  { label:'약정대기' }, { label:'약정완료' }, { label:'수금대기' },
];

// Steps at or after this index are "post-apply" and only shown once reached
export const APPLY_STEP_IDX = 9;

export const DOCS_SOLE = ['임대차계약서 (사업장)', '신분증', '사업자등록증'];

export const DOCS_CORP = [
  '법인등기부등본', '법인 인감증명서', '법인 인감도장',
  '사업자등록증', '신분증', '임대차계약서 (사업장)',
];

export const APPLY_ROUTES = [
  { id:'bojeung',   icon:'🏦',  name:'보증드림',                 desc:'신용보증재단 보증부 정책자금' },
  { id:'seoul',     icon:'🏙️', name:'서울신용보증재단',          desc:'서울신용보증재단 직접 신청' },
  { id:'gyeonggi', icon:'🌿',  name:'경기신용보증재단(Easy One)',desc:'경기신용보증재단 Easy One 신청' },
  { id:'jaedan',   icon:'🏛️', name:'재단방문예약',              desc:'재단 직접 방문 예약 신청' },
  { id:'kakao',    icon:'💛',  name:'카카오뱅크',               desc:'카카오뱅크 사업자 대출 상품' },
];

export const PRODUCT_LABELS = {
  guarantee: '보증드림',
  sosi:      '소상공인',
  kakao:     '카카오뱅크',
};

// All form field IDs in the add/edit modal
export const FIDS = [
  'f-name','f-phone','f-carrier','f-email','f-birth','f-rrn','f-gender',
  'f-homeaddr','f-bizname','f-bizno','f-industry','f-region','f-period',
  'f-revenue','f-employee','f-bank','f-bizaddr','f-consultDate','f-applyDate',
  'f-plan','f-contractDate','f-actualFund','f-fundDate','f-collectDate',
  'f-collected','f-score','f-naver','f-homeownership','f-credit',
  'f-stepIdx','f-consult','f-note',
];

// localStorage key kept for one-time migration check
export const LEGACY_SK = 'dangoon_crm_v4';
export const LEGACY_TRASH_SK = 'dangoon_crm_trash';

export const TRASH_DAYS = 30;

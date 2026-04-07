// ════════════════════════════════════════
//  상담이력 자동 파싱
// ════════════════════════════════════════

import { showToast }       from './toast.js';
import { checkFoodIndustry, foodState, setBizType } from './modal.js';

function setV(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

export function openParseModal() {
  document.getElementById('parseInput').value = '';
  document.getElementById('parseOverlay').classList.add('open');
}

export function closeParseModal() {
  document.getElementById('parseOverlay').classList.remove('open');
}

export function runParse() {
  const raw = document.getElementById('parseInput').value;
  if (!raw.trim()) { alert('상담이력을 붙여넣어 주세요.'); return; }

  const lines = raw.split('\n');

  function extractKV(line) {
    const m = line.match(/^[\s\-―·•◆▶▸]+(.+?)[：:]\s*(.*)$/);
    if (!m) return null;
    return { key: m[1].trim(), val: m[2].trim() };
  }

  const items = [];
  for (const line of lines) {
    const kv = extractKV(line);
    if (kv) { items.push(kv); }
    else if (items.length > 0 && line.trim()) {
      items[items.length - 1].val += '\n' + line.trim();
    }
  }

  const get = (...keys) => {
    for (const k of keys) {
      const found = items.find(i => i.key.replace(/\s/g,'').includes(k.replace(/\s/g,'')));
      if (found) return found.val.trim();
    }
    return '';
  };

  const name = get('성함');
  if (name) setV('f-name', name);

  const birthRaw = get('출생연도', '대표자출생');
  if (birthRaw) {
    const rrnMatch = birthRaw.match(/(\d{6})\s*[-―]\s*(\d)/);
    if (rrnMatch) {
      setV('f-rrn', rrnMatch[1] + '-' + rrnMatch[2] + '******');
      const yy       = parseInt(rrnMatch[1].slice(0, 2));
      // Bug fix: use current year's 2-digit value instead of hardcoded 25
      const curYY    = new Date().getFullYear() % 100;
      const fullYear = yy > curYY ? 1900 + yy : 2000 + yy;
      setV('f-birth', fullYear + '년생');
      const gCode = parseInt(rrnMatch[2]);
      if ([1,3,5,7,9].includes(gCode)) setV('f-gender', 'male');
      else if ([2,4,6,8,0].includes(gCode)) setV('f-gender', 'female');
    } else {
      setV('f-birth', birthRaw);
    }
  }

  const region = get('지역');
  if (region) setV('f-region', region.replace(/[（(）)]/g,'').trim());

  const bizname = get('상호명');
  if (bizname) setV('f-bizname', bizname);

  const industryRaw = get('업종');
  if (industryRaw) {
    const isCorp       = /법인/.test(industryRaw);
    setBizType(isCorp ? 'corp' : 'sole');
    const cleanIndustry = industryRaw.replace(/[（(）)]\s*(개인|법인)\s*[）)]/g,'').replace(/[（(）)]/g,'').trim();
    setV('f-industry', cleanIndustry);
    checkFoodIndustry();
    const rawLow = raw.replace(/\s/g,'').toLowerCase();
    _detectFoodExtras(rawLow);
  }

  const period = get('사업기간');
  if (period) setV('f-period', period);

  const revenue = get('매출현황', '매출');
  if (revenue) setV('f-revenue', revenue);

  const fund = get('필요자금');
  if (fund) {
    const fundRaw = fund.replace(/,/g,'');
    const 억 = fundRaw.match(/(\d+\.?\d*)\s*억/);
    const 천 = fundRaw.match(/(\d+\.?\d*)\s*천/);
    const 만 = fundRaw.match(/^(\d+)\s*만?$/);
    let fundNum = '';
    if (억)      fundNum = String(Math.round(parseFloat(억[1]) * 10000));
    else if (천) fundNum = String(Math.round(parseFloat(천[1]) * 1000));
    else if (만) fundNum = 만[1];
    else         fundNum = fundRaw.replace(/[^\d]/g,'');
    if (fundNum) setV('f-actualFund', fundNum);
  }

  const emp = get('직원수', '직원');
  if (emp) setV('f-employee', emp === 'X' || emp === 'x' ? '없음' : emp);

  const bankRaw = get('주거래은행');
  if (bankRaw) {
    const bankClean = bankRaw.split(/[\[\(【〔]/)[0].trim();
    if (bankClean) setV('f-bank', bankClean);
  }

  const etcMatch = raw.match(/\[\s*기타\s*사항\s*\]([^\[]*?)(?=\[|―|-|$)/si);
  if (etcMatch) {
    const etcText  = etcMatch[1].trim();
    if (etcText) {
      const existing = document.getElementById('f-note')?.value || '';
      setV('f-note', (existing ? existing + '\n' : '') + '[기타사항] ' + etcText);
    }
  }
  const etcItem = items.find(i => i.key.replace(/\s/g,'').includes('기타사항'));
  if (etcItem && !etcMatch) {
    const existing = document.getElementById('f-note')?.value || '';
    setV('f-note', (existing ? existing + '\n' : '') + '[기타사항] ' + etcItem.val.trim());
  }

  const scoreRaw = get('신용평점');
  if (scoreRaw) setV('f-score', scoreRaw);

  setV('f-consult', raw);
  closeParseModal();
  showToast(`✦ ${items.length}개 항목 자동 입력 완료!`);
}

function _detectFoodExtras(rawLow) {
  const setFoodBtn = (key, val, label) => {
    foodState[key] = val;
    const b = document.getElementById('fb-' + key);
    if (b) {
      b.className = 'food-toggle-btn ' + (val ? 'on' : 'off');
      b.textContent = label + (val ? ' ✓' : ' ✕');
    }
  };
  if (rawLow.includes('키오스크')) {
    const hasK = /키오스크.*[oO0✓있음yes]|[oO0✓있음yes].*키오스크/.test(rawLow);
    const noK  = /키오스크.*[xX✕없음no]|[xX✕없음no].*키오스크/.test(rawLow);
    if (hasK && !noK) setFoodBtn('kiosk', true,  '키오스크');
    else if (noK)     setFoodBtn('kiosk', false, '키오스크');
  }
  if (rawLow.includes('테이블오더') || rawLow.includes('테이블주문')) {
    const hasTO = /테이블오더.*[oO0✓있음yes]/.test(rawLow);
    const noTO  = /테이블오더.*[xX✕없음no]/.test(rawLow);
    if (hasTO)       setFoodBtn('table', true,  '테이블오더');
    else if (noTO)   setFoodBtn('table', false, '테이블오더');
  }
  if (rawLow.includes('배달')) {
    const hasDel = /배달.*[oO✓있음운영]|배민|쿠팡이츠|요기요/.test(rawLow);
    const noDel  = /배달.*[xX✕없음안함]/.test(rawLow);
    if (hasDel && !noDel) {
      setFoodBtn('delivery', true, '배달운영');
      const dinp = document.getElementById('f-delivery-apps');
      if (dinp) {
        dinp.style.display = 'block';
        const apps = [];
        if (rawLow.includes('배민') || rawLow.includes('배달의민족')) apps.push('배민');
        if (rawLow.includes('쿠팡이츠') || rawLow.includes('쿠팡'))   apps.push('쿠팡이츠');
        if (rawLow.includes('요기요')) apps.push('요기요');
        dinp.value = apps.join(', ');
      }
    } else if (noDel) setFoodBtn('delivery', false, '배달운영');
  }
}

// ════════════════════════════════════════
//  Customer list rendering
// ════════════════════════════════════════

import { state }                    from '../state.js';
import { STEPS, APPLY_STEP_IDX }    from '../constants.js';
import { daysSince, esc }           from '../utils/format.js';
import { getGender, genderSvg, genderClass } from '../utils/gender.js';
import { initDragDrop }             from './dragdrop.js';

// ── Pipeline count display ────────────────────────────────────────

export function initPipeline() {
  const row = document.getElementById('pipelineRow');
  if (!row) return;
  row.innerHTML = STEPS.map((s, i) => `
    <div class="pipe-step${state.stepFilter===i?' active':''}" onclick="setStepFilter(${i})">
      <div class="pipe-num">${i+1}</div>
      <div class="pipe-label">${s.label}</div>
      <div class="pipe-count" id="pc-${i}">0</div>
    </div>`).join('');

  const sel = document.getElementById('f-stepIdx');
  if (sel) sel.innerHTML = STEPS.map((s,i) =>
    `<option value="${i}">${i+1}. ${s.label}</option>`).join('');
}

// ── Filter helpers ────────────────────────────────────────────────

export function setStepFilter(idx) {
  state.stepFilter = (state.stepFilter === idx) ? -1 : idx;
  document.querySelectorAll('.pipe-step').forEach((el, i) =>
    el.classList.toggle('active', i === state.stepFilter));
  renderList();
}

export function setFilter(f) {
  state.curFilter = f;
  document.querySelectorAll('.stat-pill').forEach(el =>
    el.classList.toggle('act', el.id === 'spill-' + f));
  renderList();
}

// ── isCollected ───────────────────────────────────────────────────

export const isCollectedFn = c => !!c.collectInfo || c.collected === '완료';

// ── Main render ───────────────────────────────────────────────────

export function renderList() {
  const q    = document.getElementById('searchQ')?.value.trim().toLowerCase() ?? '';
  const sort = document.getElementById('sortQ')?.value ?? 'auto';

  // Pipeline counts
  const pcnts = new Array(STEPS.length).fill(0);
  state.customers.forEach(c => {
    if (!c.status) pcnts[Math.max(0, Math.min(c.stepIdx ?? 0, STEPS.length-1))]++;
  });
  STEPS.forEach((_, i) => {
    const el = document.getElementById(`pc-${i}`);
    if (el) el.textContent = pcnts[i];
  });

  // Stats
  const total         = state.customers.length;
  const activeAll     = state.customers.filter(c => !c.status);
  const applyDone     = activeAll.filter(c => c.stepIdx >= APPLY_STEP_IDX && !isCollectedFn(c));
  const collectDone   = activeAll.filter(c => isCollectedFn(c));
  const inProgress    = activeAll.filter(c => c.stepIdx < APPLY_STEP_IDX && !isCollectedFn(c));
  const collectWaiting= state.customers.filter(c => !c.status && c.fundDate && c.collected !== '완료' && !isCollectedFn(c));
  const holdCount     = state.customers.filter(c => c.status === 'hold').length;
  const cancelCount   = state.customers.filter(c => c.status === 'cancel').length;
  const rejectedCount = state.customers.filter(c => c.status === 'rejected').length;

  let totalFee = 0;
  collectDone.forEach(c => { if (c.collectInfo?.amount) totalFee += parseFloat(c.collectInfo.amount) || 0; });

  // Update stat pills
  const setStatEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setStatEl('scnt-전체',    total);
  setStatEl('scnt-진행중',  inProgress.length);
  setStatEl('scnt-신청완료',applyDone.length);
  setStatEl('scnt-수금완료',collectDone.length);
  setStatEl('scnt-수금대기',collectWaiting.length);
  setStatEl('scnt-fund',    totalFee ? (totalFee/10000).toFixed(0)+'만원' : '0원');
  setStatEl('scnt-보류',    holdCount);
  setStatEl('scnt-취소',    cancelCount);
  setStatEl('scnt-부결',    rejectedCount);

  // Filter
  let list = state.customers.filter(c => {
    const col = isCollectedFn(c);
    let ok = true;
    const f = state.curFilter;
    if      (f === '진행중')   ok = !c.status && c.stepIdx < APPLY_STEP_IDX && !col;
    else if (f === '신청완료') ok = !c.status && c.stepIdx >= APPLY_STEP_IDX && !col;
    else if (f === '수금완료') ok = col;
    else if (f === '수금대기') ok = !c.status && !!c.fundDate && c.collected !== '완료' && !col;
    else if (f === '보류')     ok = c.status === 'hold';
    else if (f === '취소')     ok = c.status === 'cancel';
    else if (f === '부결')     ok = c.status === 'rejected';

    if (ok && state.stepFilter >= 0) ok = (c.stepIdx === state.stepFilter) && !c.status;

    if (ok && q) {
      const hay = [c.name, c.phone, c.bizname, c.region, c.industry].join(' ').toLowerCase();
      ok = hay.includes(q);
    }
    return ok;
  });

  // Sort
  if (sort === 'name')    list.sort((a,b) => (a.name||'').localeCompare(b.name||''));
  else if (sort === 'days') list.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  else if (sort === 'step') list.sort((a,b) => (b.stepIdx??0) - (a.stepIdx??0));
  else if (sort === 'manual') { /* keep current order */ }
  else {
    // Auto priority: 1=진행중(낮은 step 먼저) → 2=신청완료 → 3=보류 → 4=취소/부결 → 5=수금완료
    const priority = c => {
      const col = isCollectedFn(c);
      if (col)                   return 5;
      if (c.status === 'cancel' || c.status === 'rejected') return 4;
      if (c.status === 'hold')   return 3;
      if (c.stepIdx >= APPLY_STEP_IDX) return 2;
      return 1;
    };
    list.sort((a, b) => {
      const pa = priority(a), pb = priority(b);
      if (pa !== pb) return pa - pb;
      // Same group: newest first
      return (b.createdAt||'').localeCompare(a.createdAt||'');
    });
  }

  // Drag hint
  const hint = document.getElementById('dragHint');
  if (hint) hint.classList.toggle('show', sort === 'manual');

  const draggable = (sort === 'manual');
  const el = document.getElementById('custList');
  if (!el) return;

  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-ico">🔍</div><div>조건에 맞는 고객이 없습니다</div></div>`;
    return;
  }

  el.innerHTML = list.map(c => buildCard(c, draggable)).join('');
  if (draggable) initDragDrop();
}

// ── buildCard ─────────────────────────────────────────────────────

export function buildCard(c, draggable = false) {
  const days       = daysSince(c.createdAt);
  const si         = Math.max(0, Math.min(c.stepIdx ?? 0, STEPS.length - 1));
  const isHold     = c.status === 'hold';
  const isCancel   = c.status === 'cancel';
  const isRejected = c.status === 'rejected';

  const bcs = [
    isHold     ? 'smb smb-hold'     : null,
    isCancel   ? 'smb smb-cancel'   : null,
    isRejected ? 'smb smb-rejected' : null,
    (!isHold && !isCancel && !isRejected && si >= APPLY_STEP_IDX && !isCollectedFn(c))
               ? 'smb smb-applied'  : null,
    isCollectedFn(c) ? 'smb smb-done' : null,
  ].filter(Boolean);

  const statusLabel = isHold     ? '보류'
                    : isCancel   ? '취소'
                    : isRejected ? '부결'
                    : si >= APPLY_STEP_IDX && !isCollectedFn(c) ? '신청완료'
                    : isCollectedFn(c) ? '수금완료'
                    : null;

  const hiddenSteps = Array.isArray(c.hiddenSteps) ? c.hiddenSteps : [];
  const dots = STEPS.map((_, i) => {
    if (hiddenSteps.includes(i)) return '';
    const cls = i < si ? 'pdot done' : i === si ? 'pdot current' : 'pdot';
    return `<div class="${cls}"></div>`;
  }).join('');

  const fundDays    = c.fundDate ? daysSince(c.fundDate) : -1;
  const collectBadge = !isHold && !isCancel && c.fundDate && c.collected !== '완료'
    ? `<div class="collect-badge${fundDays >= 3 ? ' done' : ''}">
         ${fundDays >= 3 ? '수금 D+'+fundDays : '수금 D+'+fundDays+' ('+Math.max(0,3-fundDays)+'일)'}
       </div>` : '';

  const isCollected = isCollectedFn(c);
  const isApplied   = !isHold && !isCancel && !isRejected && !isCollected && si >= APPLY_STEP_IDX;
  const cardClass   = isHold     ? 'ccard status-hold'
                    : isCancel   ? 'ccard status-cancel'
                    : isRejected ? 'ccard status-rejected'
                    : isApplied  ? 'ccard status-applied'
                    : isCollected? 'ccard status-collected'
                    : 'ccard';

  const ssTag = (isApplied || isCollected) && c.subStatus
    ? `<div class="smb smb-ss-${c.subStatus}">${
        c.subStatus==='review'?'🔍 심사중':
        c.subStatus==='wait'?'⏳ 약정대기':
        c.subStatus==='done'?'✅ 약정완료':''}</div>` : '';

  const statusTag = statusLabel
    ? `<div class="${bcs.join(' ')}">${statusLabel}</div>${ssTag}` : '';

  const gender     = getGender(c);
  let avatarStyle  = '';
  if (c.status === 'hold')     avatarStyle = 'opacity:0.6;';
  if (c.status === 'cancel')   avatarStyle = 'opacity:0.4;filter:grayscale(1);';
  if (c.status === 'rejected') avatarStyle = 'opacity:0.4;filter:grayscale(0.7);';
  if (si >= 9 && !c.status)    avatarStyle = 'background:linear-gradient(135deg,#b45309,#d97706);';

  return `
  <div class="${cardClass}"${draggable?' draggable="true"':''} data-id="${c.id}">
    <div class="ccard-head" onclick="openDetail('${c.id}')">
      <div id="avatar-${c.id}" class="${genderClass(gender)}" style="${avatarStyle}"
           onclick="cycleGender('${c.id}',event)">
        ${genderSvg(gender)}
      </div>
      <div class="ccard-info">
        <div class="ccard-name">${esc(c.name||'이름없음')} 대표</div>
        <div class="ccard-sub">${esc(c.bizname||'')}${c.region?' · '+esc(c.region):''}${c.industry?' · '+esc(c.industry):''}</div>
      </div>
      ${statusTag}
      <div class="day-b">D+${days}</div>
      <div class="prog-dots">${dots}</div>
      ${collectBadge}
    </div>
  </div>`;
}

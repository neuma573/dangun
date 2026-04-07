// ════════════════════════════════════════
//  Customer actions: steps, docs, memos, status,
//  inline-edit, quick-save, gender cycle
// ════════════════════════════════════════

import { state }           from '../state.js';
import { upsertCustomer }  from '../db/customers.js';
import { today, nowTimestamp, esc } from '../utils/format.js';
import { ensureDocItems, getDocsByType } from '../utils/docs.js';
import { STEPS, APPLY_STEP_IDX } from '../constants.js';
import { genderFromRrn, getGender, genderSvg, genderClass } from '../utils/gender.js';
import { renderDetail }    from './detail.js';
import { renderList }      from './list.js';
import { showToast }       from './toast.js';

// ── Shared persist helper ─────────────────────────────────────────
async function persist(c) {
  await upsertCustomer(c);
}

// ── Steps ─────────────────────────────────────────────────────────

export async function setStep(id, idx) {
  const c = state.findCustomer(id); if (!c) return;
  if (c.stepIdx === idx) {
    c.stepIdx = Math.max(0, idx - 1);
    if (c.stepDates) delete c.stepDates[idx];
  } else {
    c.stepIdx = idx;
    if (!c.stepDates) c.stepDates = {};
    if (!c.stepDates[idx]) c.stepDates[idx] = today();
    if (idx === APPLY_STEP_IDX && !c.applyDate) c.applyDate = today();
  }
  if (state.currentDetailId === id) renderDetail(id); else renderList();
  await persist(c);
}

export function toggleStepDateEdit(id, idx) {
  const inp = document.getElementById(`sdi-${id}-${idx}`);
  const lbl = document.getElementById(`sdl-${id}-${idx}`);
  if (!inp) return;
  const isHidden = inp.style.display === 'none';
  inp.style.display = isHidden ? 'block' : 'none';
  if (lbl) lbl.style.display = isHidden ? 'none' : 'inline-block';
  if (isHidden) { inp.focus(); try { inp.showPicker(); } catch(e) {} }
}

export async function saveStepDate(id, idx, value) {
  const c = state.findCustomer(id); if (!c) return;
  if (!c.stepDates) c.stepDates = {};
  if (value) {
    c.stepDates[idx] = value;
    if (idx === APPLY_STEP_IDX) c.applyDate = value;
  } else {
    delete c.stepDates[idx];
    if (idx === APPLY_STEP_IDX) c.applyDate = '';
  }
  renderDetail(id);
  await persist(c);
}

export async function deleteStep(id, globalIdx) {
  const c = state.findCustomer(id); if (!c) return;
  const s = STEPS[globalIdx];
  if (!confirm(`'${s.label}' 단계를 이 고객에게서 완전히 제거하시겠습니까?\n(다른 고객에게는 영향 없음)`)) return;
  if (!c.hiddenSteps) c.hiddenSteps = [];
  if (!c.hiddenSteps.includes(globalIdx)) c.hiddenSteps.push(globalIdx);
  if (c.stepDates) delete c.stepDates[globalIdx];
  if (c.stepIdx === globalIdx) {
    const hidden = c.hiddenSteps;
    let prev = globalIdx - 1;
    while (prev > 0 && hidden.includes(prev)) prev--;
    c.stepIdx = Math.max(0, prev);
  }
  if (globalIdx === APPLY_STEP_IDX) c.applyDate = '';
  renderDetail(id);
  await persist(c);
  showToast(`'${s.label}' 단계가 제거됐어요`);
}

// ── Docs ──────────────────────────────────────────────────────────

export async function toggleDoc(id, idx) {
  const c = state.findCustomer(id); if (!c) return;
  const items = ensureDocItems(c);
  if (!items[idx]) return;
  items[idx].checked = !items[idx].checked;
  if (state.currentDetailId === id) renderDetail(id);
  await persist(c);
}

export async function addCustomDoc(id) {
  const inp  = document.getElementById('docAddInput-' + id);
  if (!inp) return;
  const name = inp.value.trim();
  if (!name) { inp.focus(); return; }
  const c = state.findCustomer(id); if (!c) return;
  const items = ensureDocItems(c);
  items.push({ name, checked: false, custom: true });
  inp.value = '';
  renderDetail(id);
  await persist(c);
  showToast(`✦ '${name}' 서류가 추가됐어요`);
}

export async function deleteDoc(id, idx) {
  const c = state.findCustomer(id); if (!c) return;
  const items = ensureDocItems(c);
  const item  = items[idx];
  if (!item) return;
  if (!confirm(`'${item.name}' 서류를 목록에서 제거하시겠습니까?`)) return;
  items.splice(idx, 1);
  renderDetail(id);
  await persist(c);
  showToast('서류가 제거됐어요');
}

// ── Memos ─────────────────────────────────────────────────────────

export async function addMemo(id) {
  const inp = document.getElementById('mi-' + id);
  const tx  = inp?.value.trim(); if (!tx) return;
  const c   = state.findCustomer(id); if (!c) return;
  if (!c.memos) c.memos = [];
  c.memos.push({ date: nowTimestamp(), text: tx });
  inp.value = '';
  if (state.currentDetailId === id) renderDetail(id); else renderList();
  await persist(c);
}

export async function delMemo(id, idx) {
  if (!confirm('메모를 삭제할까요?')) return;
  const c = state.findCustomer(id); if (!c || !c.memos) return;
  c.memos.splice(idx, 1);
  if (state.currentDetailId === id) renderDetail(id); else renderList();
  await persist(c);
}

// ── Status ────────────────────────────────────────────────────────

export async function setStatus(id, status) {
  const c = state.findCustomer(id); if (!c) return;
  const labels = { hold:'진행 보류', cancel:'진행 취소', rejected:'부결 처리', '':'진행 재개' };
  if (!confirm(`${c.name||'이 고객'} 대표님을 "${labels[status]}" 처리하시겠습니까?`)) return;
  c.status = status || undefined;
  if (!c.memos) c.memos = [];
  const memoText = status === 'hold'     ? '⏸ 진행 보류 처리됨'
                 : status === 'cancel'   ? '✕ 진행 취소 처리됨'
                 : status === 'rejected' ? '⛔ 부결 처리됨'
                 : '▶ 진행 재개됨';
  c.memos.push({ date: nowTimestamp(), text: memoText });
  renderDetail(id);
  await persist(c);
}

export async function setSubStatus(id, sub) {
  const c = state.findCustomer(id); if (!c) return;
  const next = c.subStatus === sub ? '' : sub;
  c.subStatus = next;
  const labels = { review:'🔍 심사중', wait:'⏳ 약정대기', done:'✅ 약정완료', '':'해제' };
  if (!c.memos) c.memos = [];
  if (next) c.memos.push({ date: nowTimestamp(), text: `상태 변경: ${labels[next]}` });
  renderDetail(id);
  await persist(c);
  if (next) showToast(labels[next] + ' 설정됐어요');
}

// ── Quick save ────────────────────────────────────────────────────

export async function quickSave(id, field, value) {
  const c = state.findCustomer(id); if (!c) return;
  c[field] = value;
  await persist(c);
}

export async function quickSaveHome(id, value) {
  const c = state.findCustomer(id); if (!c) return;
  const prev = c.homeOwnership || '';
  c.homeOwnership = value;
  if (prev !== value) {
    ensureDocItems(c);
    const newBaseNames = getDocsByType(c.biztype||'sole', c.industry, c.homeOwnership);
    const customItems  = c.docItems.filter(it => it.custom);
    c.docItems = [
      ...newBaseNames.map(n => {
        const existing = c.docItems.find(it => !it.custom && it.name === n);
        return existing || { name: n, checked: false, custom: false };
      }),
      ...customItems,
    ];
  }
  await persist(c);
  if (prev !== value) renderDetail(id);
}

export async function quickSaveDate(id, field, value) {
  const c = state.findCustomer(id); if (!c) return;
  c[field] = value;
  await persist(c);
  showToast('날짜 저장 완료');
}

export async function quickSaveDateFund(id, value) {
  const c = state.findCustomer(id); if (!c) return;
  c.fundDate = value;
  renderDetail(id);
  await persist(c);
}

export async function quickToggleNaver(id, btn) {
  const c = state.findCustomer(id); if (!c) return;
  const next = c.naver === '있음' ? '없음' : c.naver === '없음' ? '' : '있음';
  c.naver = next;
  btn.textContent  = next === '있음' ? '✓ 있음' : next === '없음' ? '✕ 없음' : '미확인';
  btn.className    = 'quick-toggle ' + (next === '있음' ? 'qt-green' : next === '없음' ? 'qt-red' : 'qt-dim');
  await persist(c);
}

export async function quickToggleCredit(id, btn) {
  const c = state.findCustomer(id); if (!c) return;
  const next = c.credit === '가입완료' ? '' : '가입완료';
  c.credit = next;
  btn.textContent = next === '가입완료' ? '✓ 가입완료' : '미완료';
  btn.className   = 'quick-toggle ' + (next === '가입완료' ? 'qt-green' : 'qt-dim');
  await persist(c);
}

// ── Inline edit ───────────────────────────────────────────────────

export function toggleInlineEdit(section, id) {
  const viewEl = document.getElementById(`${section}-view-${id}`);
  const editEl = document.getElementById(`${section}-edit-${id}`);
  if (!viewEl || !editEl) return;
  const isOpen = editEl.style.display !== 'none';
  viewEl.style.display = isOpen ? 'block' : 'none';
  editEl.style.display = isOpen ? 'none'  : 'block';
}

export async function saveInlineEdit(section, id) {
  const c  = state.findCustomer(id); if (!c) return;
  const g  = fid => document.getElementById(`ie-${fid}-${id}`)?.value.trim() ?? '';
  const gs = fid => document.getElementById(`ie-${fid}-${id}`)?.value ?? '';

  if (section === 'basic') {
    c.phone         = g('phone');
    c.carrier       = gs('carrier');
    c.email         = g('email');
    c.birth         = g('birth');
    c.rrn           = g('rrn');
    c.homeaddr      = g('homeaddr');
    c.homeOwnership = gs('homeownership');
    c.bank          = g('bank');
    c.score         = g('score');
    c.naver         = gs('naver');
    ensureDocItems(c);
    const newBaseNames = getDocsByType(c.biztype||'sole', c.industry, c.homeOwnership);
    const customItems  = c.docItems.filter(it => it.custom);
    c.docItems = [
      ...newBaseNames.map(n => {
        const existing = c.docItems.find(it => !it.custom && it.name === n);
        return existing || { name: n, checked: false, custom: false };
      }),
      ...customItems,
    ];
  } else if (section === 'biz') {
    const prevIndustry = c.industry || '';
    c.bizname  = g('bizname');
    c.bizno    = g('bizno');
    c.industry = g('industry');
    c.period   = g('period');
    c.revenue  = g('revenue');
    c.employee = g('employee');
    c.bizaddr  = g('bizaddr');
    if (prevIndustry !== c.industry) {
      ensureDocItems(c);
      const newBaseNames = getDocsByType(c.biztype||'sole', c.industry, c.homeOwnership);
      const customItems  = c.docItems.filter(it => it.custom);
      c.docItems = [
        ...newBaseNames.map(n => ({ name: n, checked: false, custom: false })),
        ...customItems,
      ];
    }
  }
  renderDetail(id);
  await persist(c);
}

// ── Reject reason ─────────────────────────────────────────────────

export function toggleRejectEdit(id) {
  const editEl = document.getElementById(`reject-edit-${id}`);
  const btnsEl = document.getElementById(`reject-edit-btns-${id}`);
  if (!editEl) return;
  const isOpen = editEl.classList.contains('show');
  editEl.classList.toggle('show', !isOpen);
  if (btnsEl) btnsEl.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) editEl.focus();
}

export async function saveRejectReason(id) {
  const c = state.findCustomer(id); if (!c) return;
  c.rejectReason = document.getElementById(`reject-edit-${id}`)?.value.trim() || '';
  renderDetail(id);
  await persist(c);
  showToast('부결사유 저장 완료');
}

// ── Gender cycle ──────────────────────────────────────────────────

export async function cycleGender(id, event) {
  event.stopPropagation();
  const c   = state.findCustomer(id); if (!c) return;
  const cur = getGender(c);
  const next = cur === 'none' ? 'male' : cur === 'male' ? 'female' : 'none';
  c.gender  = next;
  const el  = document.getElementById(`avatar-${id}`);
  if (el) {
    el.className = genderClass(next);
    let extraStyle = '';
    if (c.status === 'hold')     extraStyle = 'opacity:0.6;';
    if (c.status === 'cancel')   extraStyle = 'opacity:0.4;filter:grayscale(1);';
    if (c.status === 'rejected') extraStyle = 'opacity:0.4;filter:grayscale(0.7);';
    if (c.stepIdx >= APPLY_STEP_IDX && !c.status) extraStyle = 'background:linear-gradient(135deg,#b45309,#d97706);';
    el.style.cssText = extraStyle;
    el.innerHTML     = genderSvg(next);
    const label = next === 'male' ? '남성' : next === 'female' ? '여성' : '미설정';
    showToast(`성별 → ${label}`);
  }
  await persist(c);
}

export function autoDetectGender() {
  const rrn = document.getElementById('f-rrn')?.value || '';
  const g   = genderFromRrn(rrn);
  if (g !== 'none') {
    const el = document.getElementById('f-gender');
    if (el) el.value = g;
  }
}

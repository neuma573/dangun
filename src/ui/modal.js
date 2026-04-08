// ════════════════════════════════════════
//  Add / Edit customer modal
// ════════════════════════════════════════

import { state }           from '../state.js';
import { FIDS, STEPS, APPLY_STEP_IDX } from '../constants.js';
import { uid, today, nowTimestamp } from '../utils/format.js';
import { getDocsByType, ensureDocItems } from '../utils/docs.js';
import { updatePlanPreview, updateActualPlan } from '../utils/calc.js';
import { insertCustomer, upsertCustomer } from '../db/customers.js';
import { renderList }      from './list.js';
import { renderDetail }    from './detail.js';
import { showToast }       from './toast.js';

// Food state lives here so modal.js and food.js can share it
export const foodState = { kiosk: null, table: null, delivery: null };

// ── Change detection ──────────────────────────────────────────────
//
// Single source of truth: _snapshotModal() lists every user-editable
// field in the modal. Both capture and comparison call it, so a field
// can only be omitted by removing it from this one function.

function _snapshotModal() {
  const s = {};

  // All FIDS dom fields
  FIDS.forEach(fid => {
    const el = document.getElementById(fid);
    s[fid] = el ? el.value : '';
  });

  // Hidden biztype field (set by setBizType, not in FIDS)
  const bt = document.getElementById('f-biztype');
  s['f-biztype'] = bt ? bt.value : 'sole';

  // Delivery apps input (visible only when food section is open, not in FIDS)
  const da = document.getElementById('f-delivery-apps');
  s['f-delivery-apps'] = da ? da.value : '';

  // foodState — JS-managed toggles, not reflected in any <input>
  s['_food_kiosk']    = foodState.kiosk;
  s['_food_table']    = foodState.table;
  s['_food_delivery'] = foodState.delivery;

  return s;
}

let _origSnapshot = null;

function _captureOriginals() {
  _origSnapshot = _snapshotModal();
}

function _hasChanges() {
  if (!_origSnapshot) return false;
  const current = _snapshotModal();
  // All values are primitives (string | boolean | null) so !== is sufficient
  return Object.keys(current).some(k => current[k] !== _origSnapshot[k]);
}

// ── setBizType ────────────────────────────────────────────────────

export function setBizType(type) {
  document.getElementById('f-biztype').value = type;
  document.querySelectorAll('.btt-btn').forEach(b => b.classList.remove('active-sole', 'active-corp'));
  const btn = document.getElementById('btn-' + type);
  if (btn) btn.classList.add(type === 'corp' ? 'active-corp' : 'active-sole');
}

// ── openModal ─────────────────────────────────────────────────────

export function openModal(id) {
  state.editId = id || null;
  document.getElementById('overlay').classList.add('open');
  document.getElementById('planPreview').classList.remove('show');
  document.getElementById('actualPlanPreview').classList.remove('show');

  if (id) {
    const c = state.findCustomer(id); if (!c) return;
    document.getElementById('mTitle').textContent = '고객 정보 수정';
    document.getElementById('f-name').value        = c.name       || '';
    document.getElementById('f-phone').value       = c.phone      || '';
    document.getElementById('f-carrier').value     = c.carrier    || '';
    document.getElementById('f-email').value       = c.email      || '';
    document.getElementById('f-birth').value       = c.birth      || '';
    document.getElementById('f-rrn').value         = c.rrn        || '';
    document.getElementById('f-gender').value      = c.gender     || '';
    document.getElementById('f-homeaddr').value    = c.homeaddr   || '';
    document.getElementById('f-bizname').value     = c.bizname    || '';
    document.getElementById('f-bizno').value       = c.bizno      || '';
    document.getElementById('f-industry').value    = c.industry   || '';
    document.getElementById('f-region').value      = c.region     || '';
    document.getElementById('f-period').value      = c.period     || '';
    document.getElementById('f-revenue').value     = c.revenue    || '';
    document.getElementById('f-employee').value    = c.employee   || '';
    document.getElementById('f-bank').value        = c.bank       || '';
    document.getElementById('f-bizaddr').value     = c.bizaddr    || '';
    document.getElementById('f-plan').value        = c.plan       || '';
    document.getElementById('f-contractDate').value= c.contractDate || '';
    document.getElementById('f-consultDate').value = c.consultDate  || '';
    document.getElementById('f-applyDate').value   = c.applyDate    || '';
    document.getElementById('f-actualFund').value  = c.actualFund   || '';
    document.getElementById('f-fundDate').value    = c.fundDate     || '';
    document.getElementById('f-collectDate').value = c.collectDate  || '';
    document.getElementById('f-collected').value   = c.collected    || '';
    document.getElementById('f-score').value       = c.score        || '';
    document.getElementById('f-naver').value       = c.naver        || '';
    document.getElementById('f-homeownership').value = c.homeOwnership || '';
    document.getElementById('f-credit').value      = c.credit      || '';
    document.getElementById('f-stepIdx').value     = c.stepIdx ?? 0;
    document.getElementById('f-consult').value     = c.consult     || '';
    document.getElementById('f-note').value        = '';
    setBizType(c.biztype || 'sole');
    checkFoodIndustry();
    resetFoodState();
    if (c.foodInfo) setFoodState(c);
    updatePlanPreview();
    if (c.actualFund) updateActualPlan();
  } else {
    document.getElementById('mTitle').textContent = '신규 고객 등록';
    FIDS.forEach(fid => {
      const el = document.getElementById(fid);
      if (el) el.value = fid === 'f-stepIdx' ? '0' : '';
    });
    resetFoodState();
    checkFoodIndustry();
    setBizType('sole');
  }
  _captureOriginals();
}

// ── closeModal ────────────────────────────────────────────────────

export function closeModal() {
  if (_hasChanges()) {
    document.getElementById('closeConfirm').classList.add('open');
  } else {
    forceCloseModal();
  }
}

export function forceCloseModal() {
  document.getElementById('closeConfirm').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  state.editId = null;
  _origSnapshot = null;
}

export function cancelClose() {
  document.getElementById('closeConfirm').classList.remove('open');
}

// ── getData ───────────────────────────────────────────────────────

function getData(name, phone, stepIdx) {
  return {
    name, phone, stepIdx,
    carrier:       document.getElementById('f-carrier').value,
    email:         document.getElementById('f-email').value.trim(),
    biztype:       document.getElementById('f-biztype').value,
    birth:         document.getElementById('f-birth').value.trim(),
    rrn:           document.getElementById('f-rrn').value.trim(),
    gender:        document.getElementById('f-gender').value || '',
    homeaddr:      document.getElementById('f-homeaddr').value.trim(),
    bizname:       document.getElementById('f-bizname').value.trim(),
    bizno:         document.getElementById('f-bizno').value.trim(),
    industry:      document.getElementById('f-industry').value.trim(),
    foodInfo:      (() => {
      const wrap = document.getElementById('foodInfoWrap');
      if (!wrap?.classList.contains('show')) return null;
      return {
        kiosk: foodState.kiosk, table: foodState.table, delivery: foodState.delivery,
        deliveryApps: document.getElementById('f-delivery-apps')?.value.trim() || '',
      };
    })(),
    region:        document.getElementById('f-region').value.trim(),
    period:        document.getElementById('f-period').value.trim(),
    revenue:       document.getElementById('f-revenue').value.trim(),
    employee:      document.getElementById('f-employee').value.trim(),
    bank:          document.getElementById('f-bank').value.trim(),
    bizaddr:       document.getElementById('f-bizaddr').value.trim(),
    plan:          document.getElementById('f-plan').value,
    contractDate:  document.getElementById('f-contractDate').value,
    consultDate:   document.getElementById('f-consultDate').value,
    applyDate:     document.getElementById('f-applyDate').value,
    actualFund:    document.getElementById('f-actualFund').value,
    fundDate:      document.getElementById('f-fundDate').value,
    collectDate:   document.getElementById('f-collectDate').value,
    collected:     document.getElementById('f-collected').value,
    score:         document.getElementById('f-score').value.trim(),
    naver:         document.getElementById('f-naver').value,
    homeOwnership: document.getElementById('f-homeownership').value,
    credit:        document.getElementById('f-credit').value,
    consult:       document.getElementById('f-consult').value.trim(),
  };
}

// ── saveCustomer ──────────────────────────────────────────────────

export async function saveCustomer() {
  const name    = document.getElementById('f-name').value.trim();
  const phone   = document.getElementById('f-phone').value.trim();
  if (!name) { alert('성함을 입력해주세요.'); return; }
  const stepIdx       = parseInt(document.getElementById('f-stepIdx').value) || 0;
  const biztype       = document.getElementById('f-biztype').value;
  const industry      = document.getElementById('f-industry').value.trim();
  const homeOwnership = document.getElementById('f-homeownership')?.value || '';
  const note          = document.getElementById('f-note').value.trim();

  if (state.editId) {
    const c = state.findCustomer(state.editId); if (!c) return;
    const prevType    = c.biztype    || 'sole';
    const prevIndustry= c.industry   || '';
    const prevHomeOwn = c.homeOwnership || '';
    Object.assign(c, getData(name, phone, stepIdx));
    if (prevType !== biztype || prevIndustry !== industry || prevHomeOwn !== homeOwnership) {
      c.docItems = getDocsByType(biztype, industry, homeOwnership)
        .map(n => ({ name: n, checked: false, custom: false }));
    } else {
      ensureDocItems(c);
    }
    if (note) { if (!c.memos) c.memos = []; c.memos.push({ date: nowTimestamp(), text: note }); }
    const savedEditId = state.editId;
    forceCloseModal();
    if (savedEditId && state.currentDetailId === savedEditId) renderDetail(savedEditId);
    else renderList();
    await upsertCustomer(c);
    showToast('✦ 저장 완료');
  } else {
    const sd = {}; sd[stepIdx] = today();
    const autoConsultDate = document.getElementById('f-consultDate').value || today();
    const newC = {
      id:          uid(),
      createdAt:   today(),
      memos:       note ? [{ date: nowTimestamp(), text: note }] : [],
      docItems:    getDocsByType(biztype, industry, homeOwnership).map(n => ({ name: n, checked: false, custom: false })),
      stepDates:   sd,
      ...getData(name, phone, stepIdx),
      consultDate: autoConsultDate,
    };
    state.prependLocal(newC);
    forceCloseModal();
    renderList();
    await insertCustomer(newC);
    showToast('✦ 신규 등록 완료');
  }
}

// ── Food helpers (shared with food.js) ───────────────────────────

export function checkFoodIndustry() {
  const val    = (document.getElementById('f-industry')?.value || '').replace(/\s/g,'').toLowerCase();
  const isFood = ['음식','식당','카페','치킨','피자','분식','한식','중식','일식','양식','패스트','베이커리']
    .some(k => val.includes(k));
  const wrap   = document.getElementById('foodInfoWrap');
  if (wrap) wrap.classList.toggle('show', isFood);
}

export function resetFoodState() {
  foodState.kiosk = foodState.table = foodState.delivery = null;
  ['kiosk','table','delivery'].forEach(k => {
    const btn = document.getElementById('fb-' + k);
    if (btn) {
      btn.className  = 'food-toggle-btn';
      btn.textContent = { kiosk:'키오스크', table:'테이블오더', delivery:'배달운영' }[k];
    }
  });
  const d = document.getElementById('f-delivery-apps');
  if (d) { d.value = ''; d.style.display = 'none'; }
}

export function setFoodState(c) {
  if (!c.foodInfo) return;
  const fi   = c.foodInfo;
  const lbls = { kiosk: { on:'키오스크 ✓', off:'키오스크 X', nil:'키오스크' },
                 table: { on:'테이블오더 ✓', off:'테이블오더 X', nil:'테이블오더' },
                 delivery: { on:'배달운영 ✓', off:'배달운영 X', nil:'배달운영' } };
  ['kiosk','table','delivery'].forEach(k => {
    foodState[k] = fi[k] ?? null;
    const btn = document.getElementById('fb-' + k);
    if (!btn) return;
    if (fi[k] === true)       { btn.className = 'food-toggle-btn on';  btn.textContent = lbls[k].on; }
    else if (fi[k] === false) { btn.className = 'food-toggle-btn off'; btn.textContent = lbls[k].off; }
    else                      { btn.className = 'food-toggle-btn';     btn.textContent = lbls[k].nil; }
  });
  const delivInput = document.getElementById('f-delivery-apps');
  if (delivInput) {
    delivInput.value        = fi.deliveryApps || '';
    delivInput.style.display = fi.delivery === true ? 'block' : 'none';
  }
}

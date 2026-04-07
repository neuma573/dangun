// ════════════════════════════════════════
//  단군비즈 CRM — Entry point
//  All inline onclick handlers call window.* functions exposed here.
// ════════════════════════════════════════

import { state }           from './state.js';
import { fetchCustomers }  from './db/customers.js';
import { migrateFromLocalStorage } from './db/migrate.js';
import { updatePlanPreview, updateActualPlan } from './utils/calc.js';
import { genderFromRrn }   from './utils/gender.js';

// UI modules
import { showToast }       from './ui/toast.js';
import { initPipeline, renderList, setFilter, setStepFilter } from './ui/list.js';
import { renderDetail }    from './ui/detail.js';
import { openDetail, goHome } from './ui/views.js';
import {
  openModal, closeModal, forceCloseModal, cancelClose, saveCustomer,
  setBizType, checkFoodIndustry,
} from './ui/modal.js';
import { toggleFoodBtn }   from './ui/food.js';
import {
  setStep, deleteStep, toggleStepDateEdit, saveStepDate,
  toggleDoc, addCustomDoc, deleteDoc,
  addMemo, delMemo,
  setStatus, setSubStatus,
  quickSave, quickSaveHome, quickSaveDate, quickSaveDateFund,
  quickToggleNaver, quickToggleCredit,
  toggleInlineEdit, saveInlineEdit,
  toggleRejectEdit, saveRejectReason,
  cycleGender, autoDetectGender,
} from './ui/actions.js';
import {
  openCollectView, closeCollectView, renderCollectView,
  openCollectPopup, closeCollectPopup, calcCollectAuto, calcCollectVat, saveCollect,
  exportCSV,
} from './ui/collect.js';
import {
  openTrashView, renderTrashView, delCustomerDetail,
  restoreFromTrash, permDeleteFromTrash, emptyTrash,
  updateTrashBadge,
} from './ui/trash.js';
import {
  openRouteModal, selectRoute, onRouteCustomInput, confirmRoute, closeRouteModal,
} from './ui/route.js';
import {
  openProceedModal, closeProceedModal, confirmProceed, selectProduct,
  addCustomProduct, removeCustomProduct,
} from './ui/proceed.js';
import { openRejectModal, closeRejectModal, confirmReject } from './ui/reject.js';
import { openParseModal, closeParseModal, runParse }       from './ui/parse.js';

// ── Expose all functions to window (required for inline onclick= handlers) ──

Object.assign(window, {
  // Navigation
  openDetail, goHome,
  // Filter / Pipeline
  setFilter, setStepFilter,
  // Modal
  openModal, closeModal, forceCloseModal, cancelClose, saveCustomer,
  setBizType, checkFoodIndustry,
  updatePlanPreview, updateActualPlan,
  // Food
  toggleFoodBtn,
  // Steps
  setStep, deleteStep, toggleStepDateEdit, saveStepDate,
  // Docs
  toggleDoc, addCustomDoc, deleteDoc,
  // Memos
  addMemo, delMemo,
  // Status
  setStatus, setSubStatus,
  // Quick saves
  quickSave, quickSaveHome, quickSaveDate, quickSaveDateFund,
  quickToggleNaver, quickToggleCredit,
  // Inline edit
  toggleInlineEdit, saveInlineEdit,
  // Reject
  toggleRejectEdit, saveRejectReason,
  openRejectModal, closeRejectModal, confirmReject,
  // Gender
  cycleGender, autoDetectGender,
  // Collect view
  openCollectView, closeCollectView, renderCollectView,
  // Collect popup
  openCollectPopup, closeCollectPopup, calcCollectAuto, calcCollectVat, saveCollect,
  // CSV
  exportCSV,
  // Trash
  openTrashView, renderTrashView, delCustomerDetail,
  restoreFromTrash, permDeleteFromTrash, emptyTrash,
  // Route
  openRouteModal, selectRoute, onRouteCustomInput, confirmRoute, closeRouteModal,
  // Proceed
  openProceedModal, closeProceedModal, confirmProceed, selectProduct,
  addCustomProduct, removeCustomProduct,
  // Parse
  openParseModal, closeParseModal, runParse,
  // Toast (for consult/loan scripts)
  showToast,
});

// ── Static event listeners (overlay close on backdrop click) ─────

document.getElementById('rejectOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('rejectOverlay')) closeRejectModal();
});
document.querySelector('#rejectOverlay .reject-modal')?.addEventListener('click', e => e.stopPropagation());

document.getElementById('collectPopup')?.addEventListener('click', e => {
  if (e.target === document.getElementById('collectPopup')) closeCollectPopup();
});
document.querySelector('#collectPopup .collect-popup')?.addEventListener('click', e => e.stopPropagation());

document.getElementById('proceedOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('proceedOverlay')) closeProceedModal();
});

document.getElementById('parseOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('parseOverlay')) closeParseModal();
});

document.getElementById('routeOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('routeOverlay')) closeRouteModal();
});

// Modal overlay blocks click-through (closes only via X button)
document.getElementById('overlay')?.addEventListener('click', e => e.stopPropagation());

// ── External message (1차콜 integration) ────────────────────────

window.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'dangoon_new_customer') return;
  const d = e.data;
  openModal(null);
  document.getElementById('mTitle').textContent = '신규 고객 등록 (1차콜 자동입력)';
  document.getElementById('f-stepIdx').value = '1';
  ['name','phone','region','birth','bizname','industry','period','revenue','employee','bank','consult']
    .forEach(k => { const el = document.getElementById('f-' + (k==='consult'?'consult':k)); if (el) el.value = d[k] || ''; });
  setBizType('sole');
});

// ── Boot ──────────────────────────────────────────────────────────

async function boot() {
  // 1. Migrate localStorage data on first run
  await migrateFromLocalStorage();

  // 2. Load customers from Supabase
  try {
    state.customers = await fetchCustomers();
  } catch (err) {
    console.error('Failed to load customers:', err);
    showToast('⚠️ 데이터 로딩 실패. 네트워크 연결을 확인하세요.');
  }

  // 3. Init UI
  initPipeline();
  renderList();
  updateTrashBadge();
}

boot();

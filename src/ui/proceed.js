// ════════════════════════════════════════
//  부결 → 추가진행 팝업
// ════════════════════════════════════════

import { state }           from '../state.js';
import { PRODUCT_LABELS }  from '../constants.js';
import { uid, today, nowTimestamp, esc } from '../utils/format.js';
import { getDocsByType }   from '../utils/docs.js';
import { insertCustomer }  from '../db/customers.js';
import { openDetail }      from './views.js';
import { showToast }       from './toast.js';

let proceedSourceId      = null;
let proceedSelectedProduct = null;
let _customProducts      = [];

export function openProceedModal(id) {
  proceedSourceId        = id;
  proceedSelectedProduct = null;
  document.querySelectorAll('.proceed-product').forEach(el => el.classList.remove('selected'));
  document.getElementById('proceedOkBtn').disabled = true;
  const ci = document.getElementById('proceedCustomInput');
  if (ci) ci.value = '';
  const c = state.findCustomer(id);
  if (c) {
    document.getElementById('proceedSubText').innerHTML =
      `<strong>${esc(c.name||'이 고객')}</strong> 대표님의 새 DB를 생성할까요?<br>기존 정보를 복사해서 <strong style="color:#a78bfa;">새로운 상품으로 진행</strong>합니다.`;
  }
  _renderCustomProductCards();
  document.getElementById('proceedOverlay').classList.add('open');
}

function _renderCustomProductCards() {
  const list = document.getElementById('proceedProductList');
  if (!list) return;
  list.querySelectorAll('.proceed-product-custom').forEach(el => el.remove());
  _customProducts.forEach((name, i) => {
    const key = 'custom-' + i;
    const div = document.createElement('div');
    div.className = 'proceed-product proceed-product-custom';
    div.id        = 'pp-' + key;
    div.innerHTML = `
      <div class="proceed-product-icon">📋</div>
      <div style="flex:1;">
        <div class="proceed-product-name">${esc(name)}</div>
        <div class="proceed-product-desc">직접 추가한 상품</div>
      </div>
      <button onclick="event.stopPropagation();removeCustomProduct(${i})"
        style="padding:2px 8px;border-radius:5px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.12);color:#f87171;font-size:11px;cursor:pointer;flex-shrink:0;"
        title="삭제">✕</button>`;
    div.addEventListener('click', () => selectProduct(key));
    list.appendChild(div);
  });
}

export function addCustomProduct() {
  const ci   = document.getElementById('proceedCustomInput');
  const name = (ci?.value || '').trim();
  if (!name) { ci?.focus(); return; }
  if (_customProducts.includes(name)) { showToast('이미 추가된 상품입니다'); return; }
  _customProducts.push(name);
  ci.value = '';
  _renderCustomProductCards();
  selectProduct('custom-' + (_customProducts.length - 1));
  showToast(`✦ '${name}' 추가됐어요`);
}

export function removeCustomProduct(i) {
  const removed = _customProducts[i];
  _customProducts.splice(i, 1);
  if (proceedSelectedProduct === 'custom-' + i) {
    proceedSelectedProduct = null;
    document.getElementById('proceedOkBtn').disabled = true;
  }
  _renderCustomProductCards();
  showToast(`'${removed}' 삭제됐어요`);
}

export function selectProduct(key) {
  proceedSelectedProduct = key;
  document.querySelectorAll('.proceed-product').forEach(el => el.classList.remove('selected'));
  document.getElementById('pp-' + key)?.classList.add('selected');
  document.getElementById('proceedOkBtn').disabled = false;
}

export function closeProceedModal() {
  document.getElementById('proceedOverlay').classList.remove('open');
  proceedSourceId = proceedSelectedProduct = null;
}

export async function confirmProceed() {
  if (!proceedSourceId || !proceedSelectedProduct) return;
  const src = state.findCustomer(proceedSourceId); if (!src) return;

  let productLabel;
  if (proceedSelectedProduct.startsWith('custom-')) {
    const idx = parseInt(proceedSelectedProduct.replace('custom-', ''));
    productLabel = _customProducts[idx] || '기타';
  } else {
    productLabel = PRODUCT_LABELS[proceedSelectedProduct] || proceedSelectedProduct;
  }

  const newC          = JSON.parse(JSON.stringify(src));
  newC.id             = uid();
  newC.createdAt      = today();
  newC.consultDate    = today();
  newC.status         = undefined;
  newC.hiddenSteps    = [0,1,2,3,4,5,6,7,8];
  newC.stepIdx        = 9;
  newC.stepDates      = { 9: today() };
  newC.applyDate      = today();
  newC.fundDate       = '';
  newC.collectDate    = '';
  newC.collected      = '';
  newC.contractDate   = '';
  newC.actualFund     = '';
  newC.plan           = '';
  newC.docs           = undefined;
  newC.docItems       = getDocsByType(newC.biztype||'sole', newC.industry, newC.homeOwnership)
    .map(n => ({ name: n, checked: false, custom: false }));
  newC.product        = productLabel;
  newC.memos          = [{
    date: nowTimestamp(),
    text: `🔄 부결 후 ${productLabel} 상품으로 추가 진행\n(원본 고객 ID: ${src.id})\n✅ 신청완료 단계로 바로 시작`,
  }];

  state.prependLocal(newC);
  closeProceedModal();
  showToast(`✦ ${esc(src.name||'고객')} 대표님 — ${productLabel} 새 DB 생성 완료!`);
  openDetail(newC.id);
  await insertCustomer(newC);
}

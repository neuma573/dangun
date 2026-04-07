// ════════════════════════════════════════
//  Trash (휴지통) view
// ════════════════════════════════════════

import { state }                      from '../state.js';
import { TRASH_DAYS }                 from '../constants.js';
import { esc }                        from '../utils/format.js';
import { insertCustomer, deleteCustomer } from '../db/customers.js';
import { fetchTrash, addToTrash, removeFromTrash, clearTrash, deleteFromTrash } from '../db/trash.js';
import { showToast }                  from './toast.js';
import { renderList }                 from './list.js';

// In-memory trash list (loaded on openTrashView)
let _trash = [];

export function updateTrashBadge() {
  const badge = document.getElementById('trashBadge');
  if (!badge) return;
  if (_trash.length > 0) {
    badge.textContent     = _trash.length;
    badge.style.display   = 'flex';
  } else {
    badge.style.display   = 'none';
  }
}

export function openTrashView() {
  state.currentDetailId = null;
  document.getElementById('mainView').style.display    = 'none';
  document.getElementById('detailView').style.display  = 'none';
  document.getElementById('collectView').style.display = 'none';
  document.getElementById('trashView').style.display   = 'block';
  _loadAndRender();
  window.scrollTo(0, 0);
}

async function _loadAndRender() {
  _trash = await fetchTrash();
  updateTrashBadge();
  renderTrashView();
}

export function renderTrashView() {
  const now = Date.now();
  let html = `
    <div class="trash-view-header">
      <button class="back-btn" onclick="goHome()">← 목록</button>
      <div>
        <div class="trash-view-title">🗑 휴지통</div>
        <div style="font-size:12px;color:var(--dim);margin-top:2px;">${TRASH_DAYS}일 후 자동 완전 삭제 · 삭제 전 복구 가능</div>
      </div>
      ${_trash.length ? `<button class="trash-empty-all-btn" onclick="emptyTrash()">🗑 전체 완전 삭제</button>` : ''}
    </div>`;

  if (!_trash.length) {
    html += `<div class="empty"><div class="empty-ico">🗑</div><div style="color:var(--dim);">휴지통이 비어있습니다</div></div>`;
  } else {
    html += _trash.map(item => {
      const daysGone = Math.floor((now - item.deletedAt) / 86400000);
      const daysLeft = TRASH_DAYS - daysGone;
      return `
        <div class="trash-card">
          <div class="trash-card-info">
            <div class="trash-card-name">${esc(item.name||'이름없음')} 대표</div>
            <div class="trash-card-sub">${esc(item.bizname||'')}${item.region?' · '+esc(item.region):''}${item.industry?' · '+esc(item.industry):''}</div>
            <div style="font-size:11px;color:rgba(239,68,68,0.7);margin-top:3px;">삭제일 ${new Date(item.deletedAt).toLocaleDateString('ko-KR')}</div>
          </div>
          <div class="trash-card-days">${daysLeft}일 후<br>완전삭제</div>
          <button class="trash-restore-btn"   onclick="restoreFromTrash('${item.id}')">↩ 복구</button>
          <button class="trash-perm-del-btn"  onclick="permDeleteFromTrash('${item.id}')">✕ 완전삭제</button>
        </div>`;
    }).join('');
  }
  document.getElementById('trashView').innerHTML = html;
}

export async function delCustomerDetail(id) {
  const c = state.findCustomer(id);
  if (!confirm(`${c?.name||'이 고객'} 대표님 데이터를 삭제하시겠습니까?\n(휴지통으로 이동, ${TRASH_DAYS}일 후 완전 삭제)`)) return;
  state.removeLocal(id);
  // Navigate home first for snappy UX
  const { goHome } = await import('./views.js');
  goHome();
  showToast('🗑 휴지통으로 이동됐어요. 30일 내 복구 가능');
  // Persist: remove from customers, add to trash
  await Promise.all([deleteCustomer(id), addToTrash(c)]);
  _trash.unshift({ ...c, deletedAt: Date.now() });
  updateTrashBadge();
}

export async function restoreFromTrash(id) {
  const item = _trash.find(x => x.id === id);
  if (!item) return;
  const restored = { ...item };
  delete restored.deletedAt;
  _trash = _trash.filter(x => x.id !== id);
  state.prependLocal(restored);
  await Promise.all([removeFromTrash(id), insertCustomer(restored)]);
  renderTrashView();
  updateTrashBadge();
  renderList();
  showToast(`✦ ${esc(restored.name||'고객')} 대표님 데이터가 복구됐어요`);
}

export async function permDeleteFromTrash(id) {
  const item = _trash.find(x => x.id === id);
  if (!confirm(`${item?.name||'이 고객'} 대표님 데이터를 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
  _trash = _trash.filter(x => x.id !== id);
  await deleteFromTrash(id);
  renderTrashView();
  updateTrashBadge();
  showToast('완전 삭제됐어요');
}

export async function emptyTrash() {
  if (!confirm(`휴지통의 항목 ${_trash.length}개를 모두 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
  _trash = [];
  await clearTrash();
  renderTrashView();
  updateTrashBadge();
  showToast('휴지통을 비웠어요');
}

// ════════════════════════════════════════
//  부결 처리 팝업
// ════════════════════════════════════════

import { state }          from '../state.js';
import { upsertCustomer } from '../db/customers.js';
import { nowTimestamp, esc } from '../utils/format.js';
import { renderDetail }   from './detail.js';

let rejectTargetId = null;

export function openRejectModal(id) {
  rejectTargetId = id;
  const c = state.findCustomer(id);
  document.getElementById('rejectReasonInput').value = c?.rejectReason || '';
  document.getElementById('rejectSubText').innerHTML =
    `<strong>${esc(c?.name||'이 고객')}</strong> 대표님을 부결 처리합니다.<br>사유를 입력해주세요 (나중에 수정 가능).`;
  document.getElementById('rejectOverlay').classList.add('open');
}

export function closeRejectModal() {
  document.getElementById('rejectOverlay').classList.remove('open');
  rejectTargetId = null;
}

export async function confirmReject() {
  if (!rejectTargetId) return;
  const c = state.findCustomer(rejectTargetId); if (!c) return;
  const reason = document.getElementById('rejectReasonInput').value.trim();
  c.status       = 'rejected';
  c.rejectReason = reason;
  if (!c.memos) c.memos = [];
  c.memos.push({ date: nowTimestamp(), text: `⛔ 부결 처리됨${reason ? '\n사유: ' + reason : ''}` });
  closeRejectModal();
  renderDetail(rejectTargetId);
  await upsertCustomer(c);
}

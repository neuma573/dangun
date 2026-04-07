// ════════════════════════════════════════
//  신청 플랫폼(루트) 선택 팝업
// ════════════════════════════════════════

import { state }          from '../state.js';
import { APPLY_ROUTES }   from '../constants.js';
import { upsertCustomer } from '../db/customers.js';
import { esc }            from '../utils/format.js';
import { renderDetail }   from './detail.js';
import { showToast }      from './toast.js';

let _routeTargetId   = null;
let _routeSelectedId = null;
let _routeCustomName = '';

export function openRouteModal(customerId) {
  _routeTargetId   = customerId;
  _routeSelectedId = null;
  _routeCustomName = '';
  const c       = state.findCustomer(customerId);
  const current = c?.applyRoute || '';

  document.getElementById('routeOptions').innerHTML = APPLY_ROUTES.map(r => `
    <div class="route-option ${current === r.name ? 'selected' : ''}" id="ro-${r.id}"
         onclick="selectRoute('${r.id}')">
      <div class="route-option-icon">${r.icon}</div>
      <div>
        <div class="route-option-name">${r.name}</div>
        <div class="route-option-desc">${r.desc}</div>
      </div>
    </div>`).join('');

  const customInp = document.getElementById('routeCustomInput');
  if (customInp) customInp.value = '';

  const matched = APPLY_ROUTES.find(r => r.name === current);
  if (matched) {
    _routeSelectedId = matched.id;
    document.getElementById('routeOkBtn').disabled = false;
  } else if (current) {
    if (customInp) customInp.value = current;
    _routeCustomName = current;
    document.getElementById('routeOkBtn').disabled = false;
  } else {
    document.getElementById('routeOkBtn').disabled = true;
  }
  document.getElementById('routeOverlay').classList.add('open');
}

export function selectRoute(rid) {
  _routeSelectedId = rid;
  _routeCustomName = '';
  const ci = document.getElementById('routeCustomInput');
  if (ci) ci.value = '';
  document.querySelectorAll('.route-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('ro-' + rid)?.classList.add('selected');
  document.getElementById('routeOkBtn').disabled = false;
}

export function onRouteCustomInput(val) {
  _routeCustomName = val.trim();
  if (_routeCustomName) {
    _routeSelectedId = null;
    document.querySelectorAll('.route-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('routeOkBtn').disabled = false;
  } else {
    document.getElementById('routeOkBtn').disabled = !_routeSelectedId;
  }
}

export async function confirmRoute() {
  if (!_routeTargetId) return;
  const customVal = (document.getElementById('routeCustomInput')?.value || '').trim();
  let routeName = '';
  if (customVal) {
    routeName = customVal;
  } else if (_routeSelectedId) {
    const r = APPLY_ROUTES.find(x => x.id === _routeSelectedId);
    if (r) routeName = r.name;
  }
  if (!routeName) return;
  const c = state.findCustomer(_routeTargetId); if (!c) return;
  c.applyRoute = routeName;
  closeRouteModal();
  renderDetail(_routeTargetId);
  showToast(`✦ 플랫폼 [${routeName}] 저장 완료!`);
  await upsertCustomer(c);
}

export function closeRouteModal() {
  document.getElementById('routeOverlay').classList.remove('open');
  _routeTargetId = _routeSelectedId = null;
  _routeCustomName = '';
  const ci = document.getElementById('routeCustomInput');
  if (ci) ci.value = '';
}

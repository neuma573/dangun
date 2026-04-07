// ════════════════════════════════════════
//  음식점 부가정보 토글 (modal 내)
// ════════════════════════════════════════

import { foodState, checkFoodIndustry } from './modal.js';

export function toggleFoodBtn(key) {
  const btn  = document.getElementById('fb-' + key);
  if (!btn) return;
  const lbl  = { kiosk:'키오스크', table:'테이블오더', delivery:'배달운영' };
  if (foodState[key] === null || foodState[key] === undefined) {
    foodState[key] = true;
    btn.className  = 'food-toggle-btn on';
    btn.textContent = lbl[key] + ' ✓';
  } else if (foodState[key] === true) {
    foodState[key] = false;
    btn.className  = 'food-toggle-btn off';
    btn.textContent = lbl[key] + ' X';
  } else {
    foodState[key] = null;
    btn.className  = 'food-toggle-btn';
    btn.textContent = lbl[key];
  }
  const delivInput = document.getElementById('f-delivery-apps');
  if (delivInput) delivInput.style.display = foodState.delivery === true ? 'block' : 'none';
}

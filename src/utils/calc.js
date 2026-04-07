// ════════════════════════════════════════
//  Business calculation utilities
// ════════════════════════════════════════

import { PLANS } from '../constants.js';
import { feeStr } from './format.js';

/**
 * Given an actual funding amount (만원), determine the applicable plan
 * and compute the actual service fee at 8.8%.
 * Bug fix: plan selection uses >= comparison so boundary values work correctly.
 */
export function calcActualPlan(actualWon) {
  const RATE = 0.088; // 8.8% — 천만원당 88만원
  const fee  = Math.round(actualWon * 10000 * RATE);

  const sorted = ['E','D','C','B','A','A1','A2','S','S1','S2'];
  let planKey  = sorted[sorted.length - 1]; // default to max if exceeds all
  for (const k of sorted) {
    if (actualWon <= PLANS[k].target) { planKey = k; break; }
  }
  return { plan: PLANS[planKey], fee, planKey };
}

/** Update the plan preview box in the add/edit modal */
export function updatePlanPreview() {
  const key = document.getElementById('f-plan')?.value;
  const el  = document.getElementById('planPreview');
  if (!el) return;
  const p = PLANS[key];
  if (!p) { el.classList.remove('show'); return; }
  document.getElementById('pp-name').textContent = p.name;
  document.getElementById('pp-fee').textContent  = feeStr(p.fee);
  document.getElementById('pp-desc').textContent = `목표 조달금액: ${p.target.toLocaleString()}만원`;
  el.classList.add('show');
}

/** Update the actual-fund plan preview box in the add/edit modal */
export function updateActualPlan() {
  const actual = parseFloat(document.getElementById('f-actualFund')?.value);
  const el     = document.getElementById('actualPlanPreview');
  if (!el) return;
  if (!actual || isNaN(actual)) { el.classList.remove('show'); return; }
  const { plan, fee } = calcActualPlan(actual);
  document.getElementById('ap-name').textContent = `실제 플랜: ${plan.name}`;
  document.getElementById('ap-fee').textContent  = `실제 용역비: ${feeStr(fee)}`;
  document.getElementById('ap-desc').textContent = `${actual.toLocaleString()}만원 × 8.8%`;
  el.classList.add('show');
}

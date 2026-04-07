// ════════════════════════════════════════
//  Collect view + collect popup
// ════════════════════════════════════════

import { state }           from '../state.js';
import { upsertCustomer }  from '../db/customers.js';
import { today, nowTimestamp, esc, csvField } from '../utils/format.js';
import { renderList }      from './list.js';
import { renderDetail }    from './detail.js';
import { showToast }       from './toast.js';

// ── View switching ────────────────────────────────────────────────

export function openCollectView() {
  const mainView    = document.getElementById('mainView');
  const detailView  = document.getElementById('detailView');
  const collectView = document.getElementById('collectView');

  mainView.classList.add('view-slide-out-left');
  mainView.addEventListener('animationend', function handler() {
    mainView.removeEventListener('animationend', handler);
    mainView.style.display    = 'none';
    detailView.style.display  = 'none';
    mainView.classList.remove('view-slide-out-left');

    renderCollectView();
    collectView.style.display = 'block';
    collectView.classList.remove('view-slide-in-right');
    void collectView.offsetWidth;
    collectView.classList.add('view-slide-in-right');
    collectView.addEventListener('animationend', function h2() {
      collectView.removeEventListener('animationend', h2);
      collectView.classList.remove('view-slide-in-right');
    }, { once: true });
  }, { once: true });
}

export function closeCollectView() {
  const mainView    = document.getElementById('mainView');
  const collectView = document.getElementById('collectView');

  collectView.classList.add('view-slide-out-right');
  collectView.addEventListener('animationend', function handler() {
    collectView.removeEventListener('animationend', handler);
    collectView.style.display = 'none';
    collectView.classList.remove('view-slide-out-right');
    state.currentDetailId = null;

    renderList();
    mainView.style.display = 'block';
    mainView.classList.remove('view-slide-in-left');
    void mainView.offsetWidth;
    mainView.classList.add('view-slide-in-left');
    mainView.addEventListener('animationend', function h2() {
      mainView.removeEventListener('animationend', h2);
      mainView.classList.remove('view-slide-in-left');
    }, { once: true });
  }, { once: true });
}

// ── Render ────────────────────────────────────────────────────────

export function renderCollectView(filterMonth) {
  const allCollected  = state.customers.filter(c => c.collectInfo);
  const months        = {};
  allCollected.forEach(c => {
    const m = (c.collectInfo.date || '').slice(0, 7) || '날짜미입력';
    if (!months[m]) months[m] = [];
    months[m].push(c);
  });
  const sortedMonths  = Object.keys(months).sort().reverse();
  const curMonth      = filterMonth || sortedMonths[0] || 'all';
  const collected     = curMonth === 'all' ? allCollected : (months[curMonth] || []);

  const totalAmount   = collected.reduce((s,c) => s + (parseFloat(c.collectInfo.amount) ||0), 0);
  const totalSales    = collected.reduce((s,c) => s + (parseFloat(c.collectInfo.sales)  ||0), 0);
  const totalDeposit  = collected.reduce((s,c) => s + (parseFloat(c.collectInfo.deposit)||0), 0);
  const fmtW          = n => Math.round(n).toLocaleString() + '원';

  const monthTabs = `
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px;">
      <button onclick="renderCollectView('all')" class="export-btn" style="${curMonth==='all'?'background:rgba(52,211,153,0.3);border-color:var(--accent);color:#fff;':''}">전체 (${allCollected.length}건)</button>
      ${sortedMonths.map(m => `
        <button onclick="renderCollectView('${m}')" class="export-btn" style="${curMonth===m?'background:rgba(52,211,153,0.3);border-color:var(--accent);color:#fff;':''}">
          ${m==='날짜미입력'?'날짜없음':m.replace('-','년 ')+'월'} (${months[m].length}건)
        </button>`).join('')}
    </div>`;

  const rows = collected.length ? collected.map((c, i) => {
    const ci = c.collectInfo;
    return `<tr>
      <td style="text-align:center;color:var(--dim);font-size:11px;">${i+1}</td>
      <td>${ci.applyDate||'-'}</td><td>${ci.date||'-'}</td>
      <td><div class="cv-name">${esc(c.name||'')} 대표</div><div class="cv-phone">${esc(c.phone||ci.phone||'')}</div></td>
      <td class="r">${ci.approved ? parseFloat(ci.approved).toLocaleString()+'만원' : '-'}</td>
      <td><span class="ct-badge">${esc(ci.foundation||'-')}</span></td>
      <td class="r" style="color:#facc15;">${fmtW(ci.amount||0)}</td>
      <td class="r" style="color:var(--dim);">${ci.pct||'-'}%</td>
      <td class="r" style="color:var(--accent2);">${fmtW(ci.deposit||0)}</td>
      <td class="r" style="color:var(--accent);">${fmtW(ci.sales||0)}</td>
      <td><button class="dsec-edit-btn" onclick="openCollectPopup('${c.id}')">수정</button></td>
    </tr>`;
  }).join('') : '';

  document.getElementById('collectView').innerHTML = `
    <div class="collect-view-header">
      <div class="collect-view-title">💰 수금관리</div>
      <div style="display:flex;gap:8px;">
        <button class="export-btn" onclick="exportCSV()">⬇ CSV 내보내기</button>
        <button class="export-btn" style="background:rgba(255,255,255,0.07);color:var(--dim);border-color:rgba(255,255,255,0.15);" onclick="closeCollectView()">← 목록으로</button>
      </div>
    </div>
    ${monthTabs}
    <div class="collect-summary-row">
      <div class="cs-card"><div class="cs-label">수금 건수</div><div class="cs-val blue">${collected.length}건</div></div>
      <div class="cs-card"><div class="cs-label">총 수금금액</div><div class="cs-val gold">${fmtW(totalAmount)}</div></div>
      <div class="cs-card"><div class="cs-label">총 입금금액</div><div class="cs-val">${fmtW(totalDeposit)}</div></div>
      <div class="cs-card"><div class="cs-label">총 매출 (VAT제외)</div><div class="cs-val green">${fmtW(totalSales)}</div></div>
    </div>
    <div class="collect-table-wrap">
      ${collected.length === 0
        ? `<div class="collect-empty"><div class="collect-empty-ico">💳</div><div>해당 기간 수금 내역이 없습니다</div></div>`
        : `<div style="overflow-x:auto;"><table class="collect-table">
            <thead><tr><th>#</th><th>접수일</th><th>수금일</th><th>고객명 / 전화번호</th>
              <th class="r">승인금액</th><th>재단/기관</th>
              <th class="r">수금금액</th><th class="r">%</th>
              <th class="r">입금금액</th><th class="r">매출금액</th><th></th>
            </tr></thead>
            <tbody>${rows}
              <tr class="sum-row">
                <td colspan="6">합계 (${collected.length}건)</td>
                <td class="r">${fmtW(totalAmount)}</td><td>-</td>
                <td class="r">${fmtW(totalDeposit)}</td>
                <td class="r">${fmtW(totalSales)}</td><td></td>
              </tr>
            </tbody>
           </table></div>`}
    </div>`;
}

// ── Popup ─────────────────────────────────────────────────────────

export function openCollectPopup(id) {
  const c = state.findCustomer(id); if (!c) return;
  const ci = c.collectInfo || {};
  document.getElementById('cp-cid').value       = id;
  document.getElementById('cp-name').value      = (c.name||'') + ' 대표';
  document.getElementById('cp-phone').value     = ci.phone || c.phone || '';
  document.getElementById('cp-apply').value     = ci.applyDate || c.applyDate || c.stepDates?.[9] || '';
  document.getElementById('cp-date').value      = ci.date || c.collectDate || today();
  document.getElementById('cp-foundation').value = ci.foundation || '보증드림';
  document.getElementById('cp-approved').value  = ci.approved || (c.actualFund||'');
  document.getElementById('cp-pct').value       = ci.pct || '8.8';
  document.getElementById('cp-amount').value    = ci.amount || '';
  document.getElementById('cp-deposit').value   = ci.deposit || '';
  document.getElementById('cp-sales').value     = ci.sales ? Math.round(ci.sales).toLocaleString()+'원' : '';
  calcCollectAuto();
  document.getElementById('collectPopup').classList.add('open');
}

export function closeCollectPopup() {
  document.getElementById('collectPopup').classList.remove('open');
}

function getPct() {
  const sel = document.getElementById('cp-pct').value;
  if (sel === 'custom') return parseFloat(document.getElementById('cp-pct-custom').value) || 0;
  return parseFloat(sel) || 0;
}

export function calcCollectAuto() {
  const approved = parseFloat(document.getElementById('cp-approved').value) || 0;
  const pct      = getPct();
  const pctSel   = document.getElementById('cp-pct').value;
  document.getElementById('cp-pct-custom').style.display = pctSel === 'custom' ? 'block' : 'none';
  if (approved && pct) {
    const amount = Math.round(approved * 10000 * pct / 100);
    document.getElementById('cp-amount').value  = amount;
    document.getElementById('cp-deposit').value = amount;
    document.getElementById('cp-auto-txt').textContent =
      `${approved}만원 × ${pct}% = ${amount.toLocaleString()}원 (자동계산)`;
    calcCollectVat();
  }
}

export function calcCollectVat() {
  const amount = parseFloat(document.getElementById('cp-amount').value) || 0;
  if (amount) {
    const sales = Math.round(amount / 1.1);
    document.getElementById('cp-sales').value = sales.toLocaleString() + '원';
  }
}

export async function saveCollect() {
  const id     = document.getElementById('cp-cid').value;
  const c      = state.findCustomer(id); if (!c) return;
  const amount = parseFloat(document.getElementById('cp-amount').value) || 0;
  const deposit= parseFloat(document.getElementById('cp-deposit').value) || 0;
  const salesStr = document.getElementById('cp-sales').value.replace(/[^0-9]/g,'');
  c.collectInfo = {
    phone:      document.getElementById('cp-phone').value.trim(),
    applyDate:  document.getElementById('cp-apply').value,
    date:       document.getElementById('cp-date').value,
    foundation: document.getElementById('cp-foundation').value,
    approved:   parseFloat(document.getElementById('cp-approved').value) || 0,
    pct:        getPct(),
    amount, deposit,
    sales:      parseFloat(salesStr) || Math.round(amount / 1.1),
  };
  c.collected   = '완료';
  c.collectDate = c.collectInfo.date;
  if (!c.memos) c.memos = [];
  c.memos.push({ date: nowTimestamp(), text: `✅ 수금완료 등록 — ${c.collectInfo.foundation} / ${amount.toLocaleString()}원` });

  closeCollectPopup();
  showToast('✅ 수금완료 저장됐어요!');
  if (state.currentDetailId === id) renderDetail(id);
  else if (document.getElementById('collectView').style.display !== 'none') renderCollectView();
  else renderList();

  await upsertCustomer(c);
}

// ── CSV export ────────────────────────────────────────────────────

export function exportCSV() {
  const collected = state.customers.filter(c => c.collectInfo);
  const header    = ['순번','접수일','수금일','고객명','전화번호','승인금액(만원)','재단/기관','수금금액(원)','퍼센트(%)','입금금액(원)','매출금액(원)'];
  const rows      = collected.map((c, i) => {
    const ci = c.collectInfo;
    return [
      i+1,
      csvField(ci.applyDate||''),
      csvField(ci.date||''),
      csvField((c.name||'')+'대표'),
      csvField(c.phone||ci.phone||''),
      ci.approved||'',
      csvField(ci.foundation||''),
      ci.amount||0,
      ci.pct||'',
      ci.deposit||0,
      ci.sales||0,
    ].join(',');
  });
  const csv = '\uFEFF' + [header.join(','), ...rows].join('\n');
  const a   = document.createElement('a');
  a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `단군비즈_수금관리_${today()}.csv`;
  a.click();
}

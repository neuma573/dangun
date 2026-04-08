// ════════════════════════════════════════
//  대출계산기 패널 (loan calculator panel)
// ════════════════════════════════════════

export function openLoanPanel()  { document.getElementById('loanPanel').classList.add('open');    }
export function closeLoanPanel() { document.getElementById('loanPanel').classList.remove('open'); }

// ── Selector sync ─────────────────────────────────────────────────

export function lcSyncSel() {
  const v = document.getElementById('lc-loanSel').value;
  document.getElementById('lc-loanInp').value = v || '';
}
export function lcSyncInp() {
  const v    = document.getElementById('lc-loanInp').value;
  const opts = [1000,2000,3000,4000,5000,6000,7000,8000,9000,10000];
  const sel  = document.getElementById('lc-loanSel');
  sel.value  = opts.includes(parseInt(v)) ? v : '';
}
export function lcSyncRateSel() {
  const v = document.getElementById('lc-rateSel').value;
  if (v) document.getElementById('lc-rateInp').value = v;
}

// ── Format helpers ────────────────────────────────────────────────

function lcFmt(n) {
  return n === 0 ? '0' : Math.round(n).toLocaleString('ko-KR') + '원';
}
function lcFmtShort(n) {
  n = Math.round(n);
  if (n >= 100000000) return (n/100000000).toFixed(1).replace(/\.0$/, '') + '억원';
  if (n >= 10000)     return Math.round(n/10000).toLocaleString() + '만원';
  return n.toLocaleString() + '원';
}

// ── Calculate ─────────────────────────────────────────────────────

export function lcCalculate() {
  const loanW   = parseFloat(document.getElementById('lc-loanInp').value)  || parseFloat(document.getElementById('lc-loanSel').value);
  const rateY   = parseFloat(document.getElementById('lc-rateInp').value)  || parseFloat(document.getElementById('lc-rateSel').value);
  const termY   = parseInt(document.getElementById('lc-termSel').value);
  const graceM  = parseInt(document.getElementById('lc-graceSel').value);
  if (!loanW || !rateY) { alert('대출 원금과 연이자율을 입력해주세요.'); return; }

  const principal    = loanW * 10000;
  const monthlyRate  = rateY / 100 / 12;
  const totalMonths  = termY * 12;
  const repayMonths  = totalMonths - graceM;
  const graceInt     = principal * monthlyRate;
  let monthlyPay = 0;
  if (repayMonths > 0) {
    if (monthlyRate === 0) monthlyPay = principal / repayMonths;
    else monthlyPay = principal * monthlyRate * Math.pow(1+monthlyRate, repayMonths) / (Math.pow(1+monthlyRate, repayMonths) - 1);
  }
  const totalGrace    = graceInt * graceM;
  const totalRepay    = monthlyPay * repayMonths;
  const totalInterest = totalGrace + (totalRepay - principal);
  const totalPayment  = totalGrace + totalRepay;
  const burden        = (totalInterest / principal * 100).toFixed(1);

  document.getElementById('lc-principal').textContent    = lcFmtShort(principal);
  document.getElementById('lc-graceMonthly').textContent = graceM > 0 ? lcFmtShort(graceInt) : '-';
  document.getElementById('lc-gracePeriod').textContent  = graceM > 0 ? `거치 ${graceM}개월` : '거치기간 없음';
  document.getElementById('lc-monthly').textContent      = lcFmtShort(monthlyPay);
  document.getElementById('lc-monthlySub').textContent   = `상환 ${repayMonths}개월`;
  document.getElementById('lc-totalInterest').textContent= lcFmtShort(totalInterest);
  document.getElementById('lc-totalPayment').textContent = lcFmtShort(totalPayment);
  document.getElementById('lc-burden').textContent       = burden + '%';
  document.getElementById('lc-summary').style.display    = 'grid';

  const tbody = document.getElementById('lc-tbody');
  tbody.innerHTML = '';
  let balance = principal, totP=0, totI=0, totT=0;
  for (let m=1; m<=totalMonths; m++) {
    const isGrace = m <= graceM;
    const tr = document.createElement('tr');
    let pp, pi, pt;
    if (isGrace) {
      pi=balance*monthlyRate; pp=0; pt=pi; tr.classList.add('lc-grace');
    } else {
      pi=balance*monthlyRate; pp=monthlyPay-pi;
      if (pp > balance) pp = balance;
      pt=pp+pi; balance-=pp; if(balance<1) balance=0;
    }
    totP+=pp; totI+=pi; totT+=pt;
    tr.innerHTML = `<td>${isGrace?m+'회 (거치)':m+'회'}</td><td class="${pp>0?'lc-td-p':'lc-td-z'}">${pp>0?lcFmt(pp):'-'}</td><td class="lc-td-i">${lcFmt(pi)}</td><td class="lc-td-t">${lcFmt(pt)}</td><td class="lc-td-b">${lcFmt(balance)}</td>`;
    tbody.appendChild(tr);
  }
  const totTr = document.createElement('tr');
  totTr.classList.add('lc-total');
  totTr.innerHTML = `<td>합계</td><td>${lcFmt(totP)}</td><td>${lcFmt(totI)}</td><td>${lcFmt(totT)}</td><td>-</td>`;
  tbody.appendChild(totTr);
  document.getElementById('lc-schedule').style.display = 'block';
  document.getElementById('lc-rateInp').value = document.getElementById('lc-rateInp').value || '3.0';
}

// ── Init default rate on load ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('lc-rateInp');
  if (el) el.value = '3.0';
});

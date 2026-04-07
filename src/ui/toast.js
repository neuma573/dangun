// ════════════════════════════════════════
//  Toast notification
// ════════════════════════════════════════

let _toastEl = null;

export function showToast(msg) {
  if (!_toastEl) {
    _toastEl = document.createElement('div');
    _toastEl.id = 'crmToast';
    _toastEl.style.cssText = `
      position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
      background:rgba(5,150,105,0.95);color:#fff;
      padding:12px 24px;border-radius:10px;
      font-family:'Noto Sans KR',sans-serif;
      font-size:14px;font-weight:700;z-index:9999;
      box-shadow:0 4px 20px rgba(0,0,0,0.4);
      opacity:0;transition:opacity .3s ease;pointer-events:none;
    `;
    document.body.appendChild(_toastEl);
  }
  _toastEl.textContent = msg;
  _toastEl.style.opacity = '1';
  clearTimeout(_toastEl._timer);
  _toastEl._timer = setTimeout(() => { _toastEl.style.opacity = '0'; }, 2800);
}

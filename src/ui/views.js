// ════════════════════════════════════════
//  View switching with slide animations
// ════════════════════════════════════════

import { state }        from '../state.js';
import { renderDetail } from './detail.js';
import { renderList }   from './list.js';

// ── openDetail ───────────────────────────────────────────────────

export function openDetail(id) {
  state.currentDetailId = id;
  const mainView   = document.getElementById('mainView');
  const detailView = document.getElementById('detailView');

  mainView.classList.add('view-slide-out-left');
  mainView.addEventListener('animationend', function handler() {
    mainView.removeEventListener('animationend', handler);
    mainView.style.display = 'none';
    mainView.classList.remove('view-slide-out-left');

    renderDetail(id);
    detailView.style.display = 'block';
    detailView.classList.remove('view-slide-in-right');
    void detailView.offsetWidth;
    detailView.classList.add('view-slide-in-right');
    detailView.addEventListener('animationend', function h2() {
      detailView.removeEventListener('animationend', h2);
      detailView.classList.remove('view-slide-in-right');
    }, { once: true });
  }, { once: true });
}

// ── goHome ───────────────────────────────────────────────────────

export function goHome() {
  const mainView    = document.getElementById('mainView');
  const detailView  = document.getElementById('detailView');
  const collectView = document.getElementById('collectView');
  const trashView   = document.getElementById('trashView');

  // Trash view has no animation
  if (trashView?.style.display !== 'none') {
    return _goHomeInstant();
  }

  const activeView = detailView?.style.display !== 'none'  ? detailView
                   : collectView?.style.display !== 'none' ? collectView
                   : null;

  if (!activeView) {
    state.currentDetailId = null;
    renderList();
    return;
  }

  activeView.classList.add('view-slide-out-right');
  activeView.addEventListener('animationend', function handler() {
    activeView.removeEventListener('animationend', handler);
    activeView.style.display = 'none';
    activeView.classList.remove('view-slide-out-right');
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

export function _goHomeInstant() {
  state.currentDetailId = null;
  const cv = document.getElementById('collectView');
  const tv = document.getElementById('trashView');
  const dv = document.getElementById('detailView');
  if (cv) cv.style.display = 'none';
  if (tv) tv.style.display = 'none';
  if (dv) dv.style.display = 'none';
  document.getElementById('mainView').style.display = 'block';
  renderList();
}

// ════════════════════════════════════════
//  Drag-and-drop manual sort
// ════════════════════════════════════════

import { state }              from '../state.js';
import { persistSortOrder }   from '../db/customers.js';
import { renderList }         from './list.js';
import { showToast }          from './toast.js';

export function initDragDrop() {
  const list = document.getElementById('custList');
  if (!list) return;

  function clearGapIndicators() {
    document.querySelectorAll('.drag-gap-indicator').forEach(el => el.remove());
  }

  function getOrCreateGap(refCard, position) {
    clearGapIndicators();
    const gap       = document.createElement('div');
    gap.className   = 'drag-gap-indicator';
    gap.style.cssText = 'height:4px;border-radius:2px;background:var(--accent);box-shadow:0 0 8px rgba(52,211,153,0.6);margin:2px 0;transition:none;pointer-events:none;';
    if (position === 'before') list.insertBefore(gap, refCard);
    else if (refCard.nextSibling) list.insertBefore(gap, refCard.nextSibling);
    else list.appendChild(gap);
    return gap;
  }

  list.querySelectorAll('.ccard[draggable="true"]').forEach(card => {
    card.addEventListener('dragstart', e => {
      state.dragSrcId = card.dataset.id;
      setTimeout(() => card.classList.add('dragging'), 0);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', state.dragSrcId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      clearGapIndicators();
      state.dragSrcId = null;
    });

    card.addEventListener('dragover', e => {
      e.preventDefault();
      if (card.dataset.id === state.dragSrcId) return;
      e.dataTransfer.dropEffect = 'move';
      const midY = card.getBoundingClientRect().top + card.getBoundingClientRect().height / 2;
      getOrCreateGap(card, e.clientY < midY ? 'before' : 'after');
    });

    card.addEventListener('dragleave', e => {
      if (!list.contains(e.relatedTarget)) clearGapIndicators();
    });

    card.addEventListener('drop', e => {
      e.preventDefault();
      if (!state.dragSrcId || card.dataset.id === state.dragSrcId) { clearGapIndicators(); return; }
      const rect        = card.getBoundingClientRect();
      const insertBefore = e.clientY < rect.top + rect.height / 2;
      const fromIdx     = state.customers.findIndex(x => x.id === state.dragSrcId);
      const toIdx       = state.customers.findIndex(x => x.id === card.dataset.id);
      if (fromIdx === -1 || toIdx === -1) { clearGapIndicators(); return; }
      const [moved]     = state.customers.splice(fromIdx, 1);
      const newToIdx    = state.customers.findIndex(x => x.id === card.dataset.id);
      state.customers.splice(insertBefore ? newToIdx : newToIdx + 1, 0, moved);
      clearGapIndicators();
      renderList();
      showToast('순서가 변경됐어요');
      persistSortOrder(state.customers);
    });
  });

  // Allow drop below last card
  list.addEventListener('dragover', e => {
    e.preventDefault();
    const cards = [...list.querySelectorAll('.ccard[draggable="true"]:not(.dragging)')];
    if (!cards.length) return;
    const lastCard = cards[cards.length - 1];
    if (e.clientY > lastCard.getBoundingClientRect().bottom) {
      clearGapIndicators();
      const gap = document.createElement('div');
      gap.className   = 'drag-gap-indicator';
      gap.style.cssText = 'height:4px;border-radius:2px;background:var(--accent);box-shadow:0 0 8px rgba(52,211,153,0.6);margin:2px 0;pointer-events:none;';
      list.appendChild(gap);
    }
  });

  list.addEventListener('drop', e => {
    e.preventDefault();
    if (!state.dragSrcId) return;
    const cards = [...list.querySelectorAll('.ccard[draggable="true"]:not(.dragging)')];
    if (!cards.length) return;
    const lastCard = cards[cards.length - 1];
    if (lastCard.dataset.id === state.dragSrcId) return;
    if (e.clientY > lastCard.getBoundingClientRect().bottom) {
      const fromIdx = state.customers.findIndex(x => x.id === state.dragSrcId);
      if (fromIdx === -1) return;
      const [moved] = state.customers.splice(fromIdx, 1);
      state.customers.push(moved);
      renderList();
      showToast('순서가 변경됐어요');
      persistSortOrder(state.customers);
    }
  });
}

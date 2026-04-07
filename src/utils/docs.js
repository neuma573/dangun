// ════════════════════════════════════════
//  Document checklist utilities
// ════════════════════════════════════════

import { DOCS_SOLE, DOCS_CORP } from '../constants.js';

/**
 * Returns the base document list for a customer based on business type,
 * industry, and home ownership.
 */
export function getDocsByType(biztype, industry, homeOwnership) {
  const base = biztype === 'corp' ? [...DOCS_CORP] : [...DOCS_SOLE];
  const ind = (industry || '').replace(/\s/g, '').toLowerCase();
  const isJiip = ind.includes('지입') || (ind.includes('운수') && ind.includes('지입'));

  if (isJiip) base.push('지입계약서');

  const ho = (homeOwnership || '').trim();
  if (ho === '자가(본인)') base.push('등기부등본 (자택)');
  else if (ho === '자가(배우자)' || ho === '자가(가족)') {
    base.push('등기부등본 (자택)', '가족관계증명서');
  } else if (ho === '전월세') {
    base.push('임대차계약서 (자택)');
  }
  return base;
}

/**
 * Ensures c.docItems is in the new { name, checked, custom } format.
 * Migrates from the legacy c.docs boolean array if needed.
 * Mutates c in place and returns c.docItems.
 */
export function ensureDocItems(c) {
  // Already in new format
  if (Array.isArray(c.docItems) && c.docItems.length > 0 && typeof c.docItems[0] === 'object') {
    return c.docItems;
  }

  const baseNames = getDocsByType(c.biztype || 'sole', c.industry || '', c.homeOwnership || '');
  const oldDocs   = Array.isArray(c.docs) ? c.docs : [];

  const items = baseNames.map((name, i) => ({ name, checked: !!oldDocs[i], custom: false }));

  // Migrate old customDocs
  if (Array.isArray(c.customDocs)) {
    c.customDocs.forEach((name, j) => {
      const checked = !!oldDocs[baseNames.length + j];
      items.push({ name, checked, custom: true });
    });
  }

  c.docItems = items;
  return c.docItems;
}

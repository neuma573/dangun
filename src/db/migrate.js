// ════════════════════════════════════════
//  One-time migration: localStorage → Supabase
//  Runs automatically on first load if old data exists.
// ════════════════════════════════════════

import { LEGACY_SK, LEGACY_TRASH_SK } from '../constants.js';
import { insertCustomer }             from './customers.js';
import { addToTrash }                 from './trash.js';
import { showToast }                  from '../ui/toast.js';

const MIGRATED_KEY = 'dangoon_migrated_v1';

export async function migrateFromLocalStorage() {
  if (localStorage.getItem(MIGRATED_KEY)) return; // already done

  let customers = [];
  let trash     = [];
  try { customers = JSON.parse(localStorage.getItem(LEGACY_SK))    || []; } catch {}
  try { trash     = JSON.parse(localStorage.getItem(LEGACY_TRASH_SK)) || []; } catch {}

  if (!customers.length && !trash.length) {
    localStorage.setItem(MIGRATED_KEY, '1');
    return;
  }

  showToast(`⏳ 기존 데이터 ${customers.length}건 Supabase로 이전 중...`);

  // Migrate in batches to avoid timeout
  for (const c of customers) {
    try { await insertCustomer(c); } catch(e) { console.warn('migrate customer skip', c.id, e.message); }
  }
  for (const item of trash) {
    try { await addToTrash(item); } catch(e) { console.warn('migrate trash skip', item.id, e.message); }
  }

  localStorage.setItem(MIGRATED_KEY, '1');
  showToast(`✦ 데이터 이전 완료! (${customers.length}건)`);
}

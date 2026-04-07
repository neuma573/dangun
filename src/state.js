// ════════════════════════════════════════
//  Global mutable state
//  Single source of truth for the app.
//  All modules import from here instead of using top-level vars.
// ════════════════════════════════════════

export const state = {
  customers:       /** @type {any[]} */ ([]),
  curFilter:       '전체',
  editId:          /** @type {string|null} */ (null),
  stepFilter:      -1,
  currentDetailId: /** @type {string|null} */ (null),
  dragSrcId:       /** @type {string|null} */ (null),

  // ── helpers ─────────────────────────────────

  findCustomer(id) {
    return this.customers.find(c => c.id === id) ?? null;
  },

  upsertLocal(updated) {
    const i = this.customers.findIndex(c => c.id === updated.id);
    if (i === -1) {
      this.customers.unshift(updated);
    } else {
      this.customers[i] = updated;
    }
  },

  removeLocal(id) {
    this.customers = this.customers.filter(c => c.id !== id);
  },

  prependLocal(customer) {
    this.customers.unshift(customer);
  },
};

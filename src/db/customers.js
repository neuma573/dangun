// ════════════════════════════════════════
//  Supabase CRUD — customers table
//
//  Column naming: DB uses snake_case; JS uses camelCase.
//  toRow()   converts a JS customer object → DB row
//  fromRow() converts a DB row             → JS customer object
// ════════════════════════════════════════

import { supabase } from './client.js';

// ── Mapping helpers ──────────────────────────────────────────────

function toRow(c, sortOrder) {
  const row = {
    id:             c.id,
    created_at:     c.createdAt     ?? '',
    name:           c.name          ?? '',
    phone:          c.phone         ?? '',
    carrier:        c.carrier       ?? '',
    email:          c.email         ?? '',
    birth:          c.birth         ?? '',
    rrn:            c.rrn           ?? '',
    gender:         c.gender        ?? '',
    homeaddr:       c.homeaddr      ?? '',
    home_ownership: c.homeOwnership ?? '',
    region:         c.region        ?? '',
    biztype:        c.biztype       ?? 'sole',
    bizname:        c.bizname       ?? '',
    bizno:          c.bizno         ?? '',
    industry:       c.industry      ?? '',
    period:         c.period        ?? '',
    revenue:        c.revenue       ?? '',
    employee:       c.employee      ?? '',
    bizaddr:        c.bizaddr       ?? '',
    bank:           c.bank          ?? '',
    score:          c.score         ?? '',
    plan:           c.plan          ?? '',
    actual_fund:    c.actualFund    ?? '',
    apply_route:    c.applyRoute    ?? '',
    consult_date:   c.consultDate   ?? '',
    apply_date:     c.applyDate     ?? '',
    contract_date:  c.contractDate  ?? '',
    fund_date:      c.fundDate      ?? '',
    collect_date:   c.collectDate   ?? '',
    status:         c.status        ?? '',
    sub_status:     c.subStatus     ?? '',
    step_idx:       c.stepIdx       ?? 0,
    collected:      c.collected     ?? '',
    naver:          c.naver         ?? '',
    credit:         c.credit        ?? '',
    consult:        c.consult       ?? '',
    reject_reason:  c.rejectReason  ?? '',
    product:        c.product       ?? '',
    step_dates:     c.stepDates     ?? {},
    hidden_steps:   c.hiddenSteps   ?? [],
    doc_items:      c.docItems      ?? [],
    memos:          c.memos         ?? [],
    food_info:      c.foodInfo      ?? null,
    collect_info:   c.collectInfo   ?? null,
  };
  if (sortOrder !== undefined) row.sort_order = sortOrder;
  return row;
}

function fromRow(row) {
  return {
    id:            row.id,
    createdAt:     row.created_at,
    name:          row.name,
    phone:         row.phone,
    carrier:       row.carrier,
    email:         row.email,
    birth:         row.birth,
    rrn:           row.rrn,
    gender:        row.gender,
    homeaddr:      row.homeaddr,
    homeOwnership: row.home_ownership,
    region:        row.region,
    biztype:       row.biztype,
    bizname:       row.bizname,
    bizno:         row.bizno,
    industry:      row.industry,
    period:        row.period,
    revenue:       row.revenue,
    employee:      row.employee,
    bizaddr:       row.bizaddr,
    bank:          row.bank,
    score:         row.score,
    plan:          row.plan,
    actualFund:    row.actual_fund,
    applyRoute:    row.apply_route,
    consultDate:   row.consult_date,
    applyDate:     row.apply_date,
    contractDate:  row.contract_date,
    fundDate:      row.fund_date,
    collectDate:   row.collect_date,
    status:        row.status || undefined,
    subStatus:     row.sub_status,
    stepIdx:       row.step_idx,
    collected:     row.collected,
    naver:         row.naver,
    credit:        row.credit,
    consult:       row.consult,
    rejectReason:  row.reject_reason,
    product:       row.product,
    stepDates:     row.step_dates   ?? {},
    hiddenSteps:   row.hidden_steps ?? [],
    docItems:      row.doc_items    ?? [],
    memos:         row.memos        ?? [],
    foodInfo:      row.food_info    ?? null,
    collectInfo:   row.collect_info ?? null,
    _sortOrder:    row.sort_order,
  };
}

// ── Public API ───────────────────────────────────────────────────

/** Load all customers ordered by sort_order ascending */
export async function fetchCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(fromRow);
}

/** Insert a new customer. sortOrder defaults to now-timestamp so new items appear at top. */
export async function insertCustomer(c) {
  const sortOrder = Date.now();
  const { error } = await supabase
    .from('customers')
    .insert(toRow(c, sortOrder));
  if (error) throw error;
}

/** Upsert (insert or update) a customer, preserving its existing sort_order. */
export async function upsertCustomer(c) {
  const { error } = await supabase
    .from('customers')
    .upsert(toRow(c), { onConflict: 'id' });
  if (error) throw error;
}

/** Delete a single customer by id. */
export async function deleteCustomer(id) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/**
 * Persist a new manual sort order.
 * Takes the ordered JS array and assigns sort_order = index * 1000.
 * Uses a batch upsert — only sends id + sort_order columns.
 */
export async function persistSortOrder(customers) {
  const rows = customers.map((c, i) => ({ id: c.id, sort_order: i * 1000 }));
  const { error } = await supabase
    .from('customers')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

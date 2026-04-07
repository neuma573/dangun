// ════════════════════════════════════════
//  Supabase CRUD — trash table
//  Stores full customer snapshots as JSONB.
// ════════════════════════════════════════

import { supabase } from './client.js';
import { TRASH_DAYS } from '../constants.js';

/** Fetch all trash items, newest first. Automatically discards expired items. */
export async function fetchTrash() {
  const cutoff = new Date(Date.now() - TRASH_DAYS * 86400000).toISOString();

  // Delete expired rows first
  await supabase.from('trash').delete().lt('deleted_at', cutoff);

  const { data, error } = await supabase
    .from('trash')
    .select('*')
    .order('deleted_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(row => ({
    ...row.customer_data,
    deletedAt: new Date(row.deleted_at).getTime(),
  }));
}

/** Move a customer to trash. */
export async function addToTrash(customer) {
  const snapshot = { ...customer };
  delete snapshot._sortOrder; // internal field, don't persist

  const { error } = await supabase
    .from('trash')
    .insert({ id: customer.id, customer_data: snapshot });
  if (error) throw error;
}

/** Restore a trash item back to customers. Returns the customer data. */
export async function removeFromTrash(id) {
  const { data, error } = await supabase
    .from('trash')
    .delete()
    .eq('id', id)
    .select('customer_data')
    .single();
  if (error) throw error;
  return data.customer_data;
}

/** Empty the entire trash. */
export async function clearTrash() {
  const { error } = await supabase.from('trash').delete().neq('id', '');
  if (error) throw error;
}

/** Delete a single item from trash permanently. */
export async function deleteFromTrash(id) {
  const { error } = await supabase.from('trash').delete().eq('id', id);
  if (error) throw error;
}

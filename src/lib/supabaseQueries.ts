import { supabase } from './supabaseClient';
import { Transaction, CapitalDivision, Spreadsheet, SpreadsheetColumn, SpreadsheetRow } from '../types';

export async function getSessionUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// Capital Divisions
export async function fetchDivisions(): Promise<CapitalDivision[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('capital_divisions')
    .select('id, name, percentage, color')
    .eq('user_id', userId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map(d => ({ ...d, amount: 0 })); // amount will be calculated based on percentage
}

export async function upsertDivisions(divisions: CapitalDivision[]) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('not authenticated');
  const payload = divisions.map(d => ({
    id: d.id && d.id.length === 36 ? d.id : undefined,
    user_id: userId,
    name: d.name,
    percentage: d.percentage,
    color: d.color
  }));
  const { error } = await supabase.from('capital_divisions').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

// Transactions
export async function fetchTransactions(): Promise<Transaction[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t: any) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    category: t.category,
    date: t.date,
    isRecurring: t.is_recurring,
    dueDate: t.due_date ?? undefined,
    status: t.status ?? undefined
  }));
}

export async function addTransaction(t: Omit<Transaction, 'id'>) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('not authenticated');
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    type: t.type,
    amount: t.amount,
    description: t.description,
    category: t.category,
    date: t.date,
    is_recurring: t.isRecurring,
    due_date: t.dueDate ?? null,
    status: t.status ?? null
  });
  if (error) throw error;
}

// Spreadsheets (read)
export async function fetchSpreadsheets(): Promise<Spreadsheet[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];
  const { data: sps, error: e1 } = await supabase
    .from('spreadsheets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (e1) throw e1;

  const ids = (sps ?? []).map(s => s.id);
  if (ids.length === 0) return [];

  const { data: cols, error: e2 } = await supabase
    .from('spreadsheet_columns')
    .select('*')
    .in('spreadsheet_id', ids);
  if (e2) throw e2;

  const { data: rows, error: e3 } = await supabase
    .from('spreadsheet_rows')
    .select('*')
    .in('spreadsheet_id', ids);
  if (e3) throw e3;

  const build = (sp: any): Spreadsheet => ({
    id: sp.id,
    name: sp.name,
    type: sp.type,
    createdAt: sp.created_at,
    columns: (cols ?? []).filter(c => c.spreadsheet_id === sp.id).sort((a, b) => a.position - b.position)
      .map((c: any) => ({ key: c.key, label: c.label, type: c.type, options: c.options ?? undefined })),
    rows: (rows ?? []).filter(r => r.spreadsheet_id === sp.id).map((r: any) => ({ id: r.id, ...r.data }))
  });

  return (sps ?? []).map(build);
}

// Spreadsheets (write)
export async function createSpreadsheet(name: string, type: Spreadsheet['type'], columns: SpreadsheetColumn[]) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('not authenticated');
  const { data: sps, error } = await supabase
    .from('spreadsheets')
    .insert({ user_id: userId, name, type })
    .select('*')
    .single();
  if (error) throw error;

  if (columns && columns.length) {
    const payload = columns.map((c, idx) => ({
      spreadsheet_id: sps.id,
      key: c.key,
      label: c.label,
      type: c.type,
      options: c.options ?? null,
      position: idx,
    }));
    const { error: e2 } = await supabase.from('spreadsheet_columns').insert(payload);
    if (e2) throw e2;
  }
  return sps.id as string;
}

export async function renameSpreadsheet(id: string, name: string) {
  const { error } = await supabase.from('spreadsheets').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteSpreadsheet(id: string) {
  const { error } = await supabase.from('spreadsheets').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertColumns(spreadsheetId: string, columns: SpreadsheetColumn[]) {
  // Estratégia simples: apagar e recriar mantendo position
  const { error: delErr } = await supabase.from('spreadsheet_columns').delete().eq('spreadsheet_id', spreadsheetId);
  if (delErr) throw delErr;
  if (columns.length === 0) return;
  const payload = columns.map((c, idx) => ({
    spreadsheet_id: spreadsheetId,
    key: c.key,
    label: c.label,
    type: c.type,
    options: c.options ?? null,
    position: idx,
  }));
  const { error } = await supabase.from('spreadsheet_columns').insert(payload);
  if (error) throw error;
}

export async function insertRow(spreadsheetId: string, row: SpreadsheetRow) {
  const { error } = await supabase.from('spreadsheet_rows').insert({
    spreadsheet_id: spreadsheetId,
    data: { ...row, id: undefined },
  });
  if (error) throw error;
}

export async function updateRow(spreadsheetId: string, rowId: string, patch: Partial<SpreadsheetRow>) {
  const { error } = await supabase
    .from('spreadsheet_rows')
    .update({ data: patch })
    .eq('id', rowId)
    .eq('spreadsheet_id', spreadsheetId);
  if (error) throw error;
}

export async function deleteRow(spreadsheetId: string, rowId: string) {
  const { error } = await supabase.from('spreadsheet_rows').delete().eq('id', rowId).eq('spreadsheet_id', spreadsheetId);
  if (error) throw error;
}

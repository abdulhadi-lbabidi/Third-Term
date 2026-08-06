import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reInvoicesApi } from './re-invoices.api';
import type { ReInvoicePayload } from './types';

export const RE_INVOICES_KEY = ['re-invoices'] as const;
export const useReInvoices = (params: Record<string, unknown> = {}, enabled = true) => useQuery({ queryKey: [...RE_INVOICES_KEY, params], queryFn: () => reInvoicesApi.getAll(params), enabled });
export function useDeleteReInvoice() { const client = useQueryClient(); return useMutation({ mutationFn: reInvoicesApi.delete, onSuccess: async () => { await client.invalidateQueries({ queryKey: RE_INVOICES_KEY, refetchType: 'all' }); await client.invalidateQueries({ queryKey: ['projects'], refetchType: 'active' }); toast.success('تم حذف المرتجع'); } }); }
export function useSaveReInvoice() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, payload }: { id?: number; payload: ReInvoicePayload }) => id ? reInvoicesApi.update(id, payload) : reInvoicesApi.create(payload), onSuccess: async (_, variables) => { await client.invalidateQueries({ queryKey: RE_INVOICES_KEY, refetchType: 'all' }); await client.invalidateQueries({ queryKey: ['projects'], refetchType: 'active' }); await client.invalidateQueries({ queryKey: ['project-funds'] }); await client.invalidateQueries({ queryKey: ['company-funds'] }); await client.invalidateQueries({ queryKey: ['funds'] }); toast.success(variables.id ? 'تم تحديث المرتجع' : 'تم إنشاء المرتجع'); } }); }

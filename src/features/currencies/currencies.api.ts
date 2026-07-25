import { ApiClient } from '@/shared/api/api-client';
import type { Currency, CreateCurrencyPayload } from './types';

export const currenciesApi = {
  getAll: () => ApiClient.get<Currency[]>('/currencies').then(res => res.data),
  create: (payload: CreateCurrencyPayload) => ApiClient.post<Currency>('/currencies', payload, { successMessage: "تمت الإضافة بنجاح" }),
  update: (id: number, payload: CreateCurrencyPayload) => ApiClient.patch<Currency>(`/currencies/${id}`, payload, { successMessage: "تم التعديل بنجاح" }),
  delete: (id: number) => ApiClient.delete(`/currencies/${id}`, { successMessage: "تم الحذف بنجاح" }),
};

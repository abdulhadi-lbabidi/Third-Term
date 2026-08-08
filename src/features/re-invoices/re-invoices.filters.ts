export type ReInvoiceFundSource = '' | 'project' | 'company' | 'user';

export type ReInvoiceFilterDraft = {
  search: string;
  itemId: number | '';
  supplierId: number | '';
  isPosted: '' | 'true' | 'false';
  isVisibleToClient: '' | 'true' | 'false';
  fundSource: ReInvoiceFundSource;
  fundId: number | '';
};

export const EMPTY_RE_INVOICE_FILTERS: ReInvoiceFilterDraft = {
  search: '', itemId: '', supplierId: '', isPosted: '', isVisibleToClient: '', fundSource: '', fundId: '',
};

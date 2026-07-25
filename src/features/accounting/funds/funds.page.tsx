import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { FundTabs, type FundTabType } from './components/fund-tabs';
import { FundsTable } from './components/funds.table';
import { fundsApi } from './funds.api';
import { FundDialog } from './components/fund.dialog';
import { ExchangeDialog } from './components/exchange.dialog';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import type { FundFormValues } from './components/fund.form';

export function FundsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FundTabType>('personal');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);

  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fundToDelete, setFundToDelete] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'personal') response = await fundsApi.getFunds();
      else if (activeTab === 'company') {
        response = await fundsApi.getCompanyFunds();
      } else if (activeTab === 'projects') {
        response = await fundsApi.getProjectFunds();
      }
      setData(response || []);
    } catch (error) {
      toast.error(t('common.error', 'An error occurred while loading data'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleEdit = (row: any) => {
    setSelectedFund(row);
    setDialogOpen(true);
  };

  const handleDeleteClick = (row: any) => {
    setFundToDelete(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!fundToDelete) return;
    try {
      setIsSubmitting(true);
      if (activeTab === 'personal') await fundsApi.deleteFund(fundToDelete.id);
      else if (activeTab === 'company') await fundsApi.deleteCompanyFund(fundToDelete.id);
      else if (activeTab === 'projects') await fundsApi.deleteProjectFund(fundToDelete.id);
      
      toast.success(t('funds.deleteSuccess', 'Fund deleted successfully'));
      setDeleteDialogOpen(false);
      setFundToDelete(null);
      void loadData();
    } catch (error) {
      toast.error(t('funds.deleteError', 'Failed to delete fund'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmForm = async (values: FundFormValues) => {
    try {
      setIsSubmitting(true);
      const isEditing = !!selectedFund;
      
      if (activeTab === 'personal') {
        if (isEditing) await fundsApi.updateFund(selectedFund.id, values as any);
        else await fundsApi.createFund(values as any);
      } else if (activeTab === 'company') {
        if (isEditing) await fundsApi.updateCompanyFund(selectedFund.id, values as any);
        else await fundsApi.createCompanyFund(values as any);
      } else if (activeTab === 'projects') {
        if (isEditing) await fundsApi.updateProjectFund(selectedFund.id, values as any);
        else await fundsApi.createProjectFund(values as any);
      }

      toast.success(isEditing ? t('funds.updateSuccess', 'Fund updated successfully') : t('funds.createSuccess', 'Fund created successfully'));
      setDialogOpen(false);
      setSelectedFund(null);
      void loadData();
    } catch (error) {
      toast.error(t('funds.saveError', 'Failed to save fund details'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {t('funds.title', 'Funds')}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t('funds.title', 'Funds Dashboard')}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setExchangeDialogOpen(true)} className="h-11 rounded-2xl px-5 text-sm font-semibold shadow-sm">
              {t('funds.exchange', 'Currency Exchange')}
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800">
              {t('funds.addFund', 'Add New Fund')}
            </Button>
          </div>
        </div>
      </div>

      <FundTabs activeTab={activeTab} onChange={setActiveTab} />

      <FundsTable
        data={data}
        isLoading={loading}
        onDelete={handleDeleteClick}
        onEdit={handleEdit}
        onView={(row) => console.log('View', row)}
      />

      <FundDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedFund(null);
        }}
        fund={selectedFund}
        fundType={activeTab}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmForm}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.confirmDelete', 'Confirm Deletion')}</DialogTitle>
            <DialogDescription>
              {t('funds.deleteConfirmation', 'Are you sure you want to delete this fund? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExchangeDialog
        open={exchangeDialogOpen}
        onOpenChange={setExchangeDialogOpen}
        onSuccess={() => void loadData()}
      />
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { DeleteConfirmDialog } from '@/shared/components/ui/delete-confirm-dialog';
import { SimplePagination } from '@/components/ui/pagination';
import { GenericFundCard, GenericFundCardSkeleton } from '@/features/funds-shared/components/generic-fund.card';
import { GenericFundCurrenciesDialog } from '@/features/funds-shared/components/generic-fund-currencies.dialog';
import { GenericFundDialog } from '@/features/funds-shared/components/generic-fund.dialog';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import type { CompanyFund, CreateCompanyFundPayload } from '@/features/company-funds/types';
import { projectFundsApi } from '@/features/projects/project-funds/project-funds.api';
import type { ProjectFund } from '@/features/projects/project-funds/project-funds.types';
import { fundsApi } from '@/features/funds/funds.api';
import type { CreateFundPayload, Fund } from '@/features/funds/types';

export type FavoriteFundKind = 'company' | 'project' | 'user';

type FavoriteFundItem = CompanyFund | ProjectFund | Fund;

const EMPTY_TEXT: Record<FavoriteFundKind, string> = {
  company: 'لا توجد صناديق شركة مميزة.',
  project: 'لا توجد صناديق مشاريع مميزة.',
  user: 'لا توجد صناديق مستخدمين مميزة.',
};

const DELETE_TITLES: Record<FavoriteFundKind, string> = {
  company: 'تأكيد حذف صندوق الشركة',
  project: 'تأكيد حذف صندوق المشروع',
  user: 'تأكيد حذف صندوق المستخدم',
};

function getFundDetailUrl(fund: FavoriteFundItem, kind: FavoriteFundKind): string {
  if (kind === 'company') {
    return `/company-funds?fundId=${fund.id}`;
  }
  if (kind === 'project') {
    const projectFund = fund as ProjectFund;
    return `/projects/${projectFund.project.id}?tab=funds&fundId=${fund.id}`;
  }
  const userFund = fund as Fund;
  const userName = encodeURIComponent(userFund.user.name);
  return `/users/${userFund.user.id}/${userName}/funds?fundId=${fund.id}`;
}

async function fetchFavoriteFunds(kind: FavoriteFundKind, page: number, perPage: number) {
  if (kind === 'company') {
    return companyFundsApi.getFavoriteCompanyFunds({ page, perPage });
  }
  if (kind === 'project') {
    return projectFundsApi.getFavoriteProjectFunds({ page, perPage });
  }
  return fundsApi.getFavoriteFunds({ page, perPage });
}

async function unfavoriteFund(fund: FavoriteFundItem, kind: FavoriteFundKind) {
  if (kind === 'company') {
    return companyFundsApi.updateCompanyFund(fund.id, { is_favorite: false });
  }
  if (kind === 'project') {
    return projectFundsApi.updateProjectFund(fund.id, { is_favorite: false });
  }
  return fundsApi.updateFund(fund.id, { is_favorite: false });
}

async function deleteFund(fund: FavoriteFundItem, kind: FavoriteFundKind) {
  if (kind === 'company') {
    return companyFundsApi.deleteCompanyFund(fund.id);
  }
  if (kind === 'project') {
    return projectFundsApi.deleteProjectFund(fund.id);
  }
  return fundsApi.deleteFund(fund.id);
}

async function updateFund(fund: FavoriteFundItem, kind: FavoriteFundKind, payload: Record<string, unknown>) {
  if (kind === 'company') {
    const apiPayload: CreateCompanyFundPayload = {
      name: String(payload.name ?? ''),
      is_locked: payload.is_locked as CreateCompanyFundPayload['is_locked'],
      status: payload.status as CreateCompanyFundPayload['status'],
      description: payload.description as string | undefined,
      threshold: payload.threshold as number | undefined,
    };
    return companyFundsApi.updateCompanyFund(fund.id, apiPayload);
  }
  if (kind === 'project') {
    return projectFundsApi.updateProjectFund(fund.id, {
      name: String(payload.name ?? ''),
      is_locked: payload.is_locked as ProjectFund['is_locked'],
      status: payload.status as ProjectFund['status'],
      description: payload.description as string | undefined,
      threshold: payload.threshold as number | undefined,
      type: payload.type as string | undefined,
    });
  }
  const userFund = fund as Fund;
  const apiPayload: CreateFundPayload = {
    name: String(payload.name ?? ''),
    user_id: (payload.user_id as number | undefined) ?? userFund.user.id,
    is_locked: payload.is_locked as CreateFundPayload['is_locked'],
    status: payload.status as CreateFundPayload['status'],
    description: payload.description as string | undefined,
    threshold: payload.threshold as number | undefined,
  };
  return fundsApi.updateFund(fund.id, apiPayload);
}

async function invalidateFundQueries(queryClient: ReturnType<typeof useQueryClient>, kind: FavoriteFundKind) {
  await queryClient.invalidateQueries({ queryKey: ['favorite-funds', kind] });
  if (kind === 'company') {
    await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
  } else if (kind === 'project') {
    await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
  } else {
    await queryClient.invalidateQueries({ queryKey: ['funds'] });
  }
}

type FavoriteFundsTabProps = {
  kind: FavoriteFundKind;
};

export function FavoriteFundsTab({ kind }: FavoriteFundsTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.max(1, Number(searchParams.get('perPage')) || 20);

  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [selectedFundForView, setSelectedFundForView] = useState<FavoriteFundItem | null>(null);
  const [favoriteConfirmOpen, setFavoriteConfirmOpen] = useState(false);
  const [fundToUnfavorite, setFundToUnfavorite] = useState<FavoriteFundItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<FavoriteFundItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fundToDelete, setFundToDelete] = useState<FavoriteFundItem | null>(null);

  const favoritesQuery = useQuery({
    queryKey: ['favorite-funds', kind, { page, perPage }],
    queryFn: () => fetchFavoriteFunds(kind, page, perPage),
    placeholderData: keepPreviousData,
  });

  const funds = favoritesQuery.data?.data ?? [];
  const meta = favoritesQuery.data?.meta;

  const unfavoriteMutation = useMutation({
    mutationFn: (fund: FavoriteFundItem) => unfavoriteFund(fund, kind),
    onSuccess: async () => {
      await invalidateFundQueries(queryClient, kind);
      setFavoriteConfirmOpen(false);
      setFundToUnfavorite(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إزالة التمييز');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!selectedFund) throw new Error('الصندوق غير محدد');
      return updateFund(selectedFund, kind, payload);
    },
    onSuccess: async () => {
      await invalidateFundQueries(queryClient, kind);
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
      setDialogOpen(false);
      setSelectedFund(null);
      toast.success('تم تعديل الصندوق بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ الصندوق');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fund: FavoriteFundItem) => deleteFund(fund, kind),
    onSuccess: async () => {
      await invalidateFundQueries(queryClient, kind);
      setDeleteConfirmOpen(false);
      setFundToDelete(null);
      toast.success('تم حذف الصندوق بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف الصندوق');
    },
  });

  const dialogDefaultValues = selectedFund
    ? kind === 'company'
      ? selectedFund as CompanyFund
      : kind === 'project'
        ? {
            id: selectedFund.id,
            name: selectedFund.name ?? '',
            project_id: (selectedFund as ProjectFund).project?.id ?? 0,
            status: selectedFund.status,
            description: selectedFund.description,
            threshold: selectedFund.threshold,
            type: selectedFund.type,
          }
        : {
            id: selectedFund.id,
            name: selectedFund.name ?? '',
            user_id: (selectedFund as Fund).user.id,
            status: selectedFund.status,
            description: selectedFund.description,
            threshold: selectedFund.threshold,
          }
    : undefined;

  return (
    <>
      {favoritesQuery.isLoading ? (
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <GenericFundCardSkeleton key={index} />
          ))}
        </div>
      ) : funds.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full rounded-lg border border-dashed border-border py-16 text-center">
          <Wallet className="mb-4 size-10 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">لا توجد صناديق مميزة</h4>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{EMPTY_TEXT[kind]}</p>
        </div>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {funds.map((fund) => (
            <GenericFundCard
              key={fund.id}
              fundId={fund.id}
              name={fund.name}
              currencies={(fund.currencies ?? []).map((currency) => ({
                id: currency.id,
                currency: currency.currency,
                symbol: currency.symbol,
                balance: currency.balance,
              }))}
              created_at={fund.created_at}
              status={fund.status}
              description={fund.description}
              threshold={fund.threshold}
              type={fund.type}
              onClick={() => navigate(getFundDetailUrl(fund, kind))}
              onMoreCurrenciesClick={() => {
                setSelectedFundForView(fund);
                setCurrenciesDialogOpen(true);
              }}
              onEdit={() => {
                setSelectedFund(fund);
                setDialogOpen(true);
              }}
              onDelete={() => {
                setFundToDelete(fund);
                setDeleteConfirmOpen(true);
              }}
              isFavorite
              onFavoriteClick={() => {
                setFundToUnfavorite(fund);
                setFavoriteConfirmOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {meta ? (
        <SimplePagination
          currentPage={meta.current_page ?? page}
          totalPages={meta.last_page ?? 1}
          onPageChange={(value) => setSearchParams((previous) => {
            previous.set('page', String(value));
            return previous;
          })}
          meta={meta}
          limit={perPage}
          limitOptions={[5, 10, 20, 50]}
          onLimitChange={(value) => setSearchParams((previous) => {
            previous.set('perPage', String(value));
            previous.set('page', '1');
            return previous;
          })}
        />
      ) : null}

      <GenericFundDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedFund(null);
        }}
        fundType={kind === 'user' ? 'user' : kind}
        defaultValues={dialogDefaultValues}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values as Record<string, unknown>);
        }}
        loading={saveMutation.isPending}
        hideUserSelection={kind === 'user'}
        hideProjectSelection={kind === 'project'}
      />

      <GenericFundCurrenciesDialog
        open={currenciesDialogOpen}
        onOpenChange={(open) => {
          setCurrenciesDialogOpen(open);
          if (!open) setSelectedFundForView(null);
        }}
        fund={selectedFundForView as any}
      />

      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setFundToDelete(null);
        }}
        onConfirm={async () => {
          if (fundToDelete) {
            await deleteMutation.mutateAsync(fundToDelete);
          }
        }}
        isDeleting={deleteMutation.isPending}
        title={DELETE_TITLES[kind]}
        description={`هل أنت متأكد من حذف صندوق "${fundToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      <Dialog
        open={favoriteConfirmOpen}
        onOpenChange={(open) => {
          setFavoriteConfirmOpen(open);
          if (!open) setFundToUnfavorite(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إزالة التمييز</DialogTitle>
            <DialogDescription>هل تريد إزالة تمييز الصندوق بالنجمة؟</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFavoriteConfirmOpen(false);
                setFundToUnfavorite(null);
              }}
              disabled={unfavoriteMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!fundToUnfavorite) return;
                await unfavoriteMutation.mutateAsync(fundToUnfavorite);
                toast.success('تم إزالة تمييز الصندوق');
              }}
              disabled={unfavoriteMutation.isPending}
            >
              {unfavoriteMutation.isPending ? 'جاري الحفظ...' : 'تأكيد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

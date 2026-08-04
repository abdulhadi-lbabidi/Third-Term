import { Button } from '@/shared/components/ui/button';
import { Plus, Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import DataTable from 'react-data-table-component';

export function DashboardPage() {
  const recentTransactions = [
    { id: 1, type: 'إيراد', description: 'دفعة من مشروع برج الرياض', amount: 15000, date: '2026-07-28', status: 'مرحل' },
    { id: 2, type: 'مصروف', description: 'شراء مواد بناء', amount: -4500, date: '2026-07-27', status: 'مرحل' },
    { id: 3, type: 'مصروف', description: 'رواتب موظفين', amount: -12000, date: '2026-07-26', status: 'مرحل' },
    { id: 4, type: 'إيراد', description: 'دفعة استشارية', amount: 8000, date: '2026-07-25', status: 'معلق' },
  ];

  const columns = [
    {
      name: 'نوع الحركة',
      selector: (row: any) => row.type,
      sortable: true,
      cell: (row: any) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            row.type === 'إيراد' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      name: 'البيان',
      selector: (row: any) => row.description,
    },
    {
      name: 'المبلغ ($)',
      selector: (row: any) => row.amount,
      sortable: true,
      cell: (row: any) => (
        <span className={`font-mono font-medium ${row.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {Number(Math.abs(row.amount || 0)).toLocaleString()} $
        </span>
      ),
    },
    {
      name: 'التاريخ',
      selector: (row: any) => row.date,
      sortable: true,
    },
    {
      name: 'الحالة',
      selector: (row: any) => row.status,
      cell: (row: any) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            row.status === 'مرحل' ? 'bg-slate-100 text-slate-700' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header Structure */}
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-4 shadow-sm">
        <div className="space-y-1">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Overview
          </span>
          <h1 className="text-2xl font-semibold text-slate-900">الملخص المالي</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
            <Plus className="mr-2 size-4" />
            فاتورة جديدة
          </Button>
          <Button>
            <Plus className="mr-2 size-4" />
            تسجيل حركة مالية
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          
          {/* Executive Overview - Stat Cards */}
          <section>
            <h2 className="mb-4 text-lg font-medium text-slate-800">الأداء المالي (نظرة عامة)</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Balance */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">إجمالي الرصيد</p>
                  <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                    <Wallet className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-mono text-2xl font-bold text-slate-900">124,500 $</h3>
                  <p className="mt-1 flex items-center text-sm text-slate-500">
                    مجموع كافة الصناديق
                  </p>
                </div>
              </div>

              {/* Total Revenues */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">إيرادات الشهر</p>
                  <div className="rounded-full bg-green-50 p-2 text-green-600">
                    <TrendingUp className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-mono text-2xl font-bold text-slate-900">45,200 $</h3>
                  <p className="mt-1 flex items-center text-sm text-green-600">
                    <TrendingUp className="mr-1 size-3" />
                    +12% عن الشهر الماضي
                  </p>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">مصروفات الشهر</p>
                  <div className="rounded-full bg-red-50 p-2 text-red-600">
                    <TrendingDown className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-mono text-2xl font-bold text-slate-900">18,400 $</h3>
                  <p className="mt-1 flex items-center text-sm text-red-600">
                    <TrendingUp className="mr-1 size-3" />
                    +5% عن الشهر الماضي
                  </p>
                </div>
              </div>

              {/* Outstanding Invoices */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">ديون مستحقة الدفع</p>
                  <div className="rounded-full bg-yellow-50 p-2 text-yellow-600">
                    <AlertCircle className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-mono text-2xl font-bold text-slate-900">12,000 $</h3>
                  <p className="mt-1 flex items-center text-sm text-slate-500">
                    3 فواتير قيد الانتظار
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Financial Operations - Recent Transactions */}
          <section>
            <h2 className="mb-4 text-lg font-medium text-slate-800">أحدث العمليات المالية</h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <DataTable
                columns={columns}
                data={recentTransactions}
                customStyles={{
                  headRow: {
                    style: {
                      backgroundColor: '#f8fafc',
                      borderBottomColor: '#e2e8f0',
                      fontWeight: 600,
                    },
                  },
                  cells: {
                    style: {
                      paddingTop: '12px',
                      paddingBottom: '12px',
                    },
                  },
                }}
              />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

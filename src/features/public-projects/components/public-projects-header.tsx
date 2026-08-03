import { LogOut, RefreshCw } from 'lucide-react';

type PublicProjectsHeaderProps = {
  currentUser: { name: string } | null;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export function PublicProjectsHeader({ currentUser, onLogout, onRefresh, isRefreshing }: PublicProjectsHeaderProps) {
  return (
    <header className="bg-white border-b border-[#E7E9EF] sticky top-0 z-30 shadow-xs h-[70px]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#C9A84C] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ن
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-[#17182F] leading-tight">نوح المالية</h1>
              <p className="text-[10px] text-[#667085] font-medium mt-0.5">بوابة مشاريع العميل</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-end">
                  <p className="text-xs font-semibold text-[#172033] leading-none">{currentUser.name}</p>
                  <p className="text-[9px] text-[#C9A84C] mt-1 font-bold">حساب عميل</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="size-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all"
                  title="تسجيل الخروج"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C9A84C]/35 text-xs text-[#C9A84C] hover:bg-[#C9A84C]/5 transition-all font-semibold"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

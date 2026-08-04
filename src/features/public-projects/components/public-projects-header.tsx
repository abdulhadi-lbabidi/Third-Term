import { LogOut, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';

type PublicProjectsHeaderProps = {
  currentUser: { name: string } | null;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onBack?: () => void;
};

export function PublicProjectsHeader({
  currentUser,
  onLogout,
  onRefresh,
  isRefreshing,
  onBack,
}: PublicProjectsHeaderProps) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-30 shadow-finance h-[70px]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center text-accent-gold font-bold text-lg shadow-sm">
              ن
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-foreground leading-tight">نوح المالية</h1>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">بوابة مشاريع العميل</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
           

            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-end">
                  <p className="text-xs font-semibold text-foreground leading-none">{currentUser.name}</p>
                  <p className="text-[9px] text-accent-gold mt-1 font-semibold">حساب عميل</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="size-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all"
                  title="تسجيل الخروج"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent-gold/30 text-xs text-accent-gold hover:bg-accent-gold/10 transition-all font-semibold"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
             {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-xs text-foreground hover:bg-muted transition-all font-semibold"
                title="العودة للمشاريع"
              >
               
                <span className="hidden sm:inline">العودة للمشاريع</span>
                 <ArrowLeft className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

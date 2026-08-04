type CurrencyBalanceCardProps = {
  currency: string;
  balance: string | number;
  symbol: string;
  isPrimary?: boolean;
};

export function CurrencyBalanceCard({ currency, balance, symbol, isPrimary = false }: CurrencyBalanceCardProps) {
  const formatNumber = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isPrimary) {
    return (
      <div className="rounded-lg border border-accent-gold/60 bg-accent-gold/5 text-foreground p-4 relative shadow-finance overflow-hidden group">
        <div className="absolute top-0 start-0 w-[4px] h-full bg-accent-gold" />
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{currency}</p>
        <p className="text-xl font-extrabold text-foreground mt-2 leading-none">
          {formatNumber(balance)} <span className="text-[11px] text-muted-foreground font-semibold">{symbol}</span>
        </p>
        <p className="text-[9px] text-accent-gold mt-3 flex items-center gap-1 font-bold">
          <span className="size-1.5 rounded-full bg-accent-gold" />
          رصيد الصندوق الأساسي
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card text-foreground p-4 relative shadow-finance overflow-hidden hover:border-accent-gold/30 transition-all duration-200">
      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{currency}</p>
      <p className="text-xl font-extrabold text-foreground mt-2 leading-none">
        {formatNumber(balance)} <span className="text-[11px] text-muted-foreground font-semibold">{symbol}</span>
      </p>
      <p className="text-[9px] text-muted-foreground mt-3 flex items-center gap-1">
        <span className="size-1.5 rounded-full bg-border" />
        رصيد صندوق فرعي
      </p>
    </div>
  );
}

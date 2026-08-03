type CurrencyBalanceCardProps = {
  currency: string;
  balance: string | number;
  symbol: string;
  isPrimary?: boolean;
};

export function CurrencyBalanceCard({ currency, balance, symbol, isPrimary = false }: CurrencyBalanceCardProps) {
  const formatNumber = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  if (isPrimary) {
    return (
      <div className="rounded-xl border border-[#C9A84C]/60 bg-[#C9A84C]/5 text-[#172033] p-4 relative shadow-sm overflow-hidden group">
        <div className="absolute top-0 start-0 w-[4px] h-full bg-[#C9A84C]" />
        <p className="text-[10px] text-[#667085] font-bold uppercase tracking-wider">{currency}</p>
        <p className="text-xl font-extrabold text-[#17182F] mt-2 leading-none">
          {formatNumber(balance)} <span className="text-[11px] text-[#667085] font-semibold">{symbol}</span>
        </p>
        <p className="text-[9px] text-[#C9A84C] mt-3 flex items-center gap-1 font-bold">
          <span className="size-1.5 rounded-full bg-[#C9A84C]" />
          رصيد الصندوق الأساسي
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E7E9EF] bg-white text-[#172033] p-4 relative shadow-sm overflow-hidden hover:border-[#C9A84C]/30 transition-all duration-200">
      <p className="text-[10px] text-[#667085] font-bold uppercase tracking-wider">{currency}</p>
      <p className="text-xl font-extrabold text-[#17182F] mt-2 leading-none">
        {formatNumber(balance)} <span className="text-[11px] text-[#667085] font-semibold">{symbol}</span>
      </p>
      <p className="text-[9px] text-[#667085] mt-3 flex items-center gap-1">
        <span className="size-1.5 rounded-full bg-slate-300" />
        رصيد صندوق فرعي
      </p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Slider } from '@/shared/components/ui/slider';
import { fundsApi } from '../funds.api';
import type { Fund } from '../fund.types';
import { toast } from 'sonner';

interface ExchangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExchangeDialog({ open, onOpenChange, onSuccess }: ExchangeDialogProps) {
  const { t } = useTranslation();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [fromFundId, setFromFundId] = useState<string>('');
  const [toFundId, setToFundId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fundsApi.getFunds().then(setFunds).catch(console.error);
      setFromFundId('');
      setToFundId('');
      setAmount('');
      setExchangeRate(1);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!fromFundId || !toFundId || !amount || exchangeRate <= 0) {
      toast.error(t('exchange.missingFields', 'Please fill all required fields correctly'));
      return;
    }

    if (fromFundId === toFundId) {
      toast.error(t('exchange.sameFund', 'Source and destination funds must be different'));
      return;
    }

    try {
      setIsSubmitting(true);
      // In a real scenario, there would be an endpoint like fundsApi.exchange(from, to, amount, rate)
      // Since it's a mock we'll show success.
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(t('exchange.success', 'Currency exchange completed successfully'));
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(t('exchange.error', 'Failed to process exchange'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedResult = Number(amount) * exchangeRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exchange.title', 'Currency Exchange / Transfer')}</DialogTitle>
          <DialogDescription>
            {t('exchange.description', 'Transfer balance between your funds with an exchange rate.')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t('exchange.fromFund', 'From Fund')}</Label>
            <Select value={fromFundId} onValueChange={setFromFundId}>
              <SelectTrigger>
                <SelectValue placeholder={t('exchange.selectFrom', 'Select source fund')} />
              </SelectTrigger>
              <SelectContent>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={String(fund.id)}>
                    {fund.name} (Balance: {fund.balance})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t('exchange.toFund', 'To Fund')}</Label>
            <Select value={toFundId} onValueChange={setToFundId}>
              <SelectTrigger>
                <SelectValue placeholder={t('exchange.selectTo', 'Select destination fund')} />
              </SelectTrigger>
              <SelectContent>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={String(fund.id)}>
                    {fund.name} (Balance: {fund.balance})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t('exchange.amount', 'Amount to Transfer')}</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label className="flex justify-between">
              <span>{t('exchange.rate', 'Exchange Rate')}</span>
              <span className="font-mono">{exchangeRate}</span>
            </Label>
            <Slider
              value={[exchangeRate]}
              min={0.01}
              max={100}
              step={0.01}
              onValueChange={(vals) => setExchangeRate(vals[0])}
            />
          </div>
          
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 border border-slate-200">
            {t('exchange.summary', 'Destination will receive')}: <strong className="text-slate-900">{calculatedResult.toFixed(2)}</strong>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('common.processing', 'Processing...') : t('exchange.submit', 'Confirm Exchange')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

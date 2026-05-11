import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { MiniCalculator } from './MiniCalculator';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

interface AIAssistantProps {
  onCalculateApply?: (result: number) => void;
}

export function AIAssistant({ onCalculateApply }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastCalculatedAmount, setLastCalculatedAmount] = useState<number>(0);
  const addTransaction = useStore((state) => state.addTransaction);

  const handleApplyAmount = (amount: number) => {
    setLastCalculatedAmount(amount);
    window.dispatchEvent(new CustomEvent('applyAmount', { detail: { amount } }));
    onCalculateApply?.(amount);
    setIsOpen(false);
  };

  const handleAddAsIncome = async () => {
    if (lastCalculatedAmount > 0) {
      await addTransaction({
        amount: lastCalculatedAmount,
        type: 'income',
        category: 'Salary',
        date: new Date().toISOString(),
        description: 'Added from AI Calculator'
      });
      toast.success(`₹${lastCalculatedAmount.toFixed(2)} added as income!`);
      setIsOpen(false);
      setLastCalculatedAmount(0);
    } else {
      toast.error('Calculate an amount first');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full transition-all"
          title="Open AI Assistant"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="border-b p-6 pb-4 bg-gradient-to-r from-primary/10 to-transparent">
          <SheetTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Calculator
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">Quick calculations for your finances</p>
        </SheetHeader>

        <div className="p-6 space-y-6">
          <MiniCalculator
            onResult={(result) => {
              setLastCalculatedAmount(result);
              handleApplyAmount(result);
            }}
            compact={true}
          />

          {lastCalculatedAmount > 0 && (
            <div className="space-y-3 p-4 bg-accent rounded-lg border border-border">
              <p className="text-sm font-semibold text-foreground">
                Amount: <span className="text-primary font-mono">₹{lastCalculatedAmount.toFixed(2)}</span>
              </p>
              <Button
                onClick={handleAddAsIncome}
                className="w-full bg-success hover:bg-success/90 text-white gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Add as Income
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-2 p-3 bg-muted/50 rounded border border-border/50">
            <p className="font-semibold text-foreground">💡 Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Calculate expenses, budgets, or savings goals</li>
              <li>Quick conversions and financial math</li>
              <li>Add results directly to your income</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

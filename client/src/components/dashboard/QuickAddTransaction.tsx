import { useState, useRef, useEffect, useMemo } from "react";
import { useStore, TransactionType } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MiniCalculator } from "@/components/MiniCalculator";
import { toast } from "sonner";

export function QuickAddTransaction() {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showApplyHint, setShowApplyHint] = useState(false);
  const user = useStore((state) => state.user);
  
  const addTransaction = useStore((state) => state.addTransaction);
  const refreshSummary = useStore((state) => state.refreshSummary);
  const categories = useStore((state) => state.categories);
  const lastCategory = useStore((state) => state.lastCategory);
  const setLastCategory = useStore((state) => state.setLastCategory);
  
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Listen for applyAmount event from calculator
  useEffect(() => {
    const handleApplyAmount = (e: CustomEvent) => {
      const appliedAmount = e.detail.amount;
      if (typeof appliedAmount === 'number' && appliedAmount > 0) {
        setAmount(appliedAmount.toFixed(2));
        amountInputRef.current?.focus();
        setShowApplyHint(true);
        setTimeout(() => setShowApplyHint(false), 3000);
      }
    };

    window.addEventListener('applyAmount', handleApplyAmount as EventListener);
    return () => window.removeEventListener('applyAmount', handleApplyAmount as EventListener);
  }, []);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );
  const currencySymbol = getCurrencySymbol(user?.currency || 'USD');

  useEffect(() => {
    // Auto-select last used category for this type, or first available
    if (filteredCategories.length === 0) return;
    
    // First priority: last category if it's still in the filtered list
    if (lastCategory) {
      const matchingLast = filteredCategories.find((c) => c.name === lastCategory);
      if (matchingLast) {
        setCategory(matchingLast.name);
        return;
      }
    }

    // Second priority: currently selected category if still valid
    if (category && filteredCategories.find((c) => c.name === category)) {
      return;
    }

    // Third priority: first available category
    setCategory(filteredCategories[0].name);
  }, [type, filteredCategories]);

  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    await addTransaction({
      amount: numAmount,
      type,
      category,
      date: new Date().toISOString(),
      description: description.trim() || category
    });

    // Refresh dashboard summary so cards update immediately
    refreshSummary().catch(console.error);

    if (category) setLastCategory(category);

    // Reset form
    setAmount('');
    setDescription('');
    amountInputRef.current?.focus();
  };

  return (
    <Card className="border-border bg-gradient-to-br from-card via-card to-secondary/30">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold tracking-tight">Quick Add</h3>
            <div className="text-xs text-muted-foreground">Log expenses or income in seconds</div>
          </div>

          {/* Income/Expense Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={cn(
                "flex-1 transition-all duration-200",
                type === 'expense' && 'bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20 scale-[1.02]'
              )}
              onClick={() => setType('expense')}
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={cn(
                "flex-1 transition-all duration-200",
                type === 'income' && 'bg-success/10 border-success text-success hover:bg-success/20 scale-[1.02]'
              )}
              onClick={() => setType('income')}
            >
              Income
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="quick-amount" className="text-xs font-medium text-muted-foreground">
              Amount ({currencySymbol})
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                ref={amountInputRef}
                id="quick-amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(
                  "pl-7 text-lg font-semibold tracking-tight transition-all duration-300",
                  showApplyHint && "ring-2 ring-primary/50 bg-primary/5"
                )}
              />
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    title="Open calculator"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Quick Calculator</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <MiniCalculator
                      onResult={(result) => {
                        setAmount(result.toString());
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {showApplyHint && (
              <p className="text-xs text-primary animate-in fade-in slide-in-from-top-1">
                ✓ Amount applied from calculator
              </p>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="quick-category" className="text-xs font-medium text-muted-foreground">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="quick-category" className="font-medium">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label htmlFor="quick-description" className="text-xs font-medium text-muted-foreground">
              Description (optional)
            </Label>
            <Input
              id="quick-description"
              type="text"
              placeholder="What's this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!amount || !category}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            Add {type === 'income' ? 'Income' : 'Expense'}
          </Button>

          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            You can edit or delete transactions anytime
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

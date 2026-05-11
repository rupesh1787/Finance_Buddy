import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { ArrowDownRight, ArrowUpRight, DollarSign, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { displayAmount } from "@/lib/currency";

export function OverviewCards() {
  const summary = useStore((state) => state.dashboardSummary);
  const user = useStore((state) => state.user);
  const [expandedCard, setExpandedCard] = useState<'income' | 'expense' | null>(null);
  const currency = user?.currency || 'USD';
  // Use current month data, not all-time totals
  const income = summary?.currentMonth.income ?? 0;
  const expense = summary?.currentMonth.expense ?? 0;
  const balance = summary?.totals.balance ?? 0;
  
  // Calculate month-over-month changes from server data
  const incomeChange = useMemo(() => {
    if (!summary) return { value: 0, percent: 0 };
    const current = summary.currentMonth.income;
    const last = summary.lastMonth.income;
    if (last === 0) return { value: current, percent: current > 0 ? 100 : 0 };
    const diff = current - last;
    const pct = (diff / last) * 100;
    return { value: diff, percent: pct };
  }, [summary]);

  const expenseChange = useMemo(() => {
    if (!summary) return { value: 0, percent: 0 };
    const current = summary.currentMonth.expense;
    const last = summary.lastMonth.expense;
    if (last === 0) return { value: current, percent: current > 0 ? 100 : 0 };
    const diff = current - last;
    const pct = (diff / last) * 100;
    return { value: diff, percent: pct };
  }, [summary]);

  const topExpenses = (summary?.expenseByCategory || []).slice(0, 3);
  const topIncomes = (summary?.incomeByCategory || []).slice(0, 3);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Balance Card */}
      <Card className="md:col-span-1 group cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Balance
          </CardTitle>
          <DollarSign className="h-4 w-4 text-foreground transition-transform duration-300 group-hover:scale-110" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight">
            {displayAmount(balance, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary?.currentMonth ? (
              <span className={balance >= 0 ? 'text-success' : 'text-destructive'}>
                Net this month: {balance >= 0 ? '+' : ''}{displayAmount(summary.currentMonth.income - summary.currentMonth.expense, currency)}
              </span>
            ) : (
              <span className="text-muted-foreground">No data yet</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Income Card - Expandable */}
      <Card className="cursor-pointer group" onClick={() => setExpandedCard(expandedCard === 'income' ? null : 'income')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Income
          </CardTitle>
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-success transition-transform duration-300 group-hover:scale-110" />
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", expandedCard === 'income' && 'rotate-180')} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight text-success">
            {displayAmount(income, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary?.lastMonth.income ? (
              <span className={incomeChange.percent >= 0 ? 'text-success' : 'text-destructive'}>
                {incomeChange.percent >= 0 ? '+' : ''}{incomeChange.percent.toFixed(1)}% from last month
              </span>
            ) : (
              <span>This month's income</span>
            )}
          </p>

          {/* Expanded view */}
          {expandedCard === 'income' && topIncomes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Top Sources</p>
              {topIncomes.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center transition-colors duration-200 hover:bg-muted/50 rounded px-1 -mx-1">
                  <span className="text-sm text-muted-foreground">{item.category}</span>
                  <span className="text-sm font-mono font-semibold text-success">{displayAmount(item.total, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Card - Expandable */}
      <Card className="cursor-pointer group" onClick={() => setExpandedCard(expandedCard === 'expense' ? null : 'expense')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Expenses
          </CardTitle>
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-destructive transition-transform duration-300 group-hover:scale-110" />
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", expandedCard === 'expense' && 'rotate-180')} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight text-destructive">
            {displayAmount(expense, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary?.lastMonth.expense ? (
              <span className={expenseChange.percent <= 0 ? 'text-success' : 'text-destructive'}>
                {expenseChange.percent >= 0 ? '+' : ''}{expenseChange.percent.toFixed(1)}% from last month
              </span>
            ) : (
              <span>This month's expenses</span>
            )}
          </p>

          {/* Expanded view */}
          {expandedCard === 'expense' && topExpenses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Top Categories</p>
              {topExpenses.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center transition-colors duration-200 hover:bg-muted/50 rounded px-1 -mx-1">
                  <span className="text-sm text-muted-foreground">{item.category}</span>
                  <span className="text-sm font-mono font-semibold text-destructive">{displayAmount(item.total, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

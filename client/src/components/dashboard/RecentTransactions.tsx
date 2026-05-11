import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { displayAmount } from "@/lib/currency";

export function RecentTransactions() {
  const transactions = useStore((state) => state.transactions);
  const user = useStore((state) => state.user);
  const currency = user?.currency || 'USD';
  const categories = useStore((state) => state.categories);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getCategoryColor = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.color : '#888888';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest financial activity</CardDescription>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 animate-pulse">
            No transactions yet. Add one to get started!
          </p>
        ) : (
        <div className="space-y-4">
          {recentTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between group p-2 -mx-2 rounded-lg transition-all duration-200 hover:bg-muted/50 cursor-pointer">
              <div className="flex items-center space-x-4">
                <Avatar className="h-9 w-9 bg-secondary border border-border transition-transform duration-200 group-hover:scale-110">
                  <AvatarFallback 
                    className="text-xs font-bold"
                    style={{ color: getCategoryColor(t.category) }}
                  >
                    {t.category.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none transition-colors duration-200 group-hover:text-primary">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{t.category} • {format(new Date(t.date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className={cn(
                "text-sm font-mono font-semibold transition-transform duration-200 group-hover:scale-105",
                t.type === 'income' ? "text-success" : "text-foreground"
              )}>
                {t.type === 'income' ? '+' : '-'}{displayAmount(t.amount, currency)}
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}

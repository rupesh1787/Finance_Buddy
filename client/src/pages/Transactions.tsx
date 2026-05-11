import { Layout } from "@/components/layout/Layout";
import { useStore, Transaction } from "@/lib/store";
import { format } from "date-fns";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Trash2, Download, X, Pencil, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { displayAmount, getCurrencySymbol } from "@/lib/currency";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Transactions() {
  const transactions = useStore((state) => state.transactions);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const updateTransaction = useStore((state) => state.updateTransaction);
  const refreshSummary = useStore((state) => state.refreshSummary);
  const categories = useStore((state) => state.categories);
  const user = useStore((state) => state.user);
  const currency = user?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Filter transactions
  const filteredData = [...transactions]
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    .filter(t => selectedCategories.length === 0 || selectedCategories.includes(t.category))
    .filter(t => {
      if (!startDate && !endDate) return true;
      const tDate = new Date(t.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && tDate < start) return false;
      if (end && tDate > end) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const handleCSVExport = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = filteredData.map(t => [
      format(new Date(t.date), 'MMM dd, yyyy'),
      t.description,
      t.category,
      t.type,
      `${t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}`
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));
  const hasActiveFilters = search || filterType !== 'all' || selectedCategories.length > 0 || startDate || endDate;
  const maxVisibleCategories = 6;
  const visibleCategories = uniqueCategories.slice(0, maxVisibleCategories);
  const overflowCategories = uniqueCategories.slice(maxVisibleCategories);

  const totalSpent = filteredData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalEarned = filteredData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    setEditCategory(transaction.category);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    await updateTransaction(editing.id, {
      amount: parsedAmount,
      description: editDescription.trim() || editing.description,
      category: editCategory || editing.category,
    });
    refreshSummary().catch(console.error);
    setEditing(null);
  };

  return (
    <Layout title="Transactions">
      <div className="space-y-4">
        {/* Search is primary */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <Input 
              placeholder="Search transactions by description or category" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 text-base md:flex-1"
            />
            <div className="flex items-center gap-2 md:w-auto">
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleCSVExport}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters are secondary */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Filters</span>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
                className="w-40 text-sm"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
                className="w-40 text-sm"
              />
              {uniqueCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {visibleCategories.map(cat => (
                    <Badge
                      key={cat}
                      variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all"
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                  {overflowCategories.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <MoreHorizontal className="h-4 w-4" />
                          More
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Categories</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {overflowCategories.map((cat) => (
                          <DropdownMenuCheckboxItem
                            key={cat}
                            checked={selectedCategories.includes(cat)}
                            onCheckedChange={() => toggleCategory(cat)}
                          >
                            {cat}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Context summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>{currencySymbol}{displayAmount(totalSpent, currency, false)} spent · {currencySymbol}{displayAmount(totalEarned, currency, false)} earned</span>
            <span className="hidden sm:inline">•</span>
            <span>Showing {filteredData.length} transactions</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Date</TableHead>
                  <TableHead className="min-w-[150px]">Description</TableHead>
                  <TableHead className="min-w-[100px]">Category</TableHead>
                  <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {hasActiveFilters ? 'No transactions match your filters.' : 'No transactions found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="font-medium text-muted-foreground text-sm">
                      {format(new Date(t.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-semibold">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {t.category}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-medium",
                      t.type === 'income' ? "text-success" : "text-foreground"
                    )}>
                      {t.type === 'income' ? '+' : '-'}{displayAmount(t.amount, currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          aria-label="Edit transaction"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete transaction"
                          onClick={async () => {
                            await deleteTransaction(t.id);
                            refreshSummary().catch(console.error);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
            <DialogDescription>Adjust details and save to keep records clean.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Input
                type="number"
                min="0"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>
            <div>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description"
              />
            </div>
            <div>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

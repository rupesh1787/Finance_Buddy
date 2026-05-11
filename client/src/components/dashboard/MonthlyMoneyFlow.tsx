import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { displayAmount } from "@/lib/currency";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";

function FlowList({
  direction,
  currency,
}: {
  direction: "pay" | "receive";
  currency: string;
}) {
  const moneyFlow = useStore((state) => state.moneyFlow);
  const addMoneyFlow = useStore((state) => state.addMoneyFlow);
  const updateMoneyFlow = useStore((state) => state.updateMoneyFlow);
  const deleteMoneyFlow = useStore((state) => state.deleteMoneyFlow);

  const [draft, setDraft] = useState({ counterparty: "", amount: "", note: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ counterparty: "", amount: "", note: "" });

  const filtered = useMemo(
    () => moneyFlow.filter((i) => i.direction === direction),
    [moneyFlow, direction]
  );

  const totals = useMemo(() => {
    const total = filtered.reduce((sum, i) => sum + i.amount, 0);
    return { total, count: filtered.length };
  }, [filtered]);

  const addItem = async () => {
    const parsed = parseFloat(draft.amount);
    if (!draft.amount || isNaN(parsed) || parsed <= 0) return;
    await addMoneyFlow({
      direction,
      amount: parsed,
      counterparty: draft.counterparty || null,
      note: draft.note || null,
    });
    setDraft({ counterparty: "", amount: "", note: "" });
  };

  const startEdit = (item: (typeof moneyFlow)[number]) => {
    setEditingId(item.id);
    setEditDraft({
      counterparty: item.counterparty || "",
      amount: item.amount.toString(),
      note: item.note || "",
    });
  };

  const saveEdit = async (id: string) => {
    const parsed = parseFloat(editDraft.amount);
    if (!editDraft.amount || isNaN(parsed)) {
      setEditingId(null);
      return;
    }
    await updateMoneyFlow(id, {
      amount: parsed,
      counterparty: editDraft.counterparty || null,
      note: editDraft.note || null,
    });
    setEditingId(null);
  };

  const isPay = direction === "pay";
  const amountColor = isPay ? "text-destructive" : "text-success";

  return (
    <div className="space-y-4">
      {/* Summary + Add Form */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">
            {isPay ? "To Pay" : "To Receive"}
          </p>
          <p className={cn("text-2xl font-bold", amountColor)}>
            {displayAmount(totals.total, currency)}
          </p>
          <p className="text-xs text-muted-foreground">{totals.count} item(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder={isPay ? "Who to pay" : "From who"}
            value={draft.counterparty}
            onChange={(e) => setDraft((p) => ({ ...p, counterparty: e.target.value }))}
            className="w-40"
          />
          <Input
            type="number"
            placeholder="Amount"
            value={draft.amount}
            onChange={(e) => setDraft((p) => ({ ...p, amount: e.target.value }))}
            className="w-28"
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <Input
            placeholder="Note"
            value={draft.note}
            onChange={(e) => setDraft((p) => ({ ...p, note: e.target.value }))}
            className="w-44"
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <Button
            onClick={addItem}
            className="gap-2"
            variant={isPay ? "default" : "outline"}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Nothing here yet. Add an item to track it.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const editing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "group flex items-center justify-between gap-3 rounded-lg border bg-background/80 px-3 py-3 transition-all duration-200 hover:border-border",
                  isPay ? "border-amber-300/40" : "border-emerald-300/40"
                )}
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  {editing ? (
                    <div className="flex flex-col gap-2">
                      <Input
                        value={editDraft.counterparty}
                        onChange={(e) =>
                          setEditDraft((p) => ({ ...p, counterparty: e.target.value }))
                        }
                        placeholder="Name or counterparty"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={editDraft.note}
                        onChange={(e) =>
                          setEditDraft((p) => ({ ...p, note: e.target.value }))
                        }
                        placeholder="Note"
                        className="h-8 text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">
                        {item.counterparty || "(No name)"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.note || "No note"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editDraft.amount}
                        onChange={(e) =>
                          setEditDraft((p) => ({ ...p, amount: e.target.value }))
                        }
                        className="h-8 w-28 text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label="Save"
                        onClick={() => saveEdit(item.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label="Cancel"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="tabular-nums text-sm font-semibold text-right min-w-[80px]">
                        {displayAmount(item.amount, currency)}
                      </p>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label="Edit"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive/70 hover:text-destructive"
                          aria-label="Delete"
                          onClick={() => deleteMoneyFlow(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MonthlyMoneyFlow() {
  const currency = useStore((state) => state.user?.currency || "USD");
  const [activeTab, setActiveTab] = useState<"pay" | "receive">("pay");

  return (
    <Card className="border-border/60 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50/80 to-slate-50/50 dark:from-slate-950/40 dark:to-slate-900/30 border-b border-border/60 backdrop-blur-sm">
        <CardHeader className="pb-4 pt-5">
          <CardTitle className="text-lg">Monthly Money Flow</CardTitle>
          <CardDescription className="text-xs">
            Track payments and receivables for this month
          </CardDescription>
        </CardHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "pay" | "receive")}
          className="px-6 pb-0"
        >
          <TabsList className="w-full grid grid-cols-2 bg-white/70 dark:bg-black/30 p-1.5 mb-4 border border-border/40 rounded-xl shadow-md h-14 items-center">
            <TabsTrigger
              value="pay"
              className={cn(
                "relative h-10 text-sm font-semibold transition-all duration-250 overflow-hidden rounded-lg",
                activeTab === "pay"
                  ? "bg-white dark:bg-slate-900/60 text-amber-700 dark:text-amber-400 shadow-lg border border-amber-300/60 shadow-amber-200/30 dark:shadow-amber-900/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5"
              )}
            >
              {activeTab === "pay" && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-300/15 via-transparent to-amber-200/10 pointer-events-none" />
              )}
              <span className="relative flex items-center justify-center gap-2">
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full transition-all duration-250",
                    activeTab === "pay"
                      ? "bg-amber-500 shadow-[0_0_12px_rgba(217,119,6,0.45)]"
                      : "bg-muted-foreground/30"
                  )}
                />
                To Pay
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="receive"
              className={cn(
                "relative h-10 text-sm font-semibold transition-all duration-250 overflow-hidden rounded-lg",
                activeTab === "receive"
                  ? "bg-white dark:bg-slate-900/60 text-emerald-700 dark:text-emerald-400 shadow-lg border border-emerald-300/60 shadow-emerald-200/30 dark:shadow-emerald-900/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5"
              )}
            >
              {activeTab === "receive" && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/15 via-transparent to-emerald-200/10 pointer-events-none" />
              )}
              <span className="relative flex items-center justify-center gap-2">
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full transition-all duration-250",
                    activeTab === "receive"
                      ? "bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.45)]"
                      : "bg-muted-foreground/30"
                  )}
                />
                To Receive
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <CardContent className="pt-5">
        {activeTab === "pay" ? (
          <FlowList direction="pay" currency={currency} />
        ) : (
          <FlowList direction="receive" currency={currency} />
        )}
      </CardContent>
    </Card>
  );
}

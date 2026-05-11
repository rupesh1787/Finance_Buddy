import { Layout } from "@/components/layout/Layout";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { MonthAtAGlance } from "@/components/dashboard/MonthAtAGlance";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickAddTransaction } from "@/components/dashboard/QuickAddTransaction";
import { SpendingProgress } from "@/components/dashboard/SpendingProgress";
import { WhereYourMoneyWent } from "@/components/dashboard/WhereYourMoneyWent";

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      {/* PRIMARY ACTION + RECENT ACTIVITY SIDE BY SIDE */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickAddTransaction />
        <RecentTransactions />
      </div>

      {/* BALANCE OVERVIEW */}
      <OverviewCards />

      {/* SPENDING LIMIT PROGRESS */}
      <SpendingProgress />
      {/* KEY INSIGHTS & ALERTS */}
      <div className="grid gap-4 md:grid-cols-2">
        <MonthAtAGlance />
        <NeedsAttention />
      </div>

      {/* WHERE YOUR MONEY WENT - PIE CHART */}
      <WhereYourMoneyWent />
    </Layout>
  );
}

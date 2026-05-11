import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useStore, Currency } from "@/lib/store";
import { applyTheme, getStoredTheme, ThemeMode } from "@/lib/theme";

const CURRENCIES: { label: string; value: Currency }[] = [
  { label: "USD ($)", value: "USD" },
  { label: "INR (₹)", value: "INR" },
  { label: "EUR (€)", value: "EUR" },
  { label: "GBP (£)", value: "GBP" },
];

export default function Settings() {
  const user = useStore((state) => state.user);
  const updateUser = useStore((state) => state.updateUser);
  const setCurrency = useStore((state) => state.setCurrency);
  const setMonthlySpendingLimit = useStore((state) => state.setMonthlySpendingLimit);
  const refreshSummary = useStore((state) => state.refreshSummary);
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [spendingLimit, setSpendingLimit] = useState<number>(user?.monthlySpendingLimit || 3000);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme());

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setSpendingLimit(user?.monthlySpendingLimit || 3000);
  }, [user]);

  const handleProfileSave = () => {
    updateUser({ name: name.trim() || "Financial Manager", email: email.trim() });
    toast({ title: "Profile updated", description: "Your profile details were saved." });
  };

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
    toast({ title: "Currency updated", description: `Now showing balances in ${currency}.` });
  };

  const handleLimitSave = async () => {
    const value = Number(spendingLimit);
    if (Number.isNaN(value) || value <= 0) {
      toast({ title: "Invalid limit", description: "Enter a positive number.", variant: "destructive" });
      return;
    }
    await setMonthlySpendingLimit(value);
    await refreshSummary();
    toast({ title: "Limit saved", description: `Monthly spending limit set to ${value}.` });
  };

  const handleThemeChange = (mode: ThemeMode) => {
    applyTheme(mode);
    setThemeMode(mode);
    toast({ title: "Theme changed", description: `Switched to ${mode} mode.` });
  };

  return (
    <Layout title="Settings">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your basic information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button onClick={handleProfileSave}>Save profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Currency and appearance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={user?.currency} onValueChange={(value) => handleCurrencyChange(value as Currency)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Button variant={themeMode === "light" ? "default" : "outline"} onClick={() => handleThemeChange("light")}>Light</Button>
                <Button variant={themeMode === "dark" ? "default" : "outline"} onClick={() => handleThemeChange("dark")}>Dark</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spending controls</CardTitle>
          <CardDescription>Set a monthly spending limit to watch your budget.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
            <div className="space-y-2">
              <Label htmlFor="limit">Monthly limit</Label>
              <Input
                id="limit"
                type="number"
                min={0}
                value={spendingLimit}
                onChange={(e) => setSpendingLimit(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleLimitSave}>Save limit</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This limit is used to trigger warnings across the dashboard when spending approaches the threshold.
          </p>
        </CardContent>
      </Card>
    </Layout>
  );
}

import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo, useEffect } from "react";
import { Calculator, Lightbulb, TrendingUp, TrendingDown, Sparkles, RefreshCcw, Clock, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { displayAmount } from "@/lib/currency";
import { cn } from "@/lib/utils";

type UseCase = 'loan' | 'savings';
type RiskLevel = 'low' | 'moderate' | 'high';

interface InsightShape {
  verdict: string;
  bullets: string[];
  condition?: string;
  risk: RiskLevel;
  updatedAt: Date;
  source: 'rule' | 'ai+rule';
}

const DEBOUNCE_MS = 180;

const parseNumber = (value: string) => {
  const clean = value.replace(/,/g, '').trim();
  const num = parseFloat(clean);
  return Number.isFinite(num) ? num : 0;
};

const percentOf = (part: number, whole: number) => {
  if (!whole) return 0;
  return (part / whole) * 100;
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatWithCommas = (value: number) => (value ? value.toLocaleString("en-US") : "");

const loanEmi = (principal: number, annualRate: number, years: number) => {
  const monthlyRate = annualRate / 12 / 100;
  const months = Math.max(1, Math.round(years * 12));
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
};

const deriveRiskLevel = (debtToIncome: number, buffer: number, income: number) => {
  if (debtToIncome > 50 || buffer < 0) return 'high';
  if (debtToIncome > 40 || buffer < income * 0.1) return 'moderate';
  return 'low';
};

export default function FinancialTools() {
  const user = useStore((state) => state.user);
  const currency = user?.currency || 'USD';

  // Form State
  const [useCase, setUseCase] = useState<UseCase>('loan');
  const [principal, setPrincipal] = useState('50000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('3');
  const [compoundingType, setCompoundingType] = useState<'simple' | 'compound'>('compound');
  
  // User Financial Context (Optional)
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [existingEMIs, setExistingEMIs] = useState('');
  const [debouncedInputs, setDebouncedInputs] = useState({ principal, rate, years, monthlyIncome, monthlyExpenses, existingEMIs });
  const [insight, setInsight] = useState<InsightShape | null>(null);
  const [insightCache, setInsightCache] = useState<Record<string, InsightShape>>({});
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInputs({ principal, rate, years, monthlyIncome, monthlyExpenses, existingEMIs });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [principal, rate, years, monthlyIncome, monthlyExpenses, existingEMIs]);

  const numbers = useMemo(() => ({
    principal: parseNumber(debouncedInputs.principal),
    rate: parseNumber(debouncedInputs.rate),
    years: parseNumber(debouncedInputs.years),
    income: parseNumber(debouncedInputs.monthlyIncome),
    expenses: parseNumber(debouncedInputs.monthlyExpenses),
    emis: parseNumber(debouncedInputs.existingEMIs),
  }), [debouncedInputs]);

  const validation = useMemo(() => {
    const messages: Record<string, string> = {};
    if (numbers.principal <= 0) messages.principal = "Enter a positive amount";
    if (numbers.rate <= 0) messages.rate = "Enter a rate above 0";
    if (numbers.years <= 0) messages.years = "Duration must be greater than 0";
    if (useCase === 'loan' && numbers.years > 40) messages.years = "Duration seems too long";
    if (numbers.income < 0) messages.income = "Income cannot be negative";
    return messages;
  }, [numbers, useCase]);

  const calculateResults = useMemo(() => {
    if (!numbers.principal || !numbers.rate || !numbers.years) {
      return { interest: 0, total: 0, monthlyImpact: 0, effectiveMonthlyRate: 0, months: 0 };
    }

    const months = Math.max(1, Math.round(numbers.years * 12));

    if (useCase === 'loan') {
      const emiValue = loanEmi(numbers.principal, numbers.rate, numbers.years);
      const total = emiValue * months;
      const interest = total - numbers.principal;
      return {
        interest: Math.round(interest),
        total: Math.round(total),
        monthlyImpact: Math.round(emiValue),
        effectiveMonthlyRate: numbers.rate / 12,
        months,
      };
    }

    // Savings / investment scenario
    let total: number;
    if (compoundingType === 'simple') {
      total = numbers.principal * (1 + (numbers.rate / 100) * numbers.years);
    } else {
      total = numbers.principal * Math.pow(1 + numbers.rate / 100, numbers.years);
    }
    const interest = total - numbers.principal;
    return {
      interest: Math.round(interest),
      total: Math.round(total),
      monthlyImpact: Math.round(interest / months),
      effectiveMonthlyRate: numbers.rate / 12,
      months,
    };
  }, [numbers, compoundingType, useCase]);

  const financialMetrics = useMemo(() => {
    if (!numbers.income) return null;

    const newEMI = useCase === 'loan' ? calculateResults.monthlyImpact : 0;
    const totalEMI = numbers.emis + newEMI;
    const debtToIncomeRatio = percentOf(totalEMI, numbers.income);
    const remainingBuffer = numbers.income - numbers.expenses - totalEMI;
    const bufferPercentage = percentOf(remainingBuffer, numbers.income);
    const riskLevel = deriveRiskLevel(debtToIncomeRatio, remainingBuffer, numbers.income);

    return {
      totalCommitments: numbers.expenses + totalEMI,
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 10) / 10,
      remainingBuffer,
      bufferPercentage: Math.round(bufferPercentage * 10) / 10,
      riskLevel,
      emiShareOfIncome: percentOf(calculateResults.monthlyImpact, numbers.income),
    };
  }, [calculateResults.monthlyImpact, numbers, useCase]);

  const insightKey = useMemo(
    () => JSON.stringify({
      useCase,
      compoundingType,
      principal: numbers.principal,
      rate: numbers.rate,
      years: numbers.years,
      income: numbers.income,
      expenses: numbers.expenses,
      emis: numbers.emis,
    }),
    [useCase, compoundingType, numbers]
  );

  const buildRuleInsight = (): InsightShape | null => {
    if (!financialMetrics || calculateResults.total <= 0) return null;

    const bullets: string[] = [];
    bullets.push(
      `${useCase === 'loan' ? 'EMI' : 'Growth'} equals ${formatPercent(financialMetrics.emiShareOfIncome || 0)} of monthly income`
    );
    bullets.push(`Debt-to-income at ${formatPercent(financialMetrics.debtToIncomeRatio)} with buffer ${displayAmount(financialMetrics.remainingBuffer, currency)}`);

    if (useCase === 'loan') {
      bullets.push(`Total payable ${displayAmount(calculateResults.total, currency)} over ${Math.round(numbers.years * 12)} months`);
    } else {
      bullets.push(`Projected value ${displayAmount(calculateResults.total, currency)} in ${numbers.years} years`);
    }

    const risk = financialMetrics.riskLevel as RiskLevel;
    const verdict = risk === 'low' ? 'Affordable' : risk === 'moderate' ? 'Borderline' : 'Risky';
    const tightBuffer = financialMetrics.remainingBuffer <= numbers.income * 0.15;
    const condition = tightBuffer
      ? 'Condition: Keep an emergency buffer before adding new commitments.'
      : undefined;

    return {
      verdict,
      bullets: bullets.slice(0, 4),
      condition,
      risk,
      updatedAt: new Date(),
      source: 'rule',
    };
  };

  const condenseInsight = (text: string) => text.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').replace(/\*|_/g, '').trim();

  const generateInsight = async () => {
    if (!numbers.income || calculateResults.total <= 0) {
      setInsight(null);
      return;
    }

    if (insightCache[insightKey]) {
      setInsight(insightCache[insightKey]);
      return;
    }

    setInsightLoading(true);
    let draft = buildRuleInsight();

    try {
      const response = await fetch('/api/financial-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          useCase,
          principal: numbers.principal,
          rate: numbers.rate,
          years: numbers.years,
          compoundingType,
          monthlyIncome: numbers.income,
          monthlyExpenses: numbers.expenses,
          existingEMIs: numbers.emis,
          calculatedEMI: calculateResults.monthlyImpact,
          totalInterest: calculateResults.interest,
          currency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Parse AI response in the required format
        if (data.verdict && data.bullets) {
          draft = {
            verdict: data.verdict,
            bullets: data.bullets.slice(0, 4),
            condition: data.condition,
            risk: data.verdict === 'COMFORTABLE' || data.verdict === 'AFFORDABLE' ? 'low' 
                : data.verdict === 'BORDERLINE' ? 'moderate' : 'high',
            updatedAt: new Date(),
            source: data.source === 'ai' ? 'ai+rule' : 'rule',
          };
        }
      }
    } catch (_error) {
      // fallback to rule-based only
    } finally {
      if (draft) {
        setInsightCache((prev) => ({ ...prev, [insightKey]: draft! }));
        setInsight(draft);
      }
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (insightCache[insightKey]) {
      setInsight(insightCache[insightKey]);
    } else {
      setInsight(null);
    }
  }, [insightCache, insightKey]);

  const amortizationPreview = useMemo(() => {
    if (useCase !== 'loan' || !calculateResults.monthlyImpact) return [];
    return [
      { label: 'Principal', value: displayAmount(numbers.principal, currency) },
      { label: 'Interest over term', value: displayAmount(calculateResults.interest, currency) },
      { label: 'Total payable', value: displayAmount(calculateResults.total, currency) },
      { label: 'Term', value: `${Math.round(numbers.years)} years / ${calculateResults.months} months` },
    ];
  }, [useCase, calculateResults, numbers.principal, numbers.years, currency]);

  return (
    <Layout title="Financial Tools">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Loan & Investment Decision Helper</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Understand the real impact before you commit
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1 — PURPOSE */}
        <Card className="mb-6 border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <CardTitle className="text-lg">What are you planning?</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Choose your financial goal
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setUseCase('loan')}
                className={cn(
                  "p-5 rounded-xl border-2 transition-all duration-200 text-left",
                  "hover:border-primary/50 hover:shadow-md",
                  useCase === 'loan'
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <TrendingDown className={cn(
                    "h-5 w-5 mt-0.5",
                    useCase === 'loan' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div>
                    <h3 className="font-semibold text-base mb-1">Loan / Borrowing</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Calculate loan costs and monthly EMI
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setUseCase('savings')}
                className={cn(
                  "p-5 rounded-xl border-2 transition-all duration-200 text-left",
                  "hover:border-primary/50 hover:shadow-md",
                  useCase === 'savings'
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className={cn(
                    "h-5 w-5 mt-0.5",
                    useCase === 'savings' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div>
                    <h3 className="font-semibold text-base mb-1">Savings / Investment</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      See how your money grows over time
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2 — DETAILS */}
        <Card className="mb-6 border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <CardTitle className="text-lg">Enter your details</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {useCase === 'loan' ? 'Loan amount and terms' : 'Investment amount and returns'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="principal" className="text-sm font-medium">
                  {useCase === 'loan' ? 'Loan Amount' : 'Investment Amount'}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    {currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                  </span>
                  <Input
                    id="principal"
                    type="number"
                    value={principal}
                    inputMode="decimal"
                    onChange={(e) => setPrincipal(e.target.value.replace(/,/g, ''))}
                    onBlur={(e) => setPrincipal(formatWithCommas(parseNumber(e.target.value)))}
                    className="pl-8 font-medium"
                    placeholder="50000"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Principal amount</p>
                {validation.principal && <p className="text-xs text-destructive">{validation.principal}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate" className="text-sm font-medium">
                  Interest Rate
                </Label>
                <div className="relative">
                  <Input
                    id="rate"
                    type="number"
                    step="0.1"
                    value={rate}
                    inputMode="decimal"
                    onChange={(e) => setRate(e.target.value.replace(/,/g, ''))}
                    className="pr-8 font-medium"
                    placeholder="12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Annual percentage rate</p>
                {validation.rate && <p className="text-xs text-destructive">{validation.rate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="years" className="text-sm font-medium">
                  Duration
                </Label>
                <div className="relative">
                  <Input
                    id="years"
                    type="number"
                    step="0.5"
                    value={years}
                    inputMode="decimal"
                    onChange={(e) => setYears(e.target.value.replace(/,/g, ''))}
                    className="pr-14 font-medium"
                    placeholder="3"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">
                    years
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Time period</p>
                {validation.years && <p className="text-xs text-destructive">{validation.years}</p>}
              </div>
            </div>

            {/* Interest Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Interest Calculation</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCompoundingType('simple')}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-sm font-medium",
                    compoundingType === 'simple'
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  Simple Interest
                </button>
                <button
                  onClick={() => setCompoundingType('compound')}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-sm font-medium",
                    compoundingType === 'compound'
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  Compound Interest
                </button>
              </div>
              <p className="text-xs text-muted-foreground italic">
                {compoundingType === 'simple' 
                  ? 'Interest calculated on principal only' 
                  : 'Interest compounds annually for higher returns'}
              </p>
            </div>

            {/* Optional: Financial Context */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">
                  Your Financial Context <span className="text-xs text-muted-foreground">(Optional)</span>
                </Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="income" className="text-xs text-muted-foreground">
                    Monthly Income <span className="text-primary">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                    </span>
                    <Input
                      id="income"
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      onBlur={(e) => setMonthlyIncome(formatWithCommas(parseNumber(e.target.value)))}
                      className="pl-8 text-sm"
                      placeholder="60000"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used only to give better affordability insights</p>
                  {validation.income && <p className="text-xs text-destructive">{validation.income}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenses" className="text-xs text-muted-foreground">
                    Monthly Expenses
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                    </span>
                    <Input
                      id="expenses"
                      type="number"
                      value={monthlyExpenses}
                      onChange={(e) => setMonthlyExpenses(e.target.value)}
                      onBlur={(e) => setMonthlyExpenses(formatWithCommas(parseNumber(e.target.value)))}
                      className="pl-8 text-sm"
                      placeholder="30000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emis" className="text-xs text-muted-foreground">
                    Existing EMIs
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                    </span>
                    <Input
                      id="emis"
                      type="number"
                      value={existingEMIs}
                      onChange={(e) => setExistingEMIs(e.target.value)}
                      onBlur={(e) => setExistingEMIs(formatWithCommas(parseNumber(e.target.value)))}
                      className="pl-8 text-sm"
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STEP 3 — RESULTS */}
        <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-background">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <CardTitle className="text-lg">Financial Impact</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  What this means for your money
                </CardDescription>
              </div>
              {financialMetrics && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-auto text-xs font-semibold",
                    financialMetrics.riskLevel === 'low' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    financialMetrics.riskLevel === 'moderate' && "bg-amber-400/15 text-amber-700 dark:text-amber-300",
                    financialMetrics.riskLevel === 'high' && "bg-destructive/10 text-destructive"
                  )}
                >
                  {financialMetrics.riskLevel.toUpperCase()} RISK
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className={cn(
              "grid gap-4",
              useCase === 'loan' ? "grid-cols-1 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"
            )}>
              {/* EMI - Prominent for loans */}
              {useCase === 'loan' && (
                <div className="sm:col-span-2 p-5 rounded-xl bg-primary/10 border-2 border-primary/30 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Monthly EMI</p>
                      <p className="text-4xl font-bold text-primary">
                        {displayAmount(calculateResults.monthlyImpact, currency)}
                      </p>
                      <p className="text-xs text-primary/80 mt-1">per month</p>
                    </div>
                    <Badge variant="outline" className="bg-white/60 dark:bg-slate-900/40 text-xs font-semibold">
                      {calculateResults.months} months
                    </Badge>
                  </div>
                </div>
              )}

              {/* For savings, show monthly impact on smaller card */}
              {useCase === 'savings' && (
                <div className="p-4 rounded-lg bg-background/60 border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Monthly Impact
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {displayAmount(calculateResults.monthlyImpact, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">per month</p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-background/80 border border-border/60 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Total Interest
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {displayAmount(calculateResults.interest, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {useCase === 'loan' ? 'cost' : 'earned'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background/80 border border-border/60 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {useCase === 'loan' ? 'Total Payable' : 'Maturity Value'}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {displayAmount(calculateResults.total, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">final amount</p>
              </div>
            </div>
            {/* EMI breakdown */}
            {useCase === 'loan' && amortizationPreview.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ChevronDown className="h-4 w-4" /> EMI breakdown
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {amortizationPreview.map((row) => (
                    <div key={row.label} className="rounded-lg border border-border/60 p-3 bg-background/70">
                      <p className="text-xs text-muted-foreground mb-1">{row.label}</p>
                      <p className="font-semibold text-sm">{row.value}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Financial Health Indicators */}
            {financialMetrics && (
              <div className="p-4 rounded-lg border-2 bg-background/60 shadow-sm" 
                   style={{ 
                     borderColor: financialMetrics.riskLevel === 'high' 
                       ? 'hsl(var(--destructive) / 0.3)' 
                       : financialMetrics.riskLevel === 'moderate' 
                       ? 'hsl(48 96% 53% / 0.3)' 
                       : 'hsl(142 76% 36% / 0.3)' 
                   }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Quick Health Check</h4>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-bold",
                      financialMetrics.riskLevel === 'high' && "bg-destructive/10 text-destructive",
                      financialMetrics.riskLevel === 'moderate' && "bg-amber-400/15 text-amber-700 dark:text-amber-300",
                      financialMetrics.riskLevel === 'low' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    {financialMetrics.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                
                <p className="text-sm text-foreground/80 mb-3">
                  {financialMetrics.riskLevel === 'low' && 
                    `EMI is ${formatPercent(financialMetrics.emiShareOfIncome)} of income with breathing room.`}
                  {financialMetrics.riskLevel === 'moderate' && 
                    `Commitment is manageable but keep a close eye on surprises.`}
                  {financialMetrics.riskLevel === 'high' && 
                    `High commitment versus income; buffer is at risk if cashflows change.`}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Debt-to-Income</p>
                    <p className="font-bold">{formatPercent(financialMetrics.debtToIncomeRatio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Monthly Buffer</p>
                    <p className="font-bold">{displayAmount(financialMetrics.remainingBuffer, currency)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* STEP 4 — FINANCIAL INSIGHT */}
        <Card className="border-2 border-primary/30 shadow-lg">
          <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Financial Insight</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Concise verdict with what matters most
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {insight && (
                  <Badge variant="outline" className="text-[11px]">
                    {insight.source === 'ai+rule' ? 'AI + Rule' : 'Rule-based'}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="default"
                  onClick={generateInsight}
                  disabled={insightLoading || !numbers.income || calculateResults.total <= 0 || Object.keys(validation).length > 0}
                  className="gap-2"
                >
                  <RefreshCcw className={cn("h-4 w-4", insightLoading && "animate-spin")}
                  />
                  {insight ? 'Refresh Insight' : 'Get Insight'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {!numbers.income && calculateResults.total > 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Add monthly income to unlock a personalized insight.
              </div>
            )}

            {numbers.income && !insight && !insightLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Provide income and tap “Get Insight” to see your summary.
              </div>
            )}

            {insight && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-lg font-bold px-3 py-1 rounded-lg",
                      insight.risk === 'low' && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      insight.risk === 'moderate' && "bg-amber-400/15 text-amber-700 dark:text-amber-300",
                      insight.risk === 'high' && "bg-destructive/10 text-destructive"
                    )}
                  >
                    {insight.verdict}
                  </span>
                  <Badge variant="secondary" className="text-[11px]">{insight.risk.toUpperCase()} RISK</Badge>
                </div>

                <ul className="list-disc pl-5 text-sm space-y-1">
                  {insight.bullets.slice(0, 4).map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>

                {insight.condition && (
                  <p className="text-xs text-muted-foreground">{insight.condition}</p>
                )}

                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Last updated {insight.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { useStore } from "@/lib/store";
import { ArrowRightLeft } from "lucide-react";

export default function CurrencyConverterPage() {
  const user = useStore((state) => state.user);
  const userCurrency = (user?.currency || 'USD') as any;

  return (
    <Layout title="Currency Converter">
      <div className="max-w-2xl mx-auto">
        <Card className="border-border bg-gradient-to-br from-card via-card to-secondary/30">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <ArrowRightLeft className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Currency Converter</CardTitle>
            </div>
            <CardDescription>
              Real-time exchange rates to convert between currencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <CurrencyConverter
                defaultFrom={userCurrency}
                defaultTo={userCurrency === 'USD' ? 'INR' : 'USD'}
              />

              {/* Info Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-semibold text-sm mb-2">📊 Real-time Rates</h4>
                  <p className="text-xs text-muted-foreground">
                    Exchange rates are updated every 24 hours from reliable sources to ensure accuracy.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-semibold text-sm mb-2">💡 Quick Tips</h4>
                  <p className="text-xs text-muted-foreground">
                    Use this tool when sending or receiving money internationally to get fair rates.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-semibold text-sm mb-2">🔄 Supported Currencies</h4>
                  <p className="text-xs text-muted-foreground">
                    USD • EUR • GBP • INR and more currencies available in the dropdown.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-semibold text-sm mb-2">⚡ Instant Conversion</h4>
                  <p className="text-xs text-muted-foreground">
                    See the converted amount instantly as you type. No need to submit anything!
                  </p>
                </div>
              </div>

              {/* Usage Tips */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-sm mb-3">How to Use:</h4>
                <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Select the currency you want to convert FROM</li>
                  <li>Enter the amount you want to convert</li>
                  <li>Choose the target currency to convert TO</li>
                  <li>See the converted amount instantly</li>
                  <li>Use preset amounts for quick calculations</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

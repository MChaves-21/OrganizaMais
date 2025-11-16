import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Target, TrendingUp } from "lucide-react";

const Simulation = () => {
  // Goal-driven projection
  const [goalTarget, setGoalTarget] = useState("");
  const [goalYears, setGoalYears] = useState("");
  const [goalRate, setGoalRate] = useState("10");
  const [goalResult, setGoalResult] = useState<number | null>(null);

  // Contribution-driven projection
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [contributionYears, setContributionYears] = useState("");
  const [contributionRate, setContributionRate] = useState("10");
  const [contributionResult, setContributionResult] = useState<number | null>(null);

  const calculateMonthlyContribution = () => {
    const target = parseFloat(goalTarget);
    const years = parseFloat(goalYears);
    const annualRate = parseFloat(goalRate) / 100;
    const monthlyRate = annualRate / 12;
    const months = years * 12;

    // FV = PMT * [((1 + i)^n - 1) / i]
    // PMT = FV / [((1 + i)^n - 1) / i]
    const futureValueFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    const pmt = target / futureValueFactor;

    setGoalResult(pmt);
  };

  const calculateFutureValue = () => {
    const pmt = parseFloat(monthlyContribution);
    const years = parseFloat(contributionYears);
    const annualRate = parseFloat(contributionRate) / 100;
    const monthlyRate = annualRate / 12;
    const months = years * 12;

    // FV = PMT * [((1 + i)^n - 1) / i]
    const futureValue = pmt * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    setContributionResult(futureValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Calculator className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Simulador de Investimentos</h1>
        </div>

        <Tabs defaultValue="goal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="goal" className="gap-2">
              <Target className="h-4 w-4" />
              Por Meta
            </TabsTrigger>
            <TabsTrigger value="contribution" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Por Aporte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goal" className="mt-6">
            <Card className="border-border/50 shadow-elegant">
              <CardHeader>
                <CardTitle>Projeção Dirigida por Metas</CardTitle>
                <CardDescription>
                  Defina sua meta e descubra quanto precisa investir mensalmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="goal-target">Valor Desejado (R$)</Label>
                    <Input
                      id="goal-target"
                      type="number"
                      placeholder="100000"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-years">Prazo (anos)</Label>
                    <Input
                      id="goal-years"
                      type="number"
                      placeholder="5"
                      value={goalYears}
                      onChange={(e) => setGoalYears(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-rate">Taxa Anual (%)</Label>
                    <Input
                      id="goal-rate"
                      type="number"
                      step="0.1"
                      placeholder="10"
                      value={goalRate}
                      onChange={(e) => setGoalRate(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={calculateMonthlyContribution} className="w-full">
                  Calcular Aporte Mensal
                </Button>

                {goalResult !== null && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Você precisa investir mensalmente:
                        </p>
                        <p className="text-4xl font-bold text-primary">
                          {goalResult.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-4">
                          Para alcançar {parseFloat(goalTarget).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}{" "}
                          em {goalYears} anos com taxa de {goalRate}% ao ano
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contribution" className="mt-6">
            <Card className="border-border/50 shadow-elegant">
              <CardHeader>
                <CardTitle>Projeção Dirigida por Aporte</CardTitle>
                <CardDescription>
                  Defina seu aporte mensal e descubra quanto terá no futuro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="monthly-contribution">Aporte Mensal (R$)</Label>
                    <Input
                      id="monthly-contribution"
                      type="number"
                      placeholder="500"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contribution-years">Prazo (anos)</Label>
                    <Input
                      id="contribution-years"
                      type="number"
                      placeholder="10"
                      value={contributionYears}
                      onChange={(e) => setContributionYears(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contribution-rate">Taxa Anual (%)</Label>
                    <Input
                      id="contribution-rate"
                      type="number"
                      step="0.1"
                      placeholder="10"
                      value={contributionRate}
                      onChange={(e) => setContributionRate(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={calculateFutureValue} className="w-full">
                  Calcular Valor Futuro
                </Button>

                {contributionResult !== null && (
                  <Card className="bg-success/5 border-success/20">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Você terá aproximadamente:
                        </p>
                        <p className="text-4xl font-bold text-success">
                          {contributionResult.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-4">
                          Investindo {parseFloat(monthlyContribution).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}{" "}
                          por mês durante {contributionYears} anos com taxa de {contributionRate}% ao ano
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Total investido:{" "}
                          {(parseFloat(monthlyContribution) * parseFloat(contributionYears) * 12).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Simulation;

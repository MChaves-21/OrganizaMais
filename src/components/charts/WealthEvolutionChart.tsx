import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";

type TimeRange = "6m" | "1y" | "2y" | "all";

const WealthEvolutionChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("1y");
  const { transactions, isLoading: loadingTransactions } = useTransactions();
  const { investments, isLoading: loadingInvestments } = useInvestments();

  const chartData = useMemo(() => {
    if (loadingTransactions || loadingInvestments) return null;

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // Determinar quantidade de meses baseado no período selecionado
    const monthsToShow = timeRange === "6m" ? 6 : timeRange === "1y" ? 12 : timeRange === "2y" ? 24 : 36;

    // Criar lista de meses
    const months: { month: number; year: number; name: string; fullName: string }[] = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        name: monthNames[date.getMonth()],
        fullName: `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`
      });
    }

    // Agrupar transações por mês
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expense += transaction.amount;
      }
    });

    // Calcular valor inicial dos investimentos para cada mês
    const getInvestmentValueAtMonth = (targetMonth: number, targetYear: number) => {
      return investments.reduce((total, inv) => {
        const purchaseDate = new Date(inv.purchase_date);
        const purchaseMonth = purchaseDate.getMonth();
        const purchaseYear = purchaseDate.getFullYear();
        
        // Se o investimento foi comprado antes ou durante este mês
        if (purchaseYear < targetYear || (purchaseYear === targetYear && purchaseMonth <= targetMonth)) {
          return total + (inv.current_price * inv.quantity);
        }
        return total;
      }, 0);
    };

    // Calcular patrimônio acumulado
    let cumulativeSavings = 0;
    
    // Calcular economia acumulada antes do período de exibição
    const allTransactionsSorted = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsToShow);
    
    allTransactionsSorted.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate < startDate) {
        if (transaction.type === 'income') {
          cumulativeSavings += transaction.amount;
        } else {
          cumulativeSavings -= transaction.amount;
        }
      }
    });

    const data = months.map(({ month, year, fullName }) => {
      const key = `${year}-${month}`;
      const monthData = monthlyData[key] || { income: 0, expense: 0 };
      
      cumulativeSavings += monthData.income - monthData.expense;
      const investmentValue = getInvestmentValueAtMonth(month, year);
      const totalWealth = Math.max(0, cumulativeSavings) + investmentValue;

      return {
        name: fullName,
        patrimonio: totalWealth,
        economias: Math.max(0, cumulativeSavings),
        investimentos: investmentValue,
        receitas: monthData.income,
        despesas: monthData.expense,
        saldo: monthData.income - monthData.expense
      };
    });

    // Calcular estatísticas
    const firstValue = data[0]?.patrimonio || 0;
    const lastValue = data[data.length - 1]?.patrimonio || 0;
    const absoluteChange = lastValue - firstValue;
    const percentageChange = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    
    const maxValue = Math.max(...data.map(d => d.patrimonio));
    const minValue = Math.min(...data.map(d => d.patrimonio));
    const avgValue = data.reduce((sum, d) => sum + d.patrimonio, 0) / data.length;

    return {
      data,
      stats: {
        currentValue: lastValue,
        absoluteChange,
        percentageChange,
        maxValue,
        minValue,
        avgValue,
        isPositive: percentageChange >= 0
      }
    };
  }, [transactions, investments, loadingTransactions, loadingInvestments, timeRange]);

  if (loadingTransactions || loadingInvestments || !chartData) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Evolução Patrimonial Detalhada</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const { data, stats } = chartData;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Patrimônio Total:</span>
              <span className="font-medium text-primary">{formatCurrency(data.patrimonio)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Economias:</span>
              <span className="font-medium">{formatCurrency(data.economias)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Investimentos:</span>
              <span className="font-medium">{formatCurrency(data.investimentos)}</span>
            </div>
            <div className="border-t border-border pt-1 mt-1">
              <div className="flex justify-between gap-4">
                <span className="text-success">Receitas:</span>
                <span className="font-medium text-success">+{formatCurrency(data.receitas)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-destructive">Despesas:</span>
                <span className="font-medium text-destructive">-{formatCurrency(data.despesas)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Evolução Patrimonial Detalhada
            </CardTitle>
            <CardDescription>Acompanhe o crescimento do seu patrimônio ao longo do tempo</CardDescription>
          </div>
          <div className="flex gap-1">
            {(["6m", "1y", "2y", "all"] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === "6m" ? "6M" : range === "1y" ? "1A" : range === "2y" ? "2A" : "Tudo"}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Patrimônio Atual</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(stats.currentValue)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Variação no Período</p>
            <div className="flex items-center gap-1">
              {stats.isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={`text-lg font-bold ${stats.isPositive ? 'text-success' : 'text-destructive'}`}>
                {stats.percentageChange >= 0 ? '+' : ''}{stats.percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Máximo no Período</p>
            <p className="text-lg font-bold">{formatCurrency(stats.maxValue)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Média no Período</p>
            <p className="text-lg font-bold">{formatCurrency(stats.avgValue)}</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInvestimentos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              className="text-xs"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={stats.avgValue} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ value: 'Média', position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="investimentos"
              stackId="1"
              stroke="hsl(var(--chart-2))"
              fill="url(#colorInvestimentos)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="patrimonio"
              stroke="hsl(var(--primary))"
              fill="url(#colorPatrimonio)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
            <span className="text-sm text-muted-foreground">Patrimônio Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            <span className="text-sm text-muted-foreground">Investimentos</span>
          </div>
        </div>

        {/* Growth Badge */}
        {stats.absoluteChange !== 0 && (
          <div className="flex justify-center mt-4">
            <Badge 
              variant={stats.isPositive ? "default" : "destructive"}
              className={stats.isPositive ? "bg-success text-success-foreground" : ""}
            >
              {stats.isPositive ? '+' : ''}{formatCurrency(stats.absoluteChange)} no período
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WealthEvolutionChart;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface OrganizationData {
  name: string;
  count: number;
}

interface DistributionChartsProps {
  topOrganizations: OrganizationData[];
  loading: boolean;
}

const chartConfig = {
  count: {
    label: "Quantidade",
    color: "hsl(var(--chart-1))",
  },
};



export function DistributionCharts({ topOrganizations, loading }: DistributionChartsProps) {
  if (loading) {
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Organizações</CardTitle>
            <CardDescription>Organizações com mais justificativas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Organizações</CardTitle>
          <CardDescription>Organizações com mais justificativas</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topOrganizations} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12 }}
                  width={120}
                  tickFormatter={(value) => {
                    return value.length > 15 ? `${value.substring(0, 15)}...` : value;
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
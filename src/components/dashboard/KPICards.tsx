import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface KPIData {
  totalJustifications: number;
  last7Days: number;
  lastMonth: number;
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: number;
  avgAnalysisTime: number;
}

interface KPICardsProps {
  data: KPIData;
  loading: boolean;
}

export function KPICards({ data, loading }: KPICardsProps) {
  const total = data.approved + data.rejected + data.pending;
  const approvedPercentage = total > 0 ? (data.approved / total) * 100 : 0;
  const rejectedPercentage = total > 0 ? (data.rejected / total) * 100 : 0;
  const pendingPercentage = total > 0 ? (data.pending / total) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Acumulado
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? '...' : data.totalJustifications}
          </div>
          <p className="text-xs text-muted-foreground">
            Justificativas totais
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Últimos 7 Dias
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? '...' : data.last7Days}
          </div>
          <p className="text-xs text-muted-foreground">
            Novos registros
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Último Mês
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? '...' : data.lastMonth}
          </div>
          <p className="text-xs text-muted-foreground">
            Registros mensais
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taxa de Aprovação
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? '...' : `${data.approvalRate.toFixed(1)}%`}
          </div>
          <p className="text-xs text-muted-foreground">
            Aprovadas / Total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tempo Médio
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? '...' : `${data.avgAnalysisTime.toFixed(1)}h`}
          </div>
          <p className="text-xs text-muted-foreground">
            Análise média
          </p>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Aprovadas
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {loading ? '...' : data.approved}
          </div>
          <p className="text-xs text-muted-foreground">
            {approvedPercentage.toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Recusadas
          </CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {loading ? '...' : data.rejected}
          </div>
          <p className="text-xs text-muted-foreground">
            {rejectedPercentage.toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pendentes
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {loading ? '...' : data.pending}
          </div>
          <p className="text-xs text-muted-foreground">
            {pendingPercentage.toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
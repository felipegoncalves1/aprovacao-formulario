import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Building, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalRecords: number;
  recordsThisMonth: number;
  organizations: number;
  recentActivity: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 0,
    recordsThisMonth: 0,
    organizations: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      // Total records
      const { count: totalRecords } = await supabase
        .from('prematurajustify')
        .select('*', { count: 'exact', head: true });

      // Records this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: recordsThisMonth } = await supabase
        .from('prematurajustify')
        .select('*', { count: 'exact', head: true })
        .gte('lastdate', startOfMonth.toISOString());

      // Unique organizations - temporarily set to 0 until organization column is available
      const uniqueOrgs = 0;

      // Recent activity
      const { data: recentActivity } = await supabase
        .from('prematurajustify')
        .select('*')
        .order('lastdate', { ascending: false })
        .limit(5);

      setStats({
        totalRecords: totalRecords || 0,
        recordsThisMonth: recordsThisMonth || 0,
        organizations: uniqueOrgs,
        recentActivity: recentActivity || [],
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumo das atividades do sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Registros
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalRecords}
            </div>
            <p className="text-xs text-muted-foreground">
              Justificativas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Este Mês
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.recordsThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">
              Novos registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Organizações
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.organizations}
            </div>
            <p className="text-xs text-muted-foreground">
              Empresas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Crescimento
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `+${Math.round((stats.recordsThisMonth / Math.max(stats.totalRecords - stats.recordsThisMonth, 1)) * 100)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Vs. período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas justificativas registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Carregando atividades...
            </div>
          ) : stats.recentActivity.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhuma atividade recente
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {record.supplynumber || 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Série: {record.serialnumber || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDate(record.lastdate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {record.lastlevel || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
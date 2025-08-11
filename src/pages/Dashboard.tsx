import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KPICards } from '@/components/dashboard/KPICards';

import { DistributionCharts } from '@/components/dashboard/DistributionCharts';
import { RankingTables } from '@/components/dashboard/RankingTables';

interface DashboardData {
  kpiData: {
    totalJustifications: number;
    last7Days: number;
    lastMonth: number;
    approved: number;
    rejected: number;
    pending: number;
    approvalRate: number;
    avgAnalysisTime: number;
  };
  trendData: Array<{
    date: string;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  topOrganizations: Array<{
    name: string;
    count: number;
  }>;
  rejectionReasons: Array<{
    reason: string;
    count: number;
  }>;
  topApprovals: Array<{
    name: string;
    count: number;
  }>;
  topRejections: Array<{
    name: string;
    count: number;
  }>;
  fastestAnalysts: Array<{
    name: string;
    avgTime: number;
    count: number;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    kpiData: {
      totalJustifications: 0,
      last7Days: 0,
      lastMonth: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      approvalRate: 0,
      avgAnalysisTime: 0,
    },
    trendData: [],
    topOrganizations: [],
    rejectionReasons: [],
    topApprovals: [],
    topRejections: [],
    fastestAnalysts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Date ranges
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all records for analysis
      const { data: allRecords } = await supabase
        .from('prematurajustify')
        .select('*');

      if (!allRecords) {
        setLoading(false);
        return;
      }

      // KPI calculations
      const totalJustifications = allRecords.length;
      const last7DaysCount = allRecords.filter(record => 
        record.lastdate && new Date(record.lastdate) >= last7Days
      ).length;
      const lastMonthCount = allRecords.filter(record => 
        record.lastdate && new Date(record.lastdate) >= lastMonth
      ).length;

      const getStatus = (s: string | null) => (s || '').toLowerCase();
      const approved = allRecords.filter(r => ['approved','aprovado'].includes(getStatus(r.status))).length;
      const rejected = allRecords.filter(r => ['rejected','reprovado'].includes(getStatus(r.status))).length;
      const pending = allRecords.filter(r => {
        const st = getStatus(r.status);
        return !st || ['pending','pendente'].includes(st);
      }).length;
      
      const approvalRate = totalJustifications > 0 ? (approved / totalJustifications) * 100 : 0;

      // Calculate average analysis time
      const analyzedRecords = allRecords.filter(record => 
        record.lastdate && record.dataanalise
      );
      const avgAnalysisTime = analyzedRecords.length > 0 
        ? analyzedRecords.reduce((acc, record) => {
            const submitDate = new Date(record.lastdate);
            const analysisDate = new Date(record.dataanalise);
            const timeDiff = (analysisDate.getTime() - submitDate.getTime()) / (1000 * 60 * 60);
            return acc + timeDiff;
          }, 0) / analyzedRecords.length
        : 0;

      // Trend data (last 30 days)
      const trendData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRecords = allRecords.filter(record => {
          if (!record.lastdate) return false;
          const recordDate = new Date(record.lastdate).toISOString().split('T')[0];
          return recordDate === dateStr;
        });

        trendData.push({
          date: dateStr,
          approved: dayRecords.filter(r => ['approved','aprovado'].includes(getStatus(r.status))).length,
          rejected: dayRecords.filter(r => ['rejected','reprovado'].includes(getStatus(r.status))).length,
          pending: dayRecords.filter(r => {
            const st = getStatus(r.status);
            return !st || ['pending','pendente'].includes(st);
          }).length,
        });
      }

      // Top organizations
      const orgCounts = allRecords.reduce((acc, record) => {
        const org = record.organization || 'Não informado';
        acc[org] = (acc[org] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topOrganizations = Object.entries(orgCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Rejection reasons
      const rejectionCounts = allRecords
        .filter(record => record.status === 'rejected' && record.motivo_reprovacao)
        .reduce((acc, record) => {
          const reason = record.motivo_reprovacao || 'Não especificado';
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const rejectionReasons = Object.entries(rejectionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));

      // Top approvals by organization
      const approvalsByOrg = allRecords
        .filter(record => ['approved','aprovado'].includes(getStatus(record.status)))
        .reduce((acc, record) => {
          const org = record.organization || 'Não informado';
          acc[org] = (acc[org] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topApprovals = Object.entries(approvalsByOrg)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Top rejections by organization
      const rejectionsByOrg = allRecords
        .filter(record => ['rejected','reprovado'].includes(getStatus(record.status)))
        .reduce((acc, record) => {
          const org = record.organization || 'Não informado';
          acc[org] = (acc[org] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topRejections = Object.entries(rejectionsByOrg)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Fastest analysts
      const analystTimes = allRecords
        .filter(record => record.analisado_por && record.lastdate && record.dataanalise)
        .reduce((acc, record) => {
          const analyst = record.analisado_por!;
          const submitDate = new Date(record.lastdate!);
          const analysisDate = new Date(record.dataanalise!);
          const timeDiff = (analysisDate.getTime() - submitDate.getTime()) / (1000 * 60 * 60);
          
          if (!acc[analyst]) {
            acc[analyst] = { totalTime: 0, count: 0 };
          }
          acc[analyst].totalTime += timeDiff;
          acc[analyst].count += 1;
          return acc;
        }, {} as Record<string, { totalTime: number; count: number }>);

      const fastestAnalysts = Object.entries(analystTimes)
        .map(([name, data]) => ({
          name,
          avgTime: data.totalTime / data.count,
          count: data.count,
        }))
        .filter(analyst => analyst.count >= 2) // Only analysts with at least 2 analyses
        .sort((a, b) => a.avgTime - b.avgTime)
        .slice(0, 5);

      setDashboardData({
        kpiData: {
          totalJustifications,
          last7Days: last7DaysCount,
          lastMonth: lastMonthCount,
          approved,
          rejected,
          pending,
          approvalRate,
          avgAnalysisTime,
        },
        trendData,
        topOrganizations,
        rejectionReasons,
        topApprovals,
        topRejections,
        fastestAnalysts,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
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


      {/* Distribution Charts */}
      <DistributionCharts 
        topOrganizations={dashboardData.topOrganizations}
        loading={loading}
      />

      {/* Ranking Tables */}
      <RankingTables 
        topApprovals={dashboardData.topApprovals}
        topRejections={dashboardData.topRejections}
        loading={loading}
      />
    </div>
  );
}
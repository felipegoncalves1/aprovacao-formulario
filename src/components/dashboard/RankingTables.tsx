import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface RankingData {
  name: string;
  count: number;
  percentage?: number;
}

interface AnalystData {
  name: string;
  avgTime: number;
  count: number;
}

interface RankingTablesProps {
  topApprovals: RankingData[];
  topRejections: RankingData[];
  fastestAnalysts?: AnalystData[];
  loading: boolean;
}

export function RankingTables({ topApprovals, topRejections, loading }: RankingTablesProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Aprovações</CardTitle>
            <CardDescription>Organizações com mais aprovações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-muted-foreground">
              Carregando...
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Recusas</CardTitle>
            <CardDescription>Organizações com mais recusas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-muted-foreground">
              Carregando...
            </div>
          </CardContent>
        </Card>

      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Aprovações</CardTitle>
          <CardDescription>Organizações com mais aprovações</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead className="text-right">Aprovações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topApprovals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              ) : (
                topApprovals.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index + 1}º
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.name || 'Não informado'}
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Recusas</CardTitle>
          <CardDescription>Organizações com mais recusas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead className="text-right">Recusas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topRejections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              ) : (
                topRejections.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant={index === 0 ? "destructive" : "secondary"}>
                        {index + 1}º
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.name || 'Não informado'}
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
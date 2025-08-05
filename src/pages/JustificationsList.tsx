import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Eye, Download, Search } from 'lucide-react';

interface PrematureJustifyRecord {
  id: string;
  supplynumber: string | null;
  serialnumber: string | null;
  lastdate: string | null;
  lastlevel: string | null;
  justify: string | null;
  filename: string | null;
  download: string | null;
  organization: string | null;
  status: string | null;
}

export default function JustificationsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<PrematureJustifyRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PrematureJustifyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('prematurajustify')
        .select('*')
        .order('lastdate', { ascending: false });

      if (error) {
        throw error;
      }

      // Use data directly from database
      const typedData = data as unknown as PrematureJustifyRecord[];
      setRecords(typedData || []);
      setFilteredRecords(typedData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter records based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter(record => 
        (record.organization?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.serialnumber?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, records]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDownload = (downloadUrl: string) => {
    // Open the URL directly in a new tab
    window.open(downloadUrl, '_blank');
    
    toast({
      title: "Download iniciado",
      description: "O arquivo está sendo aberto.",
    });
  };

  const isDownloadDisabled = (record: PrematureJustifyRecord) => {
    return !record.download || record.justify === "Sem Evidência";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lista de Justificativas</h1>
        <p className="text-muted-foreground">
          Gerenciamento de justificativas de suprimentos prematuros
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registros de Justificativas Prematuras</span>
            <Badge variant="secondary">
              {records.length} registro(s)
            </Badge>
          </CardTitle>
          <CardDescription>
            Lista de todas as justificativas de suprimentos com retorno prematuro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar por organização ou número de série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Carregando dados...</div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum registro encontrado para a pesquisa' : 'Nenhum registro encontrado'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Suprimento</TableHead>
                    <TableHead>Nº Série</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.supplynumber || 'N/A'}</TableCell>
                      <TableCell>{record.serialnumber || 'N/A'}</TableCell>
                      <TableCell>{formatDate(record.lastdate)}</TableCell>
                      <TableCell>
                        {record.lastlevel ? (
                          <Badge variant="outline">{record.lastlevel}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.status ? (
                          <Badge variant="secondary">{record.status}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.organization ? (
                          <Badge variant="outline">{record.organization}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Registro</DialogTitle>
                                <DialogDescription>
                                  Informações completas da justificativa prematura
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">ID</label>
                                    <p className="text-sm text-muted-foreground font-mono">{record.id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Nº Suprimento</label>
                                    <p className="text-sm text-muted-foreground">{record.supplynumber || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Nº Série</label>
                                    <p className="text-sm text-muted-foreground">{record.serialnumber || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Organização</label>
                                    <p className="text-sm text-muted-foreground">{record.organization || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Data</label>
                                    <p className="text-sm text-muted-foreground">{formatDate(record.lastdate)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Nível</label>
                                    <p className="text-sm text-muted-foreground">{record.lastlevel || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <p className="text-sm text-muted-foreground">{record.status || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Nome do Arquivo</label>
                                    <p className="text-sm text-muted-foreground">{record.filename || 'N/A'}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Justificativa</label>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {record.justify || 'N/A'}
                                  </p>
                                </div>
                                <div className="flex justify-end pt-4 border-t">
                                  <Button 
                                    onClick={() => handleDownload(record.download!)}
                                    disabled={isDownloadDisabled(record)}
                                    className="gap-2"
                                    variant={isDownloadDisabled(record) ? "secondary" : "default"}
                                  >
                                    <Download className="h-4 w-4" />
                                    Download Arquivo
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            onClick={() => handleDownload(record.download!)}
                            disabled={isDownloadDisabled(record)}
                            size="sm"
                            variant={isDownloadDisabled(record) ? "secondary" : "outline"}
                            className="gap-1"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
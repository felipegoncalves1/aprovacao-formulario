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
import { LogOut, Download, Eye, Settings } from 'lucide-react';

interface PrematureJustifyRecord {
  id: string;
  supplynumber: string | null;
  serialnumber: string | null;
  lastdate: string | null;
  lastlevel: string | null;
  justify: string | null;
  filename: string | null;
  download: string | null;
}

export default function Admin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<PrematureJustifyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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

      setRecords(data || []);
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDownload = async (downloadUrl: string, filename: string) => {
    try {
      // Se for um URL do Supabase Storage
      if (downloadUrl.includes('supabase')) {
        const { data, error } = await supabase.storage
          .from('anexostorage')
          .download(downloadUrl);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'arquivo';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Se for um URL direto
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename || 'arquivo';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      toast({
        title: "Download iniciado",
        description: "O arquivo está sendo baixado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no download",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">
              Gerenciamento de Suprimentos Prematuros
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSettings(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Carregando dados...</div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum registro encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nº Suprimento</TableHead>
                      <TableHead>Nº Série</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Justificativa</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs">
                          {record.id.substring(0, 8)}...
                        </TableCell>
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
                        <TableCell className="max-w-xs truncate">
                          {record.justify || 'N/A'}
                        </TableCell>
                        <TableCell>{record.filename || 'N/A'}</TableCell>
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
                                       <label className="text-sm font-medium">Data</label>
                                       <p className="text-sm text-muted-foreground">{formatDate(record.lastdate)}</p>
                                     </div>
                                     <div>
                                       <label className="text-sm font-medium">Nível</label>
                                       <p className="text-sm text-muted-foreground">{record.lastlevel || 'N/A'}</p>
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
                                 </div>
                               </DialogContent>
                             </Dialog>
                             {record.download && (
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => handleDownload(record.download!, record.filename || 'arquivo')}
                               >
                                 <Download className="h-4 w-4" />
                               </Button>
                             )}
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
      </main>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurações do Sistema</DialogTitle>
            <DialogDescription>
              Painel de configurações para administradores
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações Gerais</CardTitle>
                <CardDescription>
                  Configurações básicas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>• Backup automático: Ativado</p>
                  <p>• Logs do sistema: Habilitados</p>
                  <p>• Notificações por email: Ativas</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
                <CardDescription>
                  Resumo dos dados do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total de Registros</p>
                    <p className="text-2xl font-bold">{records.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Usuário Atual</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
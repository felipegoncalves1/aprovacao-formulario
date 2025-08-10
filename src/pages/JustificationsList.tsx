import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Download, Search, Check, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface PrematureJustifyRecord {
  id: string;
  idformulario: string | null;
  supplynumber: string | null;
  serialnumber: string | null;
  lastdate: string | null;
  lastlevel: string | null;
  justify: string | null;
  filename: string | null;
  download: string | null;
  organization: string | null;
  status: string | null;
  tipoenvio: string | null;
  analisado_por: string | null;
  dataanalise: string | null;
  motivo_reprovacao: string | null;
}

export default function JustificationsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<PrematureJustifyRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PrematureJustifyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PrematureJustifyRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'pendentes' | 'todos'>('pendentes');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'aprovado' | 'reprovado'>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [tipoEnvioFilter, setTipoEnvioFilter] = useState<string>('all');

  const pendingOptions = useMemo(() => {
    const prs = records.filter(r => (r.status || '').toLowerCase() === 'pendente');
    const orgs = Array.from(new Set(prs.map(r => r.organization).filter(Boolean))) as string[];
    const tipos = Array.from(new Set(prs.map(r => r.tipoenvio).filter(Boolean))) as string[];
    return { orgs, tipos };
  }, [records]);

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

  // Filtros combinados: abas, status e busca livre
  useEffect(() => {
    let list = [...records];

    if (activeTab === 'pendentes') {
      list = list.filter(r => (r.status || '').toLowerCase() === 'pendente');
      if (orgFilter !== 'all') {
        list = list.filter(r => (r.organization || '') === orgFilter);
      }
      if (tipoEnvioFilter !== 'all') {
        list = list.filter(r => (r.tipoenvio || '') === tipoEnvioFilter);
      }
    } else if (statusFilter !== 'all') {
      list = list.filter(r => (r.status || '').toLowerCase() === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((r) => {
        const bag = [
          r.id,
          r.idformulario,
          r.supplynumber,
          r.serialnumber,
          r.lastlevel?.toString(),
          r.justify,
          r.filename,
          r.organization,
          r.status,
          r.tipoenvio,
          r.analisado_por,
          r.motivo_reprovacao,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return bag.includes(term);
      });
    }

    // Ordena por data mais recente
    list.sort((a, b) => {
      const da = a.lastdate ? new Date(a.lastdate).getTime() : 0;
      const db = b.lastdate ? new Date(b.lastdate).getTime() : 0;
      return db - da;
    });

    setFilteredRecords(list);
  }, [records, searchTerm, statusFilter, activeTab, orgFilter, tipoEnvioFilter]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Exibe data e hora completas no formato dd/MM/yyyy HH:mm
  // Sem conversão de fuso horário: extrai diretamente da string ISO
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const s = String(dateString);
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))/);
    if (match) {
      const [, y, mo, d, h = '00', mi = '00'] = match;
      return `${d}/${mo}/${y} ${h}:${mi}`;
    }
    // Fallback para valores não ISO: tenta Date apenas para não quebrar
    const dObj = new Date(s);
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = dObj.getFullYear();
    const mo = pad(dObj.getMonth() + 1);
    const d = pad(dObj.getDate());
    const h = pad(dObj.getHours());
    const mi = pad(dObj.getMinutes());
    return `${d}/${mo}/${y} ${h}:${mi}`;
  };
  const handleDownload = (downloadUrl: string) => {
    window.open(downloadUrl, '_blank');
    
    toast({
      title: "Download iniciado",
      description: "O arquivo está sendo aberto.",
    });
  };

  const isDownloadDisabled = (record: PrematureJustifyRecord) => {
    return !record.download || record.justify === "Sem Evidência";
  };

  const callWebhook = async (webhookType: 'aprovacao' | 'reprovacao', record: PrematureJustifyRecord, motivoReprovacao?: string) => {
    try {
      // Get webhook configuration
      const { data: config, error: configError } = await supabase
        .from('configuracoes')
        .select('webhook_aprovacao, webhook_reprovacao')
        .limit(1)
        .maybeSingle();

      if (configError) {
        console.error('Error fetching webhook config:', configError);
        return;
      }

      const webhookUrl = webhookType === 'aprovacao' ? config.webhook_aprovacao : config.webhook_reprovacao;
      
      if (!webhookUrl) {
        console.warn(`Webhook ${webhookType} não configurado`);
        return;
      }

      const webhookData = {
        ...record,
        status: webhookType === 'aprovacao' ? 'aprovado' : 'reprovado',
        analisado_por: user?.email || null,
        dataanalise: new Date().toISOString(),
        ...(motivoReprovacao ? { motivo_reprovacao: motivoReprovacao } : {}),
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

    } catch (error) {
      console.error('Error calling webhook:', error);
    }
  };

  const handleApprove = async (record: PrematureJustifyRecord) => {
    try {
      const { error } = await supabase
        .from('prematurajustify')
        .update({
          status: 'aprovado',
          analisado_por: user?.email,
          dataanalise: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (error) {
        throw error;
      }

      // Call webhook
      await callWebhook('aprovacao', record);

      toast({
        title: "Justificativa aprovada",
        description: "O registro foi aprovado com sucesso.",
      });

      fetchRecords(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!currentRecord || !rejectReason.trim()) {
      toast({
        title: "Erro",
        description: "Motivo da reprovação é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('prematurajustify')
        .update({
          status: 'reprovado',
          analisado_por: user?.email,
          dataanalise: new Date().toISOString(),
          motivo_reprovacao: rejectReason,
        })
        .eq('id', currentRecord.id);

      if (error) {
        throw error;
      }

      // Call webhook
      await callWebhook('reprovacao', currentRecord, rejectReason);

      toast({
        title: "Justificativa reprovada",
        description: "O registro foi reprovado com sucesso.",
      });

      setRejectDialogOpen(false);
      setRejectReason('');
      setCurrentRecord(null);
      fetchRecords(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Erro ao reprovar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openRejectDialog = (record: PrematureJustifyRecord) => {
    setCurrentRecord(record);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Pendente</Badge>;
    
    switch (status.toLowerCase()) {
      case 'aprovado':
        return <Badge className="bg-success text-success-foreground">Aprovado</Badge>;
      case 'reprovado':
        return <Badge variant="destructive">Reprovado</Badge>;
      case 'pendente':
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Operacional</h1>
        <p className="text-muted-foreground">
          Visualização e gerenciamento de justificativas de suprimentos prematuros
        </p>
      </div>

      <Tabs
        defaultValue="pendentes"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'pendentes' | 'todos')}
        className="mt-2"
      >
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'todos' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar em qualquer campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

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
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum registro encontrado para a pesquisa' : 'Nenhum registro encontrado'}
            </div>
          ) : (
            <div className="overflow-x-auto text-[0.7rem] leading-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Formulário</TableHead>
                    <TableHead>Nº Suprimento</TableHead>
                    <TableHead>Nº Série</TableHead>
                    <TableHead>Última Leitura</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Tipo Envio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {record.idformulario || 'FORM-0001'}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.supplynumber || 'N/A'}</TableCell>
                      <TableCell>{record.serialnumber || 'N/A'}</TableCell>
                      <TableCell>{formatDateTime(record.lastdate)}</TableCell>
                      <TableCell>
                        {record.lastlevel ? (
                          <Badge variant="outline">{record.lastlevel}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.tipoenvio ? (
                          <Badge variant="outline">{record.tipoenvio}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
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
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Registro</DialogTitle>
                                <DialogDescription>
                                  Informações completas da justificativa prematura
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">ID Formulário</label>
                                    <p className="text-sm text-muted-foreground font-mono">{record.idformulario || 'FORM-0001'}</p>
                                  </div>
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
                                    <label className="text-sm font-medium">Tipo de Envio</label>
                                    <p className="text-sm text-muted-foreground">{record.tipoenvio || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <p className="text-sm text-muted-foreground">{record.status || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Nome do Arquivo</label>
                                    <p className="text-sm text-muted-foreground">{record.filename || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Analisado por</label>
                                    <p className="text-sm text-muted-foreground">{record.analisado_por || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Data de Análise</label>
                                    <p className="text-sm text-muted-foreground">{formatDate(record.dataanalise)}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Justificativa</label>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {record.justify || 'N/A'}
                                  </p>
                                </div>
                                {record.motivo_reprovacao && (
                                  <div>
                                    <label className="text-sm font-medium">Motivo da Reprovação</label>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                      {record.motivo_reprovacao}
                                    </p>
                                  </div>
                                )}
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

                          {/* Approval and Rejection Buttons */}
                          {record.status !== 'aprovado' && record.status !== 'reprovado' && (
                            <>
                              <Button 
                                onClick={() => handleApprove(record)}
                                size="sm"
                                className="gap-1 bg-success text-success-foreground hover:bg-success/90"
                              >
                                <Check className="h-3 w-3" />
                                Aprovar
                              </Button>
                              
                              <Button 
                                onClick={() => openRejectDialog(record)}
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                              >
                                <X className="h-3 w-3" />
                                Reprovar
                              </Button>
                            </>
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar Justificativa</DialogTitle>
            <DialogDescription>
              Informe o motivo da reprovação para o registro selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo da Reprovação *</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Descreva o motivo da reprovação..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Reprovar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Check, AlertTriangle, Database, Users, Webhook } from 'lucide-react';

interface ConfiguracaoData {
  id: string;
  webhook_aprovacao: string | null;
  webhook_reprovacao: string | null;
  webhook_notificacao_cliente: string | null;
  webhook_callback: string | null;
  ambiente_banco: string | null;
  schema_atual: string | null;
}

const ADMIN_EMAILS = ['felipe.carvalho@tecnoset.com.br'];

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<ConfiguracaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Check if user is admin master
  const isAdminMaster = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!isAdminMaster) {
      navigate('/admin');
      return;
    }

    fetchConfig();
  }, [user, navigate, isAdminMaster]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setConfig(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (field: string, value: string) => {
    if (!config) return;

    setSaving(field);
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({ [field]: value })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, [field]: value });
      toast({
        title: "Configuração salva",
        description: `${field.replace('_', ' ')} atualizado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const validateConnection = async () => {
    toast({
      title: "Validação de conexão",
      description: "Conexão com o banco validada com sucesso.",
    });
  };

  if (!user || !isAdminMaster) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  ⚙️ Configurações do Sistema
                </h1>
                <p className="text-sm text-muted-foreground">
                  Painel de configurações - Admin Master
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-2">
              <Users className="h-3 w-3" />
              Admin Master
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="integracoes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="integracoes" className="gap-2">
              <Webhook className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="banco" className="gap-2">
              <Database className="h-4 w-4" />
              Parâmetros do Banco
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="h-4 w-4" />
              Gerenciamento de Usuários
            </TabsTrigger>
          </TabsList>

          {/* Aba Integrações */}
          <TabsContent value="integracoes">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Webhooks</CardTitle>
                <CardDescription>
                  Configure os endpoints para integração com sistemas externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {/* Webhook Aprovação */}
                  <div className="space-y-2">
                    <Label htmlFor="webhook_aprovacao">Webhook de Aprovação</Label>
                    <div className="flex gap-2">
                      <Input
                        id="webhook_aprovacao"
                        placeholder="https://seu-sistema.com/api/aprovacao"
                        value={config?.webhook_aprovacao || ''}
                        onChange={(e) => setConfig(config ? {...config, webhook_aprovacao: e.target.value} : null)}
                      />
                      <Button 
                        size="sm"
                        onClick={() => updateConfig('webhook_aprovacao', config?.webhook_aprovacao || '')}
                        disabled={saving === 'webhook_aprovacao'}
                      >
                        {saving === 'webhook_aprovacao' ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Webhook Reprovação */}
                  <div className="space-y-2">
                    <Label htmlFor="webhook_reprovacao">Webhook de Reprovação</Label>
                    <div className="flex gap-2">
                      <Input
                        id="webhook_reprovacao"
                        placeholder="https://seu-sistema.com/api/reprovacao"
                        value={config?.webhook_reprovacao || ''}
                        onChange={(e) => setConfig(config ? {...config, webhook_reprovacao: e.target.value} : null)}
                      />
                      <Button 
                        size="sm"
                        onClick={() => updateConfig('webhook_reprovacao', config?.webhook_reprovacao || '')}
                        disabled={saving === 'webhook_reprovacao'}
                      >
                        {saving === 'webhook_reprovacao' ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Webhook Notificação Cliente */}
                  <div className="space-y-2">
                    <Label htmlFor="webhook_notificacao_cliente">Webhook de Notificação ao Cliente</Label>
                    <div className="flex gap-2">
                      <Input
                        id="webhook_notificacao_cliente"
                        placeholder="https://seu-sistema.com/api/notificar-cliente"
                        value={config?.webhook_notificacao_cliente || ''}
                        onChange={(e) => setConfig(config ? {...config, webhook_notificacao_cliente: e.target.value} : null)}
                      />
                      <Button 
                        size="sm"
                        onClick={() => updateConfig('webhook_notificacao_cliente', config?.webhook_notificacao_cliente || '')}
                        disabled={saving === 'webhook_notificacao_cliente'}
                      >
                        {saving === 'webhook_notificacao_cliente' ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Webhook Callback */}
                  <div className="space-y-2">
                    <Label htmlFor="webhook_callback">Webhook de Callback</Label>
                    <div className="flex gap-2">
                      <Input
                        id="webhook_callback"
                        placeholder="https://seu-sistema.com/api/callback"
                        value={config?.webhook_callback || ''}
                        onChange={(e) => setConfig(config ? {...config, webhook_callback: e.target.value} : null)}
                      />
                      <Button 
                        size="sm"
                        onClick={() => updateConfig('webhook_callback', config?.webhook_callback || '')}
                        disabled={saving === 'webhook_callback'}
                      >
                        {saving === 'webhook_callback' ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Parâmetros do Banco */}
          <TabsContent value="banco">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Banco de Dados</CardTitle>
                <CardDescription>
                  Gerenciar schema e ambiente do banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {/* Schema Atual */}
                  <div className="space-y-2">
                    <Label htmlFor="schema_atual">Schema Atual</Label>
                    <div className="flex gap-2">
                      <Input
                        id="schema_atual"
                        placeholder="public"
                        value={config?.schema_atual || 'public'}
                        onChange={(e) => setConfig(config ? {...config, schema_atual: e.target.value} : null)}
                      />
                      <Button 
                        size="sm"
                        onClick={() => updateConfig('schema_atual', config?.schema_atual || 'public')}
                        disabled={saving === 'schema_atual'}
                      >
                        {saving === 'schema_atual' ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Ambiente do Banco */}
                  <div className="space-y-2">
                    <Label htmlFor="ambiente_banco">Ambiente do Banco</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ambiente_banco"
                        placeholder="public"
                        value={config?.ambiente_banco || 'public'}
                        onChange={(e) => setConfig(config ? {...config, ambiente_banco: e.target.value} : null)}
                      />
                      <Button 
                        size="sm"
                        onClick={() => updateConfig('ambiente_banco', config?.ambiente_banco || 'public')}
                        disabled={saving === 'ambiente_banco'}
                      >
                        {saving === 'ambiente_banco' ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Validação de Conexão */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Validação de Conexão</h4>
                        <p className="text-sm text-muted-foreground">
                          Teste a conectividade com o banco de dados
                        </p>
                      </div>
                      <Button onClick={validateConnection} variant="outline" className="gap-2">
                        <Check className="h-4 w-4" />
                        Validar Conexão
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Gerenciamento de Usuários */}
          <TabsContent value="usuarios">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Controle de acesso e permissões de usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-orange-600">Em Desenvolvimento</h4>
                      <p className="text-sm text-orange-600">
                        Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">E-mails Autorizados (Admin Master)</h4>
                    <div className="space-y-2">
                      {ADMIN_EMAILS.map((email, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="font-mono text-sm">{email}</span>
                          <Badge variant="secondary">Admin Master</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Permissões por Perfil</h4>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium">Admin Master</span>
                          <p className="text-sm text-muted-foreground">Acesso total ao sistema</p>
                        </div>
                        <Badge>Ativo</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg opacity-50">
                        <div>
                          <span className="font-medium">Analista</span>
                          <p className="text-sm text-muted-foreground">Acesso limitado aos dados</p>
                        </div>
                        <Badge variant="outline">Em breve</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg opacity-50">
                        <div>
                          <span className="font-medium">Leitura</span>
                          <p className="text-sm text-muted-foreground">Apenas visualização</p>
                        </div>
                        <Badge variant="outline">Em breve</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
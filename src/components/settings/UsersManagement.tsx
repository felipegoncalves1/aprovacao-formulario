import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
export interface ProfileUser { id: string; first_name: string | null; last_name: string | null; email: string; is_active: boolean | null }

interface UsersManagementProps {
  users: ProfileUser[];
  rolesMap: Record<string, string[]>;
  adminEmails: string[];
}

export default function UsersManagement({ users, rolesMap, adminEmails }: UsersManagementProps) {
  const { toast } = useToast();
  const [openNew, setOpenNew] = useState(false);
  const [openEditId, setOpenEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'leitura' });
  const [editForm, setEditForm] = useState<{ password: string; role: string }>({ password: '', role: 'leitura' });
  const [saving, setSaving] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [localRolesMap, setLocalRolesMap] = useState<Record<string, string[]>>(rolesMap);
  useEffect(() => {
    setLocalRolesMap(rolesMap);
  }, [rolesMap]);
  const getFullName = (u: ProfileUser) => [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';
  const roleLabel = (r: string) => ({ analista: 'Analista', leitura: 'Leitura', supervisor: 'Supervisor', admin_master: 'Admin Master' }[r] || r);
  const getRole = (id: string, email: string) => {
    if (adminEmails.includes(email)) return 'admin_master';
    const roles = localRolesMap[id] || [];
    return roles[0] || 'leitura';
  };
  const resetForm = () => setForm({ fullName: '', email: '', password: '', role: 'leitura' });

  const createUser = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim() || !form.role) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: 'Senha deve conter ao menos 8 caracteres', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, role: form.role }
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao criar usuário', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Usuário criado', description: 'Acesso liberado imediatamente.' });
    setOpenNew(false);
    resetForm();
  };

  const inactivateUser = async (userId: string) => {
    if (!confirm('Deseja realmente inativar este usuário?')) return;
    const { error } = await supabase.functions.invoke('inactivate-user', { body: { userId } });
    if (error) {
      toast({ title: 'Erro ao inativar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Usuário inativado' });
  };

  const openEdit = (u: ProfileUser, role: string) => {
    setEditForm({ password: '', role });
    setOpenEditId(u.id);
  };

  const saveEdit = async (userId: string) => {
    if (!editForm.role) {
      toast({ title: 'Selecione um perfil', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.functions.invoke('update-user', {
      body: { userId, password: editForm.password || undefined, role: editForm.role }
    });
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }

    // Refetch role from backend to avoid stale cache and normalize mapping
    const { data: fresh, error: fetchErr } = await supabase
      .from('user_roles')
      .select('role, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newRole = fetchErr || !fresh ? editForm.role : String(fresh.role);
    setLocalRolesMap((prev) => ({ ...prev, [userId]: [newRole] }));

    toast({ title: 'Alterações salvas' });
    setOpenEditId(null);
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Controle de acesso e permissões</CardDescription>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button>NOVO USUÁRIO</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome Completo</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Senha</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <Label>Grupo de Perfil</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analista">Analista</SelectItem>
                    <SelectItem value="leitura">Leitura</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
              <Button onClick={createUser} disabled={saving}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="usuarios" className="space-y-6">
          <TabsList>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="perfis">Perfis</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            <div className="max-w-md">
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter((u) => {
                      const t = usersSearch.trim().toLowerCase();
                      if (!t) return true;
                      const n = getFullName(u).toLowerCase();
                      return n.includes(t) || u.email.toLowerCase().includes(t);
                    })
                    .map((u) => {
                    const role = getRole(u.id, u.email);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>{getFullName(u)}</TableCell>
                        <TableCell className="font-mono text-xs">{u.email}</TableCell>
                        <TableCell>
                          {u.is_active ? (
                            <Badge>Ativo</Badge>
                          ) : (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{roleLabel(role)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => inactivateUser(u.id)}>Inativar Usuário</Button>
                            <Dialog open={openEditId === u.id} onOpenChange={(o) => !o && setOpenEditId(null)}>
                              <DialogTrigger asChild>
                                <Button variant="secondary" size="sm" onClick={() => openEdit(u, role)}>Editar</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Usuário</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Nova Senha</Label>
                                    <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="(opcional)" />
                                  </div>
                                  <div>
                                    <Label>Perfil de Acesso</Label>
                                    <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="analista">Analista</SelectItem>
                                        <SelectItem value="leitura">Leitura</SelectItem>
                                        <SelectItem value="supervisor">Supervisor</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setOpenEditId(null)}>Cancelar</Button>
                                  <Button onClick={() => saveEdit(u.id)}>Salvar</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="perfis" className="space-y-4">
            <div className="grid gap-3">
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Analista</h4>
                    <p className="text-sm text-muted-foreground">Acesso operacional com aprovações</p>
                  </div>
                  <Badge>Disponível</Badge>
                </div>
                <Separator className="my-3" />
                <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Acesso ao Painel Operacional</li>
                  <li>Visualizar e filtrar justificativas</li>
                  <li>Aprovar e Reprovar justificativas</li>
                  <li>Sem acesso às Configurações</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Leitura</h4>
                    <p className="text-sm text-muted-foreground">Somente visualização</p>
                  </div>
                  <Badge>Disponível</Badge>
                </div>
                <Separator className="my-3" />
                <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Acesso ao Painel Operacional</li>
                  <li>Visualizar justificativas</li>
                  <li>Sem aprovações/reprovações</li>
                  <li>Sem acesso às Configurações</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Supervisor</h4>
                    <p className="text-sm text-muted-foreground">Acesso total exceto Integrações e Parâmetros do Banco</p>
                  </div>
                  <Badge>Disponível</Badge>
                </div>
                <Separator className="my-3" />
                <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Acesso ao Painel Operacional</li>
                  <li>Gerenciar usuários (editar perfil e senha, inativar)</li>
                  <li>Sem acesso a Integrações</li>
                  <li>Sem acesso a Parâmetros do Banco</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Admin Master</h4>
                    <p className="text-sm text-muted-foreground">Acesso total ao sistema</p>
                  </div>
                  <Badge variant="secondary">Sistema</Badge>
                </div>
                <Separator className="my-3" />
                <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Acesso total a todas as áreas</li>
                  <li>Gerenciar configurações e usuários</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

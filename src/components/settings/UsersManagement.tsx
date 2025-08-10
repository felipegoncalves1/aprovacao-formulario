import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ProfileUser { id: string; first_name: string | null; last_name: string | null; email: string; is_active: boolean | null }

interface UsersManagementProps {
  users: ProfileUser[];
  rolesMap: Record<string, string[]>;
  adminEmails: string[];
}

export default function UsersManagement({ users, rolesMap, adminEmails }: UsersManagementProps) {
  const getFullName = (u: ProfileUser) => [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';
  const getRole = (id: string, email: string) => {
    if (adminEmails.includes(email)) return 'admin_master';
    const roles = rolesMap[id] || [];
    return roles[0] || 'leitura';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>Controle de acesso e permissões</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="usuarios" className="space-y-6">
          <TabsList>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="perfis">Perfis</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Perfil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
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
                        <Badge variant="secondary">{getRole(u.id, u.email)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
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

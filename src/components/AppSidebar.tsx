import { useState } from 'react';
import { Home, Settings, FileText, LogOut, Database, Users, Webhook } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
const menuItems = [{
  title: 'Dashboard',
  url: '/admin',
  icon: Home
}, {
  title: 'Painel Operacional (visualização de justificativas)',
  url: '/admin/justificativas',
  icon: FileText
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const collapsed = state === 'collapsed';
  const {
    user,
    signOut
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const currentSearch = location.search;
  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };
  const isSettingsTabActive = (tab: string) => currentPath.startsWith('/admin/settings') && new URLSearchParams(currentSearch).get('tab') === tab;
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'hover:bg-sidebar-accent/50';
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        {/* User Info Section */}
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed && <div className="space-y-2">
              <h2 className="text-sm font-semibold text-sidebar-foreground">
                Painel Administrativo
              </h2>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>}
          {collapsed && <div className="flex justify-center">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-sidebar-primary-foreground font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/admin'} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações - Item com Submenus */}
        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to={'/admin/settings?tab=integracoes'} className={getNavCls}>
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Configurações</span>}
                  </NavLink>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isSettingsTabActive('integracoes')}>
                      <NavLink to={'/admin/settings?tab=integracoes'}>
                        <Webhook className="mr-2 h-4 w-4" />
                        <span>Integrações</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isSettingsTabActive('banco')}>
                      <NavLink to={'/admin/settings?tab=banco'}>
                        <Database className="mr-2 h-4 w-4" />
                        <span>Parâmetros do Banco</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isSettingsTabActive('usuarios')}>
                      <NavLink to={'/admin/settings?tab=usuarios'}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Gerenciamento de Usuários</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign Out Button */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button variant="outline" size={collapsed ? "icon" : "sm"} onClick={handleSignOut} className="w-full gap-2 text-base bg-gray-50 text-slate-950">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>;
}
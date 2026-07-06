import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  Building2,
  ClipboardList,
  Cpu,
  FolderTree,
  LayoutDashboard,
  LogOut,
  ParkingSquare,
  Radio,
  ShieldCheck,
  Truck,
  Users,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, ROLE_LABEL } from "@/lib/auth";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };

const inventario: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Activos TI", url: "/activos", icon: Cpu },
  { title: "Categorías", url: "/categorias", icon: FolderTree },
  { title: "Órdenes de Compra", url: "/ordenes-compra", icon: ClipboardList },
];

const operacion: Item[] = [
  { title: "Asignaciones", url: "/asignaciones", icon: Boxes },
  { title: "Salidas", url: "/salidas", icon: Truck },
  { title: "Movimientos", url: "/movimientos", icon: Activity },
  { title: "Canales", url: "/canales", icon: Radio },
];

const organizacion: Item[] = [
  { title: "Sedes", url: "/sedes", icon: Building2 },
  { title: "Parqueaderos", url: "/parqueaderos", icon: ParkingSquare },
  { title: "Usuarios", url: "/usuarios", icon: Users },
  { title: "Roles", url: "/roles", icon: ShieldCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();

  const renderItems = (items: Item[]) =>
    items.map((item) => {
      const active = pathname === item.url || pathname.startsWith(item.url + "/");
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
            <Link to={item.url} className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-gradient-brand grid place-items-center font-display font-bold text-primary-foreground shadow-glow">
          S
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-display font-semibold text-sidebar-foreground leading-none">
              SICOT
            </span>
            <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 mt-0.5">
              Inventario TI
            </span>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Inventario</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(inventario)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Operación</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(operacion)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Organización</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(organizacion)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {user && !collapsed && (
          <div className="mb-2 px-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.nombre}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{ROLE_LABEL[user.role]}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="Cerrar sesión">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Cerrar sesión</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

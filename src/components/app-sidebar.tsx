import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ClipboardList,
  Cpu,
  FileBarChart,
  FolderTree,
  LayoutDashboard,
  LogOut,
  MapPin,
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
import { useAuth } from "@/lib/auth";
import type { RoleKey } from "@/lib/types";

type Item = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: RoleKey[];
};

const inventario: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Activos TI", url: "/activos", icon: Cpu },
  {
    title: "Categorías",
    url: "/categorias",
    icon: FolderTree,
    roles: ["super_admin", "coordinador"],
  },
  { title: "Remisiones", url: "/remisiones", icon: ClipboardList },
];

const operacion: Item[] = [
  { title: "Asignaciones", url: "/asignaciones", icon: Boxes },
  { title: "Salidas", url: "/salidas", icon: Truck },
  { title: "Movimientos", url: "/movimientos", icon: Activity },
];

const organizacion: Item[] = [
  { title: "Areas", url: "/areas", icon: MapPin, roles: ["super_admin", "coordinador"] },
  { title: "Parqueaderos", url: "/parqueaderos", icon: ParkingSquare },
  { title: "Usuarios", url: "/usuarios", icon: Users },
  { title: "Roles", url: "/roles", icon: ShieldCheck },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderItems = (items: Item[]) =>
    items
      .filter((item) => !item.roles || item.roles.includes(user?.role ?? "agente_soporte"))
      .map((item) => {
        const active = pathname === item.url || pathname.startsWith(item.url + "/");
        return (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
              <Link to={item.url} onClick={handleNavigate} className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {(!collapsed || isMobile) && <span>{item.title}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
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
        {user?.role !== "agente_soporte" &&
          user?.role !== "auditor" &&
          user?.role !== "usuario" && (
            <SidebarGroup>
              {!collapsed && <SidebarGroupLabel>Organización</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(organizacion)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
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

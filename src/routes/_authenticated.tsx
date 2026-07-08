import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("Indigo.user");
    if (!raw) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function HeaderBar() {
  const { user, logout } = useAuth();
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === "collapsed";
  const greeting = `Hola, ${user?.nombre ?? ""}`;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur px-4 sm:px-6">
      <div className="relative flex h-full items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 pr-10 sm:pr-12">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            </TooltipContent>
          </Tooltip>

          <div className="min-w-0 hidden sm:block">
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground truncate">
              {greeting}
            </h1>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-44 -translate-x-1/2 sm:w-64 lg:w-80">
          <img
            src="/Logo INDIGO ORG. 2.png"
            alt="Indigo ORG"
            className="h-full w-full object-contain object-center"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0 pl-3 sm:pl-4">
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:flex items-center gap-3 pl-3 border-l border-border cursor-pointer outline-none">
                <div className="h-9 w-9 rounded-full bg-gradient-brand text-primary-foreground grid place-items-center text-sm font-semibold">
                  {user.nombre[0]}
                </div>
                <div className="text-sm leading-tight text-left">
                  <p className="font-medium">{user.nombre}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

function AuthenticatedLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-background">
          <HeaderBar />
          <div className="flex flex-1 min-h-0">
            <AppSidebar />
            <main className="flex-1 flex flex-col min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

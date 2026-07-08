import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground truncate">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex justify-center">
          <img
            src="/Logo INDIGO ORG. 2.png"
            alt="Indigo ORG"
            className="h-8 sm:h-9 object-contain shrink-0"
          />
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0">
          {actions}
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

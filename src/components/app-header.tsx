import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import { IS_MOCK } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 sm:px-6">
      <SidebarTrigger />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-lg sm:text-xl font-semibold text-foreground truncate">
            {title}
          </h1>
          {IS_MOCK && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-warning/40 text-warning">
              Demo
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
        {user && (
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
            <div className="h-8 w-8 rounded-full bg-gradient-brand text-primary-foreground grid place-items-center text-xs font-semibold">
              {user.nombres[0]}
              {user.apellidos[0]}
            </div>
            <div className="text-xs leading-tight">
              <p className="font-medium">{user.nombres} {user.apellidos}</p>
              <p className="text-muted-foreground">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

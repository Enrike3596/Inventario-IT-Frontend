interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  return (
    <header className="flex items-start gap-3 px-4 sm:px-6 py-4">
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground truncate">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

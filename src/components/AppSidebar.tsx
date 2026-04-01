import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, RefreshCw, Users, Building2, Settings, TrendingUp } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cycles", label: "Cycles", icon: RefreshCw },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/providers", label: "Providers", icon: Building2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">Prop Tracker</h1>
            <p className="text-xs text-muted-foreground">by Giammarco</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => (
          <RouterNavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </RouterNavLink>
        ))}
      </nav>
    </aside>
  );
}

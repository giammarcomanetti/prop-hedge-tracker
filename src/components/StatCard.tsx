import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
}

export default function StatCard({ title, value, subtitle, icon, className, valueClassName }: StatCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className={cn("text-2xl font-bold tracking-tight", valueClassName)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>}
      </div>
    </div>
  );
}

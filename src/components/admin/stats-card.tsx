import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorClass: string;
}

export function StatsCard({ title, value, icon: Icon, trend, colorClass }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-lg", colorClass)}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-full",
            trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
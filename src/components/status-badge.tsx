import { CheckCircle2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  type: "available" | "outOfStock";
  count: number;
  className?: string;
}

export function StatusBadge({ type, count, className }: StatusBadgeProps) {
  const isAvailable = type === "available";
  
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium",
      isAvailable 
        ? "text-[#10b981] border-[#10b981] bg-[#10b981]/10" 
        : "text-[#ef4444] border-[#ef4444] bg-[#ef4444]/10",
      className
    )}>
      {isAvailable ? <CheckCircle2 size={16} /> : <Ban size={16} />}
      <span>{count} {isAvailable ? "disponíveis" : "em falta"}</span>
    </div>
  );
}
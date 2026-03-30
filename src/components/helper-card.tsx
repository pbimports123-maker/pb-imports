import { LucideIcon } from "lucide-react";

interface HelperCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  subtitleColor: string;
}

export function HelperCard({ title, subtitle, icon: Icon, color, bgColor, borderColor, subtitleColor }: HelperCardProps) {
  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:opacity-90"
      style={{ backgroundColor: bgColor, borderColor: borderColor }}
    >
      <div className="p-2 rounded-md" style={{ color: color }}>
        <Icon size={32} />
      </div>
      <div>
        <h4 className="font-bold text-white">{title}</h4>
        <p className="text-sm" style={{ color: subtitleColor }}>{subtitle}</p>
      </div>
    </div>
  );
}
"use client";

import { Bell, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#404040] bg-[#1a1a1a]">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo PB Imports */}
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="text-3xl font-black text-[#1e3a5f] tracking-tighter">PB</span>
            <Sparkles className="w-4 h-4 text-[#fbbf24] fill-[#fbbf24]" />
          </div>
          <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-[0.2em] ml-0.5">imports</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <Bell className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              <Badge className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] bg-[#fbbf24] text-black border-none">
                52
              </Badge>
            </div>
            <span className="text-xs text-[#9ca3af] group-hover:text-white transition-colors">novidades</span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black transition-all gap-2"
          >
            <Share2 size={16} />
            <span className="hidden xs:inline">Compartilhar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
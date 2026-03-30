"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
            <ChevronLeft size={16} />
            Voltar para o site
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md bg-[#2d2d2d] p-8 rounded-2xl border border-[#404040] shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-4xl font-black text-white tracking-tighter">PB</span>
            <Sparkles className="w-6 h-6 text-[#fbbf24] fill-[#fbbf24]" />
          </div>
          <h1 className="text-xl font-bold text-white uppercase tracking-widest">Painel Admin</h1>
          <p className="text-gray-400 text-sm mt-2">Acesse para gerenciar sua loja</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#1e3a5f',
                  brandAccent: '#162a45',
                  inputBackground: '#1a1a1a',
                  inputText: 'white',
                  inputPlaceholder: '#6b7280',
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                email_input_placeholder: 'Seu e-mail',
                password_input_placeholder: 'Sua senha',
              },
            },
          }}
          theme="dark"
          providers={[]}
        />
      </div>
    </div>
  );
}
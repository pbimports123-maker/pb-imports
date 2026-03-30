"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      router.push('/admin');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fbbf24]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a1a] p-4">
      <div className="w-full max-w-md bg-[#2d2d2d] p-8 rounded-xl border border-[#404040] shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-4xl font-black text-white tracking-tighter">PB</span>
            <Sparkles className="w-6 h-6 text-[#fbbf24] fill-[#fbbf24]" />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">painel administrativo</span>
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
                }
              }
            },
            className: {
              container: 'auth-container',
              button: 'auth-button',
              input: 'auth-input',
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entre',
              },
              sign_up: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Cadastrar',
                loading_button_label: 'Cadastrando...',
                link_text: 'Não tem uma conta? Cadastre-se',
              },
              forgotten_password: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Recuperar senha',
                link_text: 'Esqueceu sua senha?',
              }
            }
          }}
          theme="dark"
          providers={[]}
        />
      </div>
      
      <p className="mt-8 text-gray-500 text-xs uppercase tracking-widest">
        PB Imports · Acesso Restrito
      </p>
    </div>
  );
}
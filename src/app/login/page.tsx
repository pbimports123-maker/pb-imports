"use client";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Lock } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8EF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: '#C28266' }}></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#FAF8EF' }}
    >
      {/* Grade sutil de fundo */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');

        /* Sobrescreve o Auth UI do Supabase para o tema claro */
        #auth-sign-in .supabase-auth-ui_ui-container,
        .supabase-auth-ui_ui-container {
          gap: 12px !important;
        }
        .supabase-auth-ui_ui-label {
          color: #6B5C52 !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }
        .supabase-auth-ui_ui-input {
          background: #FAF8EF !important;
          border: 1px solid rgba(194,130,102,0.3) !important;
          border-radius: 8px !important;
          color: #0D0F13 !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 15px !important;
          padding: 10px 14px !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .supabase-auth-ui_ui-input:focus {
          border-color: #C28266 !important;
          box-shadow: 0 0 0 3px rgba(194,130,102,0.15) !important;
          outline: none !important;
        }
        .supabase-auth-ui_ui-button {
          background: #C28266 !important;
          border: none !important;
          border-radius: 8px !important;
          color: #fff !important;
          font-family: 'Raleway', sans-serif !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px !important;
          padding: 12px !important;
          transition: background 0.2s, transform 0.1s !important;
          cursor: pointer !important;
        }
        .supabase-auth-ui_ui-button:hover {
          background: #9E6650 !important;
          transform: translateY(-1px) !important;
        }
        .supabase-auth-ui_ui-button:active {
          transform: translateY(0) !important;
        }
        .supabase-auth-ui_ui-message {
          color: #C0614F !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 13px !important;
        }
      `}</style>

      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(194,130,102,0.2)',
          boxShadow: '0 8px 40px rgba(194,130,102,0.12)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center mb-3"
            style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #C28266, #9E6650)',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          >
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff' }}>PB</span>
          </div>
          <h1 style={{ fontFamily: 'Raleway, sans-serif', fontSize: 20, fontWeight: 700, color: '#9E6650', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            PB Imports
          </h1>
          <div className="flex items-center gap-2" style={{ color: '#A8978E' }}>
            <Lock size={12} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
              Acesso Restrito
            </span>
          </div>
        </div>

        {/* Aviso */}
        <div
          className="mb-6 p-4 rounded-lg text-center"
          style={{
            background: 'rgba(194,130,102,0.08)',
            border: '1px solid rgba(194,130,102,0.2)',
          }}
        >
          <p style={{ fontSize: 13, color: '#9E6650', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
            O cadastro público está desativado.<br />
            Entre com suas credenciais de administrador.
          </p>
        </div>

        <Auth
          supabaseClient={supabase}
          view="sign_in"
          showLinks={false}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#C28266',
                  brandAccent: '#9E6650',
                  inputBackground: '#FAF8EF',
                  inputText: '#0D0F13',
                  inputPlaceholder: '#B0A090',
                  inputBorder: 'rgba(194,130,102,0.3)',
                  inputBorderFocus: '#C28266',
                  inputBorderHover: '#C28266',
                  defaultButtonBackground: '#EDE8DA',
                  defaultButtonBackgroundHover: '#D8D0BC',
                  defaultButtonBorder: 'rgba(194,130,102,0.2)',
                  defaultButtonText: '#6B5C52',
                  dividerBackground: 'rgba(194,130,102,0.15)',
                  messageText: '#C0614F',
                  messageTextDanger: '#C0614F',
                  anchorTextColor: '#C28266',
                  anchorTextHoverColor: '#9E6650',
                }
              }
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Entrar no Painel',
                loading_button_label: 'Autenticando...',
              }
            }
          }}
          providers={[]}
        />
      </div>

      <p className="mt-8 text-xs uppercase tracking-widest" style={{ color: '#B0A090', fontFamily: 'DM Sans, sans-serif' }}>
        PB Imports · Sistema de Gestão Interna
      </p>
    </div>
  );
}
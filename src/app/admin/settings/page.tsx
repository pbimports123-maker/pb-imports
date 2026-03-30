"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Store, 
  User, 
  Shield, 
  Save, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Instagram 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    id: "",
    store_name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    instagram_url: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setStoreSettings(data);
    } catch (error: any) {
      toast.error("Erro ao carregar configurações: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveStore() {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          ...storeSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Configurações da loja atualizadas!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#1e3a5f]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie as informações da sua loja e acessos.</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="store" className="gap-2">
            <Store size={16} />
            Dados da Loja
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <User size={16} />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield size={16} />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Perfil da Loja</CardTitle>
              <CardDescription>Estas informações aparecem no rodapé e páginas de contato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Nome da Loja</Label>
                  <Input 
                    id="store_name" 
                    value={storeSettings.store_name} 
                    onChange={(e) => setStoreSettings({...storeSettings, store_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail de Contato</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input 
                      id="email" 
                      className="pl-10"
                      value={storeSettings.contact_email} 
                      onChange={(e) => setStoreSettings({...storeSettings, contact_email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input 
                      id="phone" 
                      className="pl-10"
                      value={storeSettings.contact_phone} 
                      onChange={(e) => setStoreSettings({...storeSettings, contact_phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram (URL)</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input 
                      id="instagram" 
                      className="pl-10"
                      placeholder="https://instagram.com/sualoja"
                      value={storeSettings.instagram_url} 
                      onChange={(e) => setStoreSettings({...storeSettings, instagram_url: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Físico (Opcional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input 
                    id="address" 
                    className="pl-10"
                    value={storeSettings.address} 
                    onChange={(e) => setStoreSettings({...storeSettings, address: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveStore} 
                  disabled={saving}
                  className="bg-[#1e3a5f] hover:bg-[#162a45] gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Controle quem tem acesso ao painel administrativo.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                <User className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="font-medium text-gray-900">Módulo de Usuários</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                  A gestão de múltiplos administradores requer configuração de convites por e-mail.
                </p>
                <Button variant="outline" className="mt-4" disabled>
                  Convidar Novo Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Altere sua senha e gerencie sessões ativas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <Shield className="text-amber-600 shrink-0" size={20} />
                <p className="text-sm text-amber-800">
                  Para sua segurança, alterações de senha devem ser feitas através do fluxo de "Esqueci minha senha" na tela de login.
                </p>
              </div>
              <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                Encerrar todas as sessões
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
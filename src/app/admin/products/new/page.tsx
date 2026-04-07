"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ChevronLeft, 
  Save, 
  X, 
  Upload,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  brand: z.string().min(2, "Marca Ã© obrigatÃ³ria"),
  category_id: z.string().min(1, "Selecione uma categoria"),
  price: z.coerce.number().nonnegative("Preco invalido"),
  stock: z.coerce.number().int("Estoque deve ser inteiro").nonnegative("Estoque invalido"),
  description: z.string().optional(),
  image_url: z.string().url("URL de imagem invÃ¡lida").or(z.literal("")),
  active_ingredient: z.string().optional(),
  usage_mode: z.string().optional(),
  contraindications: z.string().optional(),
});

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "",
      category_id: "",
      price: 0,
      stock: 0,
      description: "",
      image_url: "",
      active_ingredient: "",
      usage_mode: "",
      contraindications: "",
    },
  });

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('name');
      setCategories(data || []);
    }
    fetchCategories();
  }, []);

  async function onSubmit(values: z.infer<typeof productSchema>) {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .insert([{
          ...values,
          is_out_of_stock: values.stock <= 0
        }]);

      if (error) throw error;

      toast.success("Produto cadastrado com sucesso!");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error("Erro ao cadastrar: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ChevronLeft size={24} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
            <p className="text-sm text-gray-500">Preencha as informaÃ§Ãµes para adicionar ao catÃ¡logo.</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* InformaÃ§Ãµes BÃ¡sicas */}
            <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Info size={18} className="text-[#1e3a5f]" />
                InformaÃ§Ãµes BÃ¡sicas
              </h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: iPhone 15 Pro Max" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca / Fabricante</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apple" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PreÃ§o (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Inicial</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Detalhes e Imagem */}
            <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Upload size={18} className="text-[#1e3a5f]" />
                MÃ­dia e Detalhes
              </h3>

              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                    </FormControl>
                    <FormDescription>Insira o link direto da imagem do produto.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DescriÃ§Ã£o Curta</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Breve resumo do produto..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active_ingredient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PrincÃ­pio Ativo (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Paracetamol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/admin/products">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#162a45] min-w-[150px]" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Produto"}
              <Save size={18} className="ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}


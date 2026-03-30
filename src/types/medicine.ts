export interface Medicine {
  id: string;
  nome: string;
  principioAtivo: string;
  categoria: string;
  preco: number;
  estoque: number;
  imagem: string;
  descricao: string;
  modoUso: string;
  contraindicacoes: string;
  rating: number;
  criadoEm: string;
}

export interface CartItem extends Medicine {
  quantidade: number;
}
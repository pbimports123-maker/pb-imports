"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine, CartItem } from '@/types/medicine';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addToCart: (medicine: Medicine, quantity: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('pharma-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Erro ao carregar carrinho", e);
      }
    }
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem('pharma-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (medicine: Medicine, quantity: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === medicine.id);
      if (existing) {
        toast.success(`Quantidade de ${medicine.nome} atualizada!`);
        return prev.map(i => i.id === medicine.id 
          ? { ...i, quantidade: i.quantidade + quantity } 
          : i
        );
      }
      toast.success(`${medicine.nome} adicionado ao carrinho!`);
      return [...prev, { ...medicine, quantidade: quantity }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.info("Item removido do carrinho");
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantidade: quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    toast.info("Carrinho esvaziado");
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantidade, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de um CartProvider");
  return context;
};
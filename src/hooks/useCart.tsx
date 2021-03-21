import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: productStock } = await api.get(`stock/${productId}`);

      if(productStock.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque');

        return;
      }

      let productExists = cart.findIndex((product) => product.id === productId);
      
      if (productExists === -1) {
        const { data: product } = await api.get(`products/${productId}`);

        const newCartItem = [
          ...cart,
          {
            ...product,
            amount: 1
          }
        ];

        setCart(newCartItem);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartItem))
      } else {
        const updatedCartItem = cart.map((product) => {
          if(product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1
            }
          }

          return product;
        })

        setCart(updatedCartItem)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCartItem))
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: productStock } = await api.get(`stock/${productId}`);

      if(amount <= 0) return;

      if(productStock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');

        return;
      }

      const updatedCartItem = cart.map((product) => {
        if(product.id === productId) {
          return {
            ...product,
            amount
          }
        }

        return product;
      })

      setCart(updatedCartItem)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCartItem))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

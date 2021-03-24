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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const findProduct = cart.find((product) => product.id === productId);

      if (findProduct) {
        const existStock = await api.get(`/stock/${productId}`);

        if (existStock.data.amount === findProduct.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        const newCart = cart.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1
            }
          }

          return product
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      } else {
        const product = await api.get(`/products/${productId}`).then(response => response.data);
        const newProduct = [...cart, { ...product, amount: 1 }]

        setCart(newProduct);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProduct));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const existProduct = cart.find((product) => product.id === productId);

      if (existProduct) {
        const newCart = cart.filter((product) => product.id !== productId);

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        return
      }

      toast.error('Erro na remoção do produto');
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const existStock = await api.get(`/stock/${productId}`);

      if (amount < 1 || amount > existStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount
          }
        }
        return product
      });

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
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

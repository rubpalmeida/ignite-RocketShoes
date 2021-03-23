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
    // const storagedCart = Buscar dados do localStorage
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const productInCart = cart.find(product => product.id === productId)

      if (!productInCart) {
        const { data: product } = await api.get<Product>(`products/${productId}`)
        const { data: stock } = await api.get<Stock>(`stock/${productId}`)

        if (stock.amount > 0) {
          setCart([...cart, { ...product, amount: 1 }])

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(
            [...cart, { ...product, amount: 1 }]
          ))
          toast('Produto Adicionado com Sucesso')
          return;
        }
      }

      if (productInCart) {
        const { data: stock } = await api.get<Stock>(`stock/${productId}`)

        if (stock.amount > productInCart.amount) {
          const updatedCart = cart.map(cartItem => cartItem.id === productId
            ? { ...cartItem, amount: Number(cartItem.amount) + 1 }
            : cartItem)

          setCart(updatedCart);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
          return;
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const isProductInCart = cart.some(cartItem => cartItem.id === productId);



      if (isProductInCart) {
        const updatedCart = cart.filter(cartItem => cartItem.id !== productId)

        setCart(updatedCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      // console.log(amount)
      if (amount <= 0) {
        toast.error('Erro na alteração de quantidade do produto')
        return;
      }
      const { data: stock } = await api.get<Stock>(`stock/${productId}`)
      const currentProductStock = stock.amount - amount


      if (currentProductStock < 0) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }
      const productExists = cart.some(cartItem => cartItem.id === productId)

      if (productExists) {
        const updatedCart = cart.map(cartItem => cartItem.id === productId
          ? { ...cartItem, amount: amount }
          : cartItem)

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

      } else {

        toast.error('Erro na alteração de quantidade do produto')
        return;

      }


    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto')
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

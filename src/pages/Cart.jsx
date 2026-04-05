import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { useStore } from '../context/StoreContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useStore();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-6 text-zinc-800">Your Cart is Empty</h1>
        <p className="text-zinc-500 mb-12">Looks like you haven't added anything yet.</p>
        <Link 
          to="/shop" 
          className="py-4 px-8 bg-zinc-50 text-zinc-950 font-bold tracking-widest uppercase hover:bg-emerald-400 transition-colors"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-16">
        Your Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence initial={false}>
            {cart.map((item) => (
              <motion.div 
                key={`${item.product.id}-${item.size || 'default'}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="flex gap-6 p-6 border border-zinc-900 rounded-sm bg-zinc-950/50 relative group"
              >
                <Link to={`/product/${item.product.id}`} className="w-24 h-32 md:w-32 md:h-40 shrink-0 bg-zinc-900 overflow-hidden">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </Link>
                
                <div className="flex flex-col grow justify-between py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-1">{item.product.category}</p>
                      <h3 className="text-xl md:text-2xl font-bold">{item.product.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Size: {item.size || 'One size'}</p>
                    </div>
                    <p className="text-xl font-light">${item.product.price * item.quantity}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <div className="flex items-center gap-4 bg-zinc-900 rounded-full px-4 py-2 w-max">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size)}
                        className="text-zinc-400 hover:text-zinc-50 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size)}
                        className="text-zinc-400 hover:text-zinc-50 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.product.id, item.size)}
                      className="text-zinc-500 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 p-8 border border-zinc-900 rounded-sm bg-zinc-950/80 backdrop-blur-md">
            <h2 className="text-2xl font-bold uppercase tracking-widest mb-8">Summary</h2>
            
            <div className="space-y-4 text-sm font-medium mb-8">
              <div className="flex justify-between">
                <span className="text-zinc-400">Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-zinc-800 text-xl font-bold">
                <span>Total</span>
                <span className="text-emerald-400">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full py-5 flex items-center justify-center gap-3 bg-zinc-50 text-zinc-950 font-bold tracking-widest uppercase hover:bg-emerald-400 transition-colors group"
            >
              Checkout
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
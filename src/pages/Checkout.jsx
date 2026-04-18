import { useState } from 'react';
import { useNavigate } from 'react-router';
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { CheckCircle, Loader2 } from 'lucide-react';

export const Checkout = () => {
  const { cart, cartTotal, placeOrder } = useStore();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (cart.length === 0 && !completed) {
    navigate('/cart');
    return null;
  }

  const handleCheckout = (e) => {
    e.preventDefault();
    setProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const id = placeOrder();
      setOrderId(id);
      setProcessing(false);
      setCompleted(true);
    }, 2000);
  };

  if (completed) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-emerald-500 mb-8"
        >
          <CheckCircle size={80} />
        </motion.div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-6">Order Placed</h1>
        <p className="text-xl font-light text-zinc-400 mb-2">Order #{orderId}</p>
        <p className="text-zinc-500 mb-12 max-w-md">Your order has been confirmed. You will receive an email shortly.</p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <button 
            onClick={() => navigate('/tracking')}
            className="py-4 px-8 bg-zinc-50 text-zinc-950 font-bold tracking-widest uppercase hover:bg-emerald-400 transition-colors"
          >
            Track Order
          </button>
          <button 
            onClick={() => navigate('/shop')}
            className="py-4 px-8 border border-zinc-800 text-zinc-50 font-bold tracking-widest uppercase hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-12">Checkout</h1>
        
        <form onSubmit={handleCheckout} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-6">Contact Info</h2>
            <input required type="email" placeholder="Email Address" className="w-full bg-zinc-900 border border-zinc-800 p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50" />
            <div className="grid grid-cols-2 gap-4">
              <input required type="text" placeholder="First Name" className="w-full bg-zinc-900 border border-zinc-800 p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50" />
              <input required type="text" placeholder="Last Name" className="w-full bg-zinc-900 border border-zinc-800 p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50" />
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-zinc-900">
            <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-6">Shipping</h2>
            <input required type="text" placeholder="Address" className="w-full bg-zinc-900 border border-zinc-800 p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50" />
            <input required type="text" placeholder="City" className="w-full bg-zinc-900 border border-zinc-800 p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50" />
            <div className="grid grid-cols-2 gap-4">
              <input required type="text" placeholder="State/Province" className="w-full bg-zinc-900 border border-zinc-800 p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50" />
              <input required type="text" placeholder="Postal Code" className="w-full bg-zinc-900 border border-zinc-800 p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={processing}
            className="w-full mt-12 py-5 bg-zinc-50 text-zinc-950 font-bold tracking-widest uppercase hover:bg-emerald-400 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              `Pay $${cartTotal.toFixed(2)}`
            )}
          </button>
        </form>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-8 h-max">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-8">Order Summary</h2>
        <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto hide-scrollbar">
          {cart.map(item => (
            <div key={`${item.product.id}-${item.size || 'default'}`} className="border border-zinc-800 rounded p-3 bg-zinc-950/50">
              <div className="flex gap-4 mb-3">
                <div className="w-16 h-20 bg-zinc-950 rounded-sm overflow-hidden shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="grow flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm uppercase tracking-wider">{item.product.name}</h3>
                    <p className="font-medium">${(item.itemPrice || item.product.price) * item.quantity}</p>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1">Qty: {item.quantity} • Size: {item.size || 'One size'}</p>
                </div>
              </div>
              {item.layoutImage && (
                <div className="pt-3 border-t border-zinc-700">
                  <p className="text-xs text-emerald-400 mb-2 font-semibold">✓ Layout Uploaded</p>
                  <img src={item.layoutImage} alt="Layout" className="w-full h-auto max-h-24 object-contain rounded" />
                </div>
              )}
              {!item.layoutImage && (
                <div className="pt-3 border-t border-zinc-700">
                  <p className="text-xs text-amber-500">⚠ No layout uploaded yet</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-zinc-800 flex justify-between items-center text-xl font-bold">
          <span className="uppercase tracking-widest">Total</span>
          <span className="text-emerald-400">${cartTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { ArrowLeft, Check } from 'lucide-react';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById } = useStore();
  const product = getProductById(id);
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl mb-4">Product unavailable.</h2>
        <p className="text-zinc-500 mb-6 text-center max-w-md">
          This item was removed from the shop by an administrator or is no longer available.
        </p>
        <Link to="/shop" className="text-emerald-500 hover:underline">Return to Shop</Link>
      </div>
    );
  }

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="px-6 md:px-12 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm uppercase tracking-widest text-zinc-500 hover:text-zinc-50 mb-12 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        {/* Product Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="aspect-4/5 bg-zinc-900 rounded-sm overflow-hidden"
        >
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center"
        >
          <p className="text-emerald-500 text-sm font-bold tracking-widest uppercase mb-4">
            {product.category}
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-6">
            {product.name}
          </h1>
          <p className="text-3xl font-light mb-12">${product.price}</p>
          
          <p className="text-lg text-zinc-400 font-light leading-relaxed mb-12">
            {product.description}
          </p>

          <div className="space-y-6">
            <button 
              onClick={handleAdd}
              disabled={added}
              className={`w-full py-5 px-8 flex items-center justify-center gap-3 text-lg font-bold tracking-widest uppercase transition-all duration-300 ${
                added 
                  ? 'bg-zinc-800 text-emerald-400 cursor-default' 
                  : 'bg-zinc-50 text-zinc-950 hover:bg-emerald-400 hover:text-zinc-950'
              }`}
            >
              {added ? (
                <>
                  <Check size={24} />
                  Added to Cart
                </>
              ) : (
                'Add to Cart'
              )}
            </button>
            <Link 
              to="/cart"
              className="w-full py-5 px-8 flex items-center justify-center border border-zinc-800 hover:border-zinc-50 text-lg font-bold tracking-widest uppercase transition-colors"
            >
              Go to Cart
            </Link>
          </div>

          {/* Dummy specs */}
          <div className="mt-16 pt-12 border-t border-zinc-900 grid grid-cols-2 gap-8 text-sm uppercase tracking-widest text-zinc-500">
            <div>
              <p className="text-zinc-50 mb-2 font-bold">Materials</p>
              <p>Machined Aluminum<br/>Matte Finish</p>
            </div>
            <div>
              <p className="text-zinc-50 mb-2 font-bold">Dimensions</p>
              <p>H: 45cm<br/>W: 20cm<br/>D: 20cm</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
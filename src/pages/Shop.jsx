import React, { useMemo, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { useStore } from '../context/StoreContext';

export const Shop = () => {
  const { activeProducts } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(activeProducts.map((product) => product.category).filter(Boolean))];
    return ['All', ...uniqueCategories.sort((a, b) => a.localeCompare(b))];
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') {
      return activeProducts;
    }
    return activeProducts.filter((product) => product.category === selectedCategory);
  }, [activeProducts, selectedCategory]);

  return (
    <div className="px-3 sm:px-6 md:px-12 py-8 sm:py-12">
      <header className="mb-8 sm:mb-12 md:mb-20">
        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold tracking-tighter uppercase mb-4 sm:mb-6">
          The Collection
        </h1>
        <div className="flex gap-2 sm:gap-4 text-[10px] sm:text-xs md:text-sm tracking-widest uppercase overflow-x-auto pb-4 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full border transition-colors whitespace-nowrap text-[10px] sm:text-sm ${
                selectedCategory === cat
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-zinc-800 hover:border-emerald-500 hover:text-emerald-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {activeProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 p-12 text-center text-zinc-400">
          The catalog is empty right now. Add items from the admin dashboard to repopulate the shop.
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 p-12 text-center text-zinc-400">
          No products found for {selectedCategory}.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
          {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to={`/product/${product.id}`} className="group block">
              <div className="aspect-3/4 overflow-hidden rounded-lg sm:rounded-2xl bg-zinc-900 mb-2 sm:mb-4 lg:mb-6 relative">
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 sm:gap-2">
                <h3 className="text-xs sm:text-base lg:text-lg font-bold group-hover:text-emerald-400 transition-colors line-clamp-1">{product.name}</h3>
                <p className="text-[8px] sm:text-xs text-zinc-500 uppercase tracking-widest hidden sm:block">{product.category}</p>
                <p className="text-xs sm:text-base lg:text-lg font-medium">₱{product.price}</p>
              </div>
            </Link>
          </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
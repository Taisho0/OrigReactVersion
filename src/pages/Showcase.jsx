import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const API_ORIGIN = '';

export const SHOWCASE_CATEGORIES = [
  'Tarpaulin',
  'Sticker',
  'Sticker on Sintra',
  'Direct to film(DTF)',
  'Tshirt with print',
  'Totebag with print',
  'Hoodie with print',
  'Calling cards',
];

export const Showcase = () => {
  const [showcaseItems, setShowcaseItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(SHOWCASE_CATEGORIES[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        const q = `${API_ORIGIN}/api/showcase`;
        const resp = await fetch(q, { signal: controller.signal });
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body?.message || `Request failed with status ${resp.status}`);
        }
        const body = await resp.json();
        if (!mounted) return;
        const allItems = Array.isArray(body.items) ? body.items : [];
        setShowcaseItems(allItems.filter((item) => item.category === selectedCategory));
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error loading showcase items:', err);
        if (mounted) setError(err?.message || 'Unable to load showcase items.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchItems();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [selectedCategory]);

  return (
    <div className="px-3 sm:px-6 md:px-12 py-6 sm:py-12 max-w-7xl mx-auto">
      <div className="mb-8 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-2 sm:mb-4">
          Showcase
        </h1>
        <p className="text-zinc-400 text-xs sm:text-lg">Explore our previous works and projects across various product categories.</p>
      </div>

      {/* Category Filter */}
      <div className="mb-8 sm:mb-12">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-emerald-500 mb-2 sm:mb-4">Filter by category</p>
        <div className="flex flex-wrap gap-1.5 sm:gap-3">
          {SHOWCASE_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-2 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold uppercase tracking-widest transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-emerald-400 text-slate-950'
                  : 'border border-white/10 text-zinc-300 hover:border-emerald-400 hover:text-emerald-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div>
        {loading ? (
          <div className="text-center py-16 text-zinc-500">Loading showcase items...</div>
        ) : showcaseItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-zinc-500">
            <p>No showcase items available for {selectedCategory} yet.</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:gap-4 lg:gap-6 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
            {showcaseItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="group overflow-hidden rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 hover:border-emerald-400 transition-all"
              >
                <div className="aspect-square overflow-hidden bg-zinc-900 relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title || item.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-2 sm:p-4 lg:p-5 space-y-1 sm:space-y-2 lg:space-y-3">
                  <div>
                    <p className="text-[8px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-emerald-400 mb-0.5 sm:mb-1">{item.category}</p>
                    {item.title && <h3 className="text-xs sm:text-base lg:text-lg font-semibold text-zinc-50 line-clamp-1">{item.title}</h3>}
                  </div>
                  {item.description && (
                    <p className="text-[8px] sm:text-xs lg:text-sm text-zinc-400 line-clamp-2 hidden sm:block">{item.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Back to shop */}
      <div className="mt-8 sm:mt-16 text-center">
        <Link
          to="/shop"
          className="inline-block py-3 sm:py-4 px-6 sm:px-8 border border-zinc-800 text-zinc-50 font-bold tracking-widest uppercase text-xs sm:text-base hover:border-emerald-500 hover:text-emerald-400 transition-colors"
        >
          Back to Shop
        </Link>
      </div>
    </div>
  );
};

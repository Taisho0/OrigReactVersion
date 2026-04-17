// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Home = () => {
  const { activeProducts } = useStore();
  const featuredProducts = activeProducts.slice(0, 6);
  const marqueeProducts = [...featuredProducts, ...featuredProducts];

  return (
    <div className="relative bg-zinc-950">
      {/* Hero Section */}
      <section className="h-[90vh] flex flex-col justify-center px-6 md:px-12 relative overflow-hidden pt-24">
        <motion.div className="z-10 relative">
          <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter uppercase leading-[0.85] text-zinc-50">
            Design <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-500">
              Forward.
            </span>
          </h1>
          <p className="mt-8 text-xl text-zinc-400 max-w-xl font-light leading-relaxed">
            Curated objects for the modern minimalist. Elevate your space with functional art.
          </p>
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-3 mt-12 text-sm font-bold tracking-widest uppercase pb-2 border-b-2 border-emerald-500 hover:text-emerald-400 transition-colors group"
          >
            Explore Collection
            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </motion.div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -right-1/4 w-200 h-200 bg-emerald-500 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 left-1/4 w-150 h-150 bg-cyan-500 rounded-full blur-[150px]" />
        </div>
      </section>

      {/* Featured Horizontal Scroller */}
      <section className="py-32 overflow-hidden bg-zinc-900 border-y border-zinc-800">
        <div className="px-6 md:px-12 mb-16 flex justify-between items-end">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase">Featured Objects</h2>
          <Link to="/shop" className="text-sm tracking-widest uppercase hover:text-emerald-400">View All</Link>
        </div>

        {featuredProducts.length > 0 && (
          <div className="featured-marquee-mask">
            <div className="featured-marquee-track">
              {marqueeProducts.map((product, index) => (
                <Link
                  key={`${product.id}-${index}`}
                  to={`/product/${product.id}`}
                  className="group block relative w-75 md:w-112.5 aspect-4/5 overflow-hidden rounded-sm bg-zinc-800 shrink-0"
                >
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-xs tracking-widest text-emerald-400 mb-2 uppercase">{product.category}</p>
                    <h3 className="text-2xl font-bold">{product.name}</h3>
                    <p className="text-lg text-zinc-300 mt-2">₱{product.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Philosophy Section */}
      <section className="py-32 px-6 md:px-12 max-w-6xl mx-auto text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-3xl md:text-5xl font-bold tracking-tight leading-tight"
        >
          We believe in the power of less. Every item in our collection is rigorously selected for its uncompromising design and enduring quality.
        </motion.h2>
      </section>
    </div>
  );
};
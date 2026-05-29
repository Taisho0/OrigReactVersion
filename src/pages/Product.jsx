import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { useUserAuth } from '../auth/AuthContext';
import { ArrowLeft, Check } from 'lucide-react';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useUserAuth();
  const { getProductById } = useStore();
  const product = getProductById(id);
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState('');
  const [inputMessages, setInputMessages] = useState({});
  const [selectedVariant, setSelectedVariant] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setWidth('');
    setLength('');
    setQuantity('');
    setSelectedVariant(Array.isArray(product.variants) && product.variants.length > 0 ? product.variants[0] : '');
  }, [product]);

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

  const calculateSqMeter = () => {
    if (width && length) {
      return (parseFloat(width) * parseFloat(length)).toFixed(2);
    }
    return '0';
  };

  const calculatePrice = () => {
    if (!product.price) {
      return '0';
    }

    if (!product.requiresDimensions) {
      return Number(product.price).toFixed(2);
    }

    if (!width || !length) {
      return '0';
    }

    const w = parseFloat(width);
    const h = parseFloat(length);
    const area = w * h;
    const price = (area * product.price).toFixed(2);
    return price;
  };

  const productMaterials = Array.isArray(product.materials) && product.materials.length > 0
    ? product.materials
    : ['Material details unavailable'];
  const productVariants = Array.isArray(product.variants) && product.variants.length > 0
    ? product.variants
    : [];
  const parsedQuantity = Number.parseInt(quantity, 10);
  const isValidQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0;

  const handleAdd = () => {
    if (!session) {
      alert('Please sign in first to add this item to your cart.');
      navigate('/signin');
      return;
    }

    if (product.requiresDimensions && (!width || !length)) {
      alert('Please enter both width and length');
      return;
    }

    if (!isValidQuantity) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (parsedQuantity > 1000) {
      alert('Maximum quantity per item is 1000.');
      return;
    }

    const sqMeter = calculateSqMeter();
    const calculatedPrice = parseFloat(calculatePrice());
    const variantSuffix = selectedVariant ? ` • ${selectedVariant}` : '';
    const selectedSize = product.requiresDimensions
      ? `${width}${product.dimensionUnit || 'm'} × ${length}${product.dimensionUnit || 'm'} (${sqMeter} ${product.pricingUnit || 'sq.m'})${variantSuffix}`
      : `Standard (${product.pricingUnit || 'each'})${variantSuffix}`;

    const success = addToCart({ 
      ...product, 
      price: calculatedPrice,
      orderQuantity: parsedQuantity,
      selectedSize,
      basePrice: product.price,
      area: product.requiresDimensions ? parseFloat(sqMeter) : 1,
    });

    if (!success) {
      alert('Please sign in first to add this item to your cart.');
      navigate('/signin');
      return;
    }

    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <div className="px-3 py-4 sm:px-6 sm:py-8 md:px-12 md:py-12">
      <button 
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-[10px] sm:text-sm uppercase tracking-widest text-zinc-300 hover:text-zinc-50 transition-colors sm:mb-8 md:mb-12"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-2 lg:gap-24 items-start lg:items-center">
        {/* Product Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="aspect-4/3 sm:aspect-4/5 lg:aspect-square bg-zinc-900 rounded-sm overflow-hidden"
        >
          <img src={product.image} alt={product.name} className="w-full h-full object-contain sm:object-cover object-center" />
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center space-y-4 sm:space-y-6 lg:space-y-0"
        >
          <p className="text-emerald-500 text-[9px] sm:text-sm font-bold tracking-widest uppercase mb-1.5 sm:mb-4">
            {product.category}
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-7xl font-bold tracking-tighter uppercase mb-2.5 sm:mb-6 leading-[0.92]">
            {product.name}
          </h1>
          <div className="mb-5 sm:mb-12">
            <p className="text-[10px] sm:text-sm text-yellow-300 font-bold mb-1 sm:mb-2">Price per {product.pricingUnit || 'unit'}</p>
            <p className="text-xl sm:text-3xl font-light">₱{product.price}</p>
          </div>
          
          <div className="mb-5 sm:mb-12">
            <p className="text-[10px] sm:text-sm font-semibold uppercase tracking-widest text-zinc-50 mb-1.5 sm:mb-3">Description</p>
            <p className="text-xs sm:text-lg text-zinc-50 font-light leading-relaxed">
              {product.description}
            </p>
          </div>

          {productVariants.length > 0 && (
            <div className="mb-5 sm:mb-12">
              <p className="text-[10px] sm:text-sm font-semibold uppercase tracking-widest text-zinc-300 mb-1.5 sm:mb-3">Variants</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {productVariants.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-full border px-2 py-1 text-[9px] sm:text-xs font-semibold uppercase tracking-widest transition-colors ${
                      selectedVariant === variant
                        ? 'border-emerald-400 bg-emerald-400 text-zinc-950'
                        : 'border-white/15 bg-white/5 text-zinc-200 hover:border-emerald-300'
                    }`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 sm:mb-8 space-y-2.5 sm:space-y-4">
            <p className="text-[10px] sm:text-sm font-semibold uppercase tracking-widest text-zinc-50">Custom Size</p>
            {product.requiresDimensions ? (
              <>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] sm:text-xs font-medium text-zinc-50">Width ({product.dimensionUnit || 'm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={width}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d*\.?\d*$/.test(v)) {
                          if (v !== '') {
                            const parsed = parseFloat(v);
                            if (!Number.isNaN(parsed)) {
                              if (parsed > 100) {
                                setInputMessages((prev) => ({ ...prev, width: 'Maximum is 100' }));
                                setTimeout(() => setInputMessages((prev) => { const c = { ...prev }; if (c.width === 'Maximum is 100') delete c.width; return c; }), 2500);
                              }
                              setWidth(String(Math.min(parsed, 100)));
                            } else {
                              setWidth('');
                            }
                          } else {
                            setWidth(v);
                          }
                        }
                      }}
                      placeholder="e.g. 2"
                      className="quantity-input-no-spinner w-full rounded-2xl border border-zinc-800 bg-white/5 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 sm:px-4 sm:py-3 sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] sm:text-xs font-medium text-zinc-50">Height ({product.dimensionUnit || 'm'})</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={length}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d*\.?\d*$/.test(v)) {
                          if (v !== '') {
                            const parsed = parseFloat(v);
                            if (!Number.isNaN(parsed)) {
                              if (parsed > 100) {
                                setInputMessages((prev) => ({ ...prev, length: 'Maximum is 100' }));
                                setTimeout(() => setInputMessages((prev) => { const c = { ...prev }; if (c.length === 'Maximum is 100') delete c.length; return c; }), 2500);
                              }
                              setLength(String(Math.min(parsed, 100)));
                            } else {
                              setLength('');
                            }
                          } else {
                            setLength(v);
                          }
                        }
                      }}
                      placeholder="e.g. 3"
                      className="quantity-input-no-spinner w-full rounded-2xl border border-zinc-800 bg-white/5 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 sm:px-4 sm:py-3 sm:text-base"
                    />
                  </div>
                </div>
                {width && length && (
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 sm:px-4 sm:py-3">
                    <p className="text-[9px] sm:text-xs text-zinc-50 mb-1.5 sm:mb-2">Area: {width} × {length} = {calculateSqMeter()} {product.pricingUnit || 'sq.m'}</p>
                    <p className="text-[10px] sm:text-sm font-semibold text-emerald-300">
                      {width}{product.dimensionUnit || 'm'} × {length}{product.dimensionUnit || 'm'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-[10px] sm:text-sm font-semibold text-emerald-300">Fixed pricing item (no size input needed).</p>
              </div>
            )}
          </div>

          <div className="mb-4 sm:mb-8 space-y-2">
            <label className="block text-[10px] sm:text-sm font-semibold uppercase tracking-widest text-zinc-50">Quantity Per Order</label>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => {
                const nextValue = e.target.value;
                if (nextValue === '' || /^[0-9]+$/.test(nextValue)) {
                  // Clamp empty string or numeric input to <= 1000 when set
                  if (nextValue !== '') {
                    const parsed = Number.parseInt(nextValue, 10);
                    if (parsed > 1000) {
                      setInputMessages((prev) => ({ ...prev, quantity: 'Maximum is 1000' }));
                      setTimeout(() => setInputMessages((prev) => { const c = { ...prev }; if (c.quantity === 'Maximum is 1000') delete c.quantity; return c; }), 2500);
                    }
                    setQuantity(String(Math.max(1, Math.min(1000, parsed))));
                  } else {
                    setQuantity(nextValue);
                  }
                }
              }}
              className="quantity-input-no-spinner w-full rounded-2xl border border-zinc-800 bg-white/5 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 sm:px-4 sm:py-3 sm:text-base"
            />
            {(product.requiresDimensions ? width && length : true) && isValidQuantity && (
              <p className="text-xs sm:text-lg text-emerald-400 mt-2 sm:mt-3">
                Total: ₱{(parseFloat(calculatePrice()) * parsedQuantity).toFixed(2)}
              </p>
            )}
            {inputMessages.quantity && <p className="text-amber-400 text-[10px] sm:text-xs mt-1">{inputMessages.quantity}</p>}
          </div>

          <div className="space-y-3 sm:space-y-6">
            <button 
              onClick={handleAdd}
              disabled={added || !isValidQuantity}
              className={`w-full py-3 px-6 sm:py-5 sm:px-8 flex items-center justify-center gap-3 text-xs sm:text-lg font-bold tracking-widest uppercase transition-all duration-300 ${
                added 
                  ? 'bg-zinc-800 text-emerald-400 cursor-default' 
                  : !isValidQuantity
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                    : 'bg-zinc-50 text-zinc-950 hover:bg-emerald-400 hover:text-zinc-950'
              }`}
            >
              {added ? (
                <>
                  <Check size={18} className="sm:h-6 sm:w-6" />
                  Added to Cart
                </>
              ) : (
                'Add to Cart'
              )}
            </button>
            <Link 
              to="/cart"
              className="w-full py-3 px-6 sm:py-5 sm:px-8 flex items-center justify-center border border-zinc-800 hover:border-zinc-50 text-xs sm:text-lg font-bold tracking-widest uppercase transition-colors"
            >
              Go to Cart
            </Link>
          </div>

          {/* Product specs */}
          <div className="mt-8 sm:mt-16 pt-6 sm:pt-12 border-t border-zinc-900 grid grid-cols-2 gap-3 sm:gap-8 text-[9px] sm:text-sm uppercase tracking-widest text-zinc-500">
            <div>
              <p className="text-zinc-50 mb-1 sm:mb-2 font-bold">Materials</p>
              <p>
                {productMaterials.map((material, index) => (
                  <span key={`${material}-${index}`}>
                    {material}
                    <br />
                  </span>
                ))}
              </p>
            </div>
            <div>
              <p className="text-zinc-50 mb-1 sm:mb-2 font-bold">Dimensions</p>
              {width && length ? (
                <p>
                  W: {width}{product.dimensionUnit || 'm'}
                  <br />
                  H: {length}{product.dimensionUnit || 'm'}
                  <br />
                  AREA: {calculateSqMeter()} {product.pricingUnit || 'SQ.M'}
                </p>
              ) : (
                <p>{product.requiresDimensions ? 'Set width and height' : `Standard (${product.pricingUnit || 'each'})`}</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
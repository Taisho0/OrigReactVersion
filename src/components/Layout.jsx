import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router';
import { Menu, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useUserAuth } from '../auth/AuthContext';

export const Layout = () => {
  const { cart } = useStore();
  const { isAdmin, session, signOut } = useUserAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartOrderCount = cart.length;

  const handleSignOut = async () => {
    const result = await signOut();
    if (result?.success) {
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen text-zinc-50 font-sans selection:bg-emerald-500/30">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 md:px-12 pointer-events-none">
        <Link to="/" className="text-xl font-bold tracking-tighter uppercase pointer-events-auto">
          Originals Printing Co.
        </Link>
        
        {/* <Link to="/" className="pointer-events-auto" aria-label="Originals Printing Co. Home">
          <img
            src="/images/logo.png"
            alt="Originals Printing Co."
            className="h-8 w-auto md:h-10"
          />
        </Link> */}
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide pointer-events-auto">
          <Link to="/shop" className="hover:text-emerald-400 transition-colors">SHOP</Link>
          <Link to="/showcase" className="hover:text-emerald-400 transition-colors">SHOWCASE</Link>
          <Link to="/tracking" className="hover:text-emerald-400 transition-colors">TRACKING</Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-emerald-400 transition-colors">ADMIN</Link>
          )}
          <Link to="/cart" className="relative hover:text-emerald-400 transition-colors flex items-center gap-2">
            CART
            {cartOrderCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-zinc-950">
                {cartOrderCount}
              </span>
            )}
          </Link>
          {!session ? (
            <Link to="/signin" className="hover:text-emerald-400 transition-colors">
              SIGN IN
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              className="hover:text-emerald-400 transition-colors"
            >
              SIGN OUT
            </button>
          )}
        </div>

        <button 
          className="md:hidden pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-50 shadow-sm transition-colors hover:bg-white/10"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={18} />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-md flex flex-col pt-24 pb-12 px-6 pointer-events-auto overflow-y-auto sm:pt-20">
          <button 
            className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-950/80 hover:bg-zinc-900 transition-colors sm:top-6 sm:right-6 sm:h-10 sm:w-10"
            onClick={() => setIsMenuOpen(false)}
          >
            <X size={18} className="text-emerald-400 sm:size-6" />
          </button>
          
          <div className="flex flex-col gap-6 text-center">
            {/* Navigation Links */}
            <Link 
              to="/" 
              className="py-3 text-lg font-bold tracking-wide uppercase hover:text-emerald-400 transition-colors border-b border-zinc-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/shop" 
              className="py-3 text-lg font-bold tracking-wide uppercase hover:text-emerald-400 transition-colors border-b border-zinc-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop
            </Link>
            <Link 
              to="/showcase" 
              className="py-3 text-lg font-bold tracking-wide uppercase hover:text-emerald-400 transition-colors border-b border-zinc-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Showcase
            </Link>
            <Link 
              to="/tracking" 
              className="py-3 text-lg font-bold tracking-wide uppercase hover:text-emerald-400 transition-colors border-b border-zinc-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Tracking
            </Link>
            
            {/* Admin Link */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="py-3 text-lg font-bold tracking-wide uppercase hover:text-emerald-400 transition-colors border-b border-zinc-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            
            {/* Cart Link */}
            <Link 
              to="/cart" 
              className="py-3 text-lg font-bold tracking-wide uppercase hover:text-emerald-400 transition-colors border-b border-zinc-900 flex items-center justify-center gap-3"
              onClick={() => setIsMenuOpen(false)}
            >
              Cart
              {cartOrderCount > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-zinc-950">
                  {cartOrderCount}
                </span>
              )}
            </Link>

            {/* Auth Section */}
            <div className="mt-6 pt-6 border-t-2 border-zinc-800">
              {!session ? (
                <Link 
                  to="/signin" 
                  className="block py-3 px-6 text-lg font-bold tracking-wide uppercase bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3 px-6 text-lg font-bold tracking-wide uppercase bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors rounded-lg"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="pt-24 min-h-screen">
        <Outlet />
      </main>

      <footer className="py-12 px-6 md:px-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Originals Printing Co.</p>
        <div className="flex gap-6">
          <Link to="#" className="hover:text-zinc-300">Instagram</Link>
          <Link to="#" className="hover:text-zinc-300">Twitter</Link>
          <Link to="#" className="hover:text-zinc-300">Terms</Link>
        </div>
      </footer>
    </div>
  );
};
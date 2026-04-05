import { useMemo, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react';
import { ArchiveRestore, BarChart3, ShieldCheck, ShoppingBag, Users, UserRoundCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userAuth } from '../auth/AuthContext';
import { useStore } from '../context/StoreContext';

export default function Admin() {
  const { session, userProfile, users, signOut, suspendUser, deleteUser, restoreUser, setUserRole } = userAuth();
  const { activeProducts, archivedProducts, archiveProduct, restoreProduct, orders, cartTotal } = useStore();
  const [busyUserId, setBusyUserId] = useState('');
  const [busyProductId, setBusyProductId] = useState('');

  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.status === 'active').length;
    const suspendedUsers = users.filter((user) => user.status === 'suspended').length;
    const deletedUsers = users.filter((user) => user.status === 'deleted').length;
    const collaborators = users.filter((user) => user.role === 'collaborator' && user.status === 'active').length;
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const categoryTotals = activeProducts.reduce((accumulator, product) => {
      const next = { ...accumulator };
      next[product.category] = (next[product.category] || 0) + 1;
      return next;
    }, {});

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      deletedUsers,
      collaborators,
      revenue,
      categoryTotals,
    };
  }, [activeProducts, orders, users]);

  const handleProductAction = async (productId, action) => {
    setBusyProductId(productId);
    try {
      if (action === 'archive') {
        archiveProduct(productId);
      }

      if (action === 'restore') {
        restoreProduct(productId);
      }
    } finally {
      setBusyProductId('');
    }
  };

  const handleUserAction = async (userId, action) => {
    setBusyUserId(userId);
    try {
      if (action === 'suspend') {
        await suspendUser(userId);
      }

      if (action === 'delete') {
        await deleteUser(userId);
      }

      if (action === 'restore') {
        await restoreUser(userId);
      }

      if (action === 'collaborator') {
        await setUserRole(userId, 'collaborator');
      }

      if (action === 'customer') {
        await setUserRole(userId, 'customer');
      }
    } finally {
      setBusyUserId('');
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div
      className="min-h-screen text-zinc-50"
      style={{
        backgroundImage:
          'radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_35%),linear-gradient(180deg,#020617_0%,#020617_100%)',
      }}
    >
      <div className="border-b border-white/10 backdrop-blur-xl bg-slate-950/70 sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">Admin Control Center</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Operations dashboard</h1>
            <p className="mt-2 text-sm text-zinc-400">Signed in as {userProfile?.email || session.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/shop" className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-zinc-300 hover:border-emerald-400 hover:text-emerald-300 transition-colors">
              View shop
            </Link>
            <button onClick={() => signOut()} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-slate-950 hover:bg-emerald-300 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 md:px-10 py-10 space-y-10">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Users', value: metrics.totalUsers, icon: Users },
            { label: 'Collaborators', value: metrics.collaborators, icon: UserRoundCog },
            { label: 'Active products', value: activeProducts.length, icon: ShoppingBag },
            { label: 'Revenue', value: `$${metrics.revenue.toFixed(2)}`, icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">{item.label}</p>
                    <p className="mt-3 text-3xl font-black tracking-tight">{item.value}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">Catalog control</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">Shop inventory</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <ArchiveRestore size={16} />
                {archivedProducts.length} archived
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[...activeProducts.map((product) => ({ ...product, variant: 'active' })), ...archivedProducts.map((product) => ({ ...product, variant: 'archived' }))].map((product) => (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                >
                  <div className="aspect-4/3 overflow-hidden relative">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
                    <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${product.variant === 'active' ? 'bg-emerald-400 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
                      {product.variant === 'active' ? 'Live' : 'Archived'}
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">{product.category}</p>
                      <h3 className="mt-2 text-xl font-bold">{product.name}</h3>
                      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold text-emerald-300">${product.price}</p>
                      <button
                        onClick={() => handleProductAction(product.id, product.variant === 'active' ? 'archive' : 'restore')}
                        disabled={busyProductId === product.id}
                        className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-zinc-200 hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-60"
                      >
                        {product.variant === 'active' ? 'Remove from shop' : 'Restore'}
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">User control</p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">Account moderation</h2>
                </div>
                <ShieldCheck size={20} className="text-emerald-300" />
              </div>

              <div className="space-y-4 max-h-136 overflow-auto pr-1">
                {users.map((user) => (
                  <div key={user.uid} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{user.email || 'Unknown user'}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.35em] text-zinc-500">
                          {user.role} · {user.status}
                        </p>
                      </div>
                      {user.uid === session.uid && (
                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.35em] text-emerald-300">
                          You
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleUserAction(user.uid, user.role === 'collaborator' ? 'customer' : 'collaborator')}
                        disabled={busyUserId === user.uid || user.uid === session.uid}
                        className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-200 hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                      >
                        {user.role === 'collaborator' ? 'Demote' : 'Make collaborator'}
                      </button>
                      {user.status === 'active' ? (
                        <>
                          <button
                            onClick={() => handleUserAction(user.uid, 'suspend')}
                            disabled={busyUserId === user.uid || user.uid === session.uid}
                            className="rounded-full border border-amber-400/30 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-amber-200 hover:border-amber-300 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleUserAction(user.uid, 'delete')}
                            disabled={busyUserId === user.uid || user.uid === session.uid}
                            className="rounded-full border border-rose-400/30 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-rose-200 hover:border-rose-300 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.uid, 'restore')}
                          disabled={busyUserId === user.uid || user.uid === session.uid}
                          className="rounded-full border border-emerald-400/30 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-200 hover:border-emerald-300 disabled:opacity-50"
                        >
                          Retrieve
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {users.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">
                    No user records are available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 size={20} className="text-emerald-300" />
                <h2 className="text-2xl font-black uppercase tracking-tight">Analytics</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Active users</span>
                  <span className="font-semibold text-zinc-100">{metrics.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Suspended users</span>
                  <span className="font-semibold text-zinc-100">{metrics.suspendedUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Deleted users</span>
                  <span className="font-semibold text-zinc-100">{metrics.deletedUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Order total</span>
                  <span className="font-semibold text-zinc-100">{orders.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Cart value in session</span>
                  <span className="font-semibold text-zinc-100">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {Object.entries(metrics.categoryTotals).map(([category, count]) => {
                  const maxCount = Math.max(...Object.values(metrics.categoryTotals), 1);
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">
                        <span>{category}</span>
                        <span>{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5">
                        <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${(count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}

                {Object.keys(metrics.categoryTotals).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">
                    No active products to analyze yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
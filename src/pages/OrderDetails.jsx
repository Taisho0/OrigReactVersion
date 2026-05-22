import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useUserAuth } from '../auth/AuthContext';
import { ChevronLeft, CircleCheckBig, CircleX, Download } from 'lucide-react';

export const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrderStatus, approveOrderPayment, rejectOrderPayment } = useStore();
  const { session } = useUserAuth();
  const [busyOrderId, setBusyOrderId] = useState('');
  const [orderStatusDrafts, setOrderStatusDrafts] = useState({});
  const [message, setMessage] = useState('');

  const order = orders.find((o) => o.id === orderId);

  useEffect(() => {
    if (!session?.uid) {
      navigate('/admin');
    }
  }, [session, navigate]);

  if (!order) {
    return (
      <div className="px-4 sm:px-6 md:px-12 py-8 sm:py-12">
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/80 p-8 text-center">
          <p className="text-zinc-400 mb-4">Order not found</p>
          <Link to="/admin" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.3em] text-emerald-200 hover:bg-emerald-500/10">
            <ChevronLeft size={16} />
            Back to admin
          </Link>
        </div>
      </div>
    );
  }

  const isPendingPayment = ['pending_review', 'pending', 'review'].includes(order.payment?.status) || order.status === 'Pending Payment Approval';
  const isApprovedPayment = order.payment?.status === 'approved' || !order.payment;
  const receiptProofImage = order.payment?.proofImage || '';

  const handleOrderStatusDraftChange = (orderId, status) => {
    setOrderStatusDrafts((current) => ({ ...current, [orderId]: status }));
  };

  const handleApprovePayment = async (orderId) => {
    setMessage('');
    setBusyOrderId(orderId);

    try {
      const ok = await approveOrderPayment(orderId);
      if (!ok) {
        setMessage('Unable to approve payment for this order.');
        return;
      }

      setMessage('Payment approved. Order moved to Processing.');
    } catch (error) {
      setMessage(error?.message || 'Unable to approve payment for this order.');
    } finally {
      setBusyOrderId('');
    }
  };

  const handleRejectPayment = async (orderId) => {
    setMessage('');
    setBusyOrderId(orderId);

    try {
      const ok = await rejectOrderPayment(orderId, 'Receipt proof needs verification.');
      if (!ok) {
        setMessage('Unable to reject payment for this order.');
        return;
      }

      setMessage('Payment rejected.');
    } catch (error) {
      setMessage(error?.message || 'Unable to reject payment for this order.');
    } finally {
      setBusyOrderId('');
    }
  };

  const handleOrderStatusSave = async (orderId) => {
    const newStatus = orderStatusDrafts[orderId] ?? order.status;
    setBusyOrderId(orderId);
    setMessage('');

    try {
      if (!isApprovedPayment) {
        setMessage('Approve payment before updating the tracking status.');
        return;
      }

      if (newStatus === order.status) {
        setMessage('No tracking status change to save.');
        return;
      }

      const ok = await updateOrderStatus(orderId, newStatus);
      if (!ok) {
        setMessage('Unable to update tracking status for this order.');
        return;
      }

      setMessage('Order tracking status updated.');
      setOrderStatusDrafts((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
    } catch (error) {
      setMessage(error?.message || 'Unable to update tracking status for this order.');
    } finally {
      setBusyOrderId('');
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-12 py-8 sm:py-12 max-w-7xl mx-auto">
      <Link to="/admin?tab=sales" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/40 px-4 py-2 text-sm font-bold uppercase tracking-[0.3em] text-emerald-200 hover:border-emerald-300 hover:bg-emerald-500/10 mb-8">
        <ChevronLeft size={18} />
        Back to sales
      </Link>

      {message && (
        <div className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-4 text-sm text-emerald-100">
          {message}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">Order</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">{order.id}</h1>
            <p className="mt-2 text-sm text-zinc-400">{order.purchaserEmail || 'Unknown buyer'} · {new Date(order.date).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-emerald-300">₱{order.total.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">{order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} items</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer Details */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 mb-4">Customer details</p>
            <div className="space-y-2 text-sm text-zinc-300">
              <p><span className="text-zinc-500">Name:</span> {`${order.shipping?.firstName || ''} ${order.shipping?.lastName || ''}`.trim() || 'N/A'}</p>
              <p><span className="text-zinc-500">Email:</span> {order.shipping?.email || order.purchaserEmail || 'N/A'}</p>
              <p><span className="text-zinc-500">Phone:</span> {order.shipping?.phone || 'N/A'}</p>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 mb-4">Shipping address</p>
            <div className="space-y-2 text-sm text-zinc-300">
              <p><span className="text-zinc-500">Address:</span> {order.shipping?.addressLine || 'N/A'}</p>
              <p><span className="text-zinc-500">City:</span> {order.shipping?.city || 'N/A'}</p>
              <p><span className="text-zinc-500">Province:</span> {order.shipping?.stateProvince || 'N/A'}</p>
              <p><span className="text-zinc-500">Postal Code:</span> {order.shipping?.postalCode || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 mb-4">Order items</p>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-400 uppercase tracking-[0.2em] text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => {
                  const unitPrice = Number(item.itemPrice ?? item.product?.price ?? 0);
                  const quantity = Number(item.quantity ?? 0);
                  const subtotal = unitPrice * quantity;

                  return (
                    <tr key={`${order.id}-${item.product?.id || item.productId || index}-${item.size || 'default'}`} className="border-t border-white/10 text-zinc-200">
                      <td className="px-4 py-3 truncate">{item.product?.name || item.name || 'Unnamed item'}</td>
                      <td className="px-4 py-3">{item.product?.category || 'N/A'}</td>
                      <td className="px-4 py-3">{item.size || 'N/A'}</td>
                      <td className="px-4 py-3 text-right">{quantity}</td>
                      <td className="px-4 py-3 text-right">₱{unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">₱{subtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Design Uploads */}
        {order.items.some((item) => item.layoutImage) && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 mb-4">Customer design uploads</p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {order.items.map((item, idx) => {
                if (!item.layoutImage) return null;
                return (
                  <div key={`${order.id}-design-${idx}`} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm text-zinc-300 truncate font-semibold">{item.product?.name || 'Item'} {item.size && `(${item.size})`}</p>
                    </div>
                    <img
                      src={item.layoutImage}
                      alt={`Design for ${item.product?.name || 'item'}`}
                      className="w-full h-48 object-contain bg-slate-900"
                    />
                    <div className="p-3 border-t border-white/10 bg-slate-950/50">
                      <a
                        href={item.layoutImage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-300 hover:text-emerald-200 underline"
                      >
                        View full size
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Proof of Payment */}
        {receiptProofImage && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 mb-4">Proof of payment</p>
            <div className="space-y-4">
              <a
                href={receiptProofImage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 underline"
              >
                <Download size={14} />
                View full receipt image
              </a>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                <img
                  src={receiptProofImage}
                  alt={`Receipt proof for order ${order.id}`}
                  className="w-full max-h-96 object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment & Status Management */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          {isPendingPayment && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-100">
              <p className="text-sm font-semibold">Payment review required</p>
              <p className="mt-2 text-sm text-amber-100/90">This order is awaiting manual payment approval. Review the proof of payment and choose the correct action before processing the order.</p>
            </div>
          )}

          {isPendingPayment && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleApprovePayment(order.id)}
                disabled={busyOrderId === order.id}
                className="rounded-2xl border border-emerald-400/40 px-4 py-3 text-sm font-bold uppercase tracking-[0.25em] text-emerald-200 hover:border-emerald-300 hover:bg-emerald-500/10 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <CircleCheckBig size={16} />
                Approve Payment
              </button>
              <button
                type="button"
                onClick={() => handleRejectPayment(order.id)}
                disabled={busyOrderId === order.id}
                className="rounded-2xl border border-rose-400/40 px-4 py-3 text-sm font-bold uppercase tracking-[0.25em] text-rose-200 hover:border-rose-300 hover:bg-rose-500/10 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <CircleX size={16} />
                Reject Payment
              </button>
            </div>
          )}

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_auto] items-end">
            <div>
              <label className="block text-xs uppercase tracking-[0.35em] text-emerald-400 mb-2">
                Update tracking status
              </label>
              <select
                value={orderStatusDrafts[order.id] ?? order.status}
                onChange={(event) => handleOrderStatusDraftChange(order.id, event.target.value)}
                disabled={busyOrderId === order.id || !isApprovedPayment}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-400"
              >
                {[
                  'Processing',
                  'Shipped',
                  'Delivered',
                  'Complete',
                  ...(order.status && !['Processing', 'Shipped', 'Delivered', 'Complete'].includes(order.status)
                    ? [order.status]
                    : []),
                ].map((statusOption) => (
                  <option key={statusOption} value={statusOption} className="bg-slate-950 text-zinc-100">
                    {statusOption}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleOrderStatusSave(order.id)}
              disabled={busyOrderId === order.id || (!isPendingPayment && !isApprovedPayment) || (!isPendingPayment && (orderStatusDrafts[order.id] ?? order.status) === order.status)}
              className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-bold uppercase tracking-[0.25em] text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

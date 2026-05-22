import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronLeft, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

const STATUS_STEPS = ['Pending Payment Approval', 'Processing', 'Shipped', 'Delivered', 'Complete'];
const CANCELLABLE_STATUSES = ['Pending Payment Approval', 'Processing'];

export const Tracking = () => {
  const { orders, cancelOrder, submitOrderFeedback } = useStore();
  const [busyOrderId, setBusyOrderId] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [showPrevious, setShowPrevious] = useState(false);
  const [selectedPreviousOrderId, setSelectedPreviousOrderId] = useState('');
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [pendingCancelOrder, setPendingCancelOrder] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackOrderId, setFeedbackOrderId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const selectedPreviousOrder = orders.find((order) => order.id === selectedPreviousOrderId) || null;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (feedbackOpen || feedbackOrderId) {
      return;
    }

    const nextOrder = orders.find((order) => {
      if (order.status !== 'Complete' || order.feedbackSubmittedAt) {
        return false;
      }

      return !window.localStorage.getItem(`theoriginals.feedbackPrompted.${order.id}`);
    });

    if (!nextOrder) {
      return;
    }

    setFeedbackOrderId(nextOrder.id);
    setFeedbackRating(5);
    setFeedbackComment('');
    setFeedbackMessage('');
    setFeedbackOpen(true);
  }, [feedbackOpen, feedbackOrderId, orders]);

  const openFeedbackDialog = (order) => {
    if (!order || order.status !== 'Complete') {
      return;
    }

    setFeedbackOrderId(order.id);
    setFeedbackRating(5);
    setFeedbackComment('');
    setFeedbackMessage('');
    setFeedbackOpen(true);
  };

  const closeFeedbackDialog = () => {
    if (typeof window !== 'undefined' && feedbackOrderId) {
      window.localStorage.setItem(`theoriginals.feedbackPrompted.${feedbackOrderId}`, 'dismissed');
    }

    setFeedbackOpen(false);
    setFeedbackOrderId('');
    setFeedbackMessage('');
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackOrderId) {
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackMessage('');

    try {
      const ok = await submitOrderFeedback({
        orderId: feedbackOrderId,
        rating: feedbackRating,
        comment: feedbackComment,
      });

      if (!ok) {
        setFeedbackMessage('Unable to send feedback right now. Please try again.');
        return;
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`theoriginals.feedbackPrompted.${feedbackOrderId}`, 'submitted');
      }

      setFeedbackMessage('Feedback sent to the admin.');
      setFeedbackOpen(false);
      setFeedbackOrderId('');
      setFeedbackComment('');
      setFeedbackRating(5);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const canCancel = (order) => CANCELLABLE_STATUSES.includes(order.status);

  const handlePrintReceipt = (order) => {
    if (order.status !== 'Complete') {
      return;
    }

    const receiptWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!receiptWindow) {
      setOrderMessage('Unable to open the receipt print window. Please allow pop-ups and try again.');
      return;
    }

    const totalItems = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const lineItems = order.items
      .map((item) => {
        const price = item.itemPrice || item.product?.price || 0;
        const amount = price * (item.quantity || 0);
        return `
          <tr>
            <td>${item.product?.name || 'Unknown product'}</td>
            <td>${item.size || 'One size'}</td>
            <td>${item.quantity}</td>
            <td>₱${amount.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');

    const receiptHtml = `
      <!doctype html>
      <html>
        <head>
          <title>Order Receipt ${order.id}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, sans-serif;
              color: #111827;
              background: #ffffff;
            }
            .receipt {
              max-width: 760px;
              margin: 0 auto;
              border: 1px solid #e5e7eb;
              border-radius: 20px;
              padding: 28px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 16px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e5e7eb;
              margin-bottom: 20px;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 28px;
            }
            p {
              margin: 4px 0;
              line-height: 1.5;
            }
            .muted { color: #6b7280; }
            .status {
              display: inline-block;
              padding: 8px 12px;
              border-radius: 999px;
              background: #d1fae5;
              color: #065f46;
              font-weight: 700;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.12em;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
              margin-bottom: 22px;
            }
            .card {
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 16px;
            }
            .label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.2em;
              color: #6b7280;
              margin-bottom: 10px;
            }
            .value {
              font-size: 14px;
              color: #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              text-align: left;
              padding: 12px 10px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }
            th {
              text-transform: uppercase;
              letter-spacing: 0.14em;
              font-size: 11px;
              color: #6b7280;
            }
            .summary {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 20px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              font-size: 16px;
              font-weight: 700;
            }
            @media print {
              body { padding: 0; }
              .receipt { border: none; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div>
                <h1>Order Receipt</h1>
                <p class="muted">Order ${order.id}</p>
                <p class="muted">${new Date(order.date).toLocaleDateString()}</p>
              </div>
              <div class="status">Complete</div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="label">Customer</div>
                <div class="value">${order.shipping?.firstName || ''} ${order.shipping?.lastName || ''}</div>
                <p class="muted">${order.shipping?.email || order.purchaserEmail || 'No email available'}</p>
              </div>
              <div class="card">
                <div class="label">Shipping Address</div>
                <div class="value">${order.shipping?.addressLine || 'No address available'}</div>
                <p class="muted">${order.shipping?.city || ''}, ${order.shipping?.stateProvince || ''} ${order.shipping?.postalCode || ''}</p>
              </div>
            </div>

            <div class="card">
              <div class="label">Payment Details</div>
              <p><strong>Method:</strong> ${order.payment?.method || 'N/A'}</p>
              <p><strong>Status:</strong> ${order.payment?.status || 'N/A'}</p>
              ${order.payment?.reference ? `<p><strong>Reference:</strong> ${order.payment.reference}</p>` : ''}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems}
              </tbody>
            </table>

            <div class="summary">
              <span>Total items: ${totalItems}</span>
              <span>₱${Number(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
            window.onafterprint = () => {
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    receiptWindow.document.open();
    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
  };

  const requestCancelOrder = (order) => {
    if (!canCancel(order)) {
      return;
    }

    setPendingCancelOrder(order);
    setCancelConfirmOpen(true);
  };

  const handleCancelOrder = async () => {
    if (!pendingCancelOrder) {
      return;
    }

    setCancelConfirmOpen(false);
    setBusyOrderId(pendingCancelOrder.id);
    setOrderMessage('');

    try {
      const ok = await cancelOrder(pendingCancelOrder.id);
      if (!ok) {
        setOrderMessage('Unable to cancel the order. Please try again.');
      } else {
        setShowPrevious(true);
        setSelectedPreviousOrderId(pendingCancelOrder.id);
        setOrderMessage(`Order ${pendingCancelOrder.id} has been cancelled.`);
      }
    } finally {
      setBusyOrderId('');
      setPendingCancelOrder(null);
    }
  };

  const closeCancelDialog = () => {
    setCancelConfirmOpen(false);
    setPendingCancelOrder(null);
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 text-center">
        <div className="rounded-3xl border border-zinc-800 bg-black/40 px-8 py-10 backdrop-blur-md">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4 text-zinc-50 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            No Orders Yet
          </h1>
          <p className="text-zinc-300 mb-10 max-w-xl mx-auto text-lg">
            You haven't placed any orders with us.
          </p>
          <Link 
            to="/shop" 
            className="inline-flex items-center justify-center py-4 px-10 rounded-full border border-zinc-700 bg-zinc-950/90 text-zinc-50 font-bold tracking-widest uppercase hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const previousOrders = orders.filter((o) => ['Cancelled', 'Complete'].includes(o.status));
  const currentOrders = orders.filter((o) => !['Cancelled', 'Complete'].includes(o.status));

  // Main content - either showing active orders or a selected previous order
  const mainContent = selectedPreviousOrder ? (
    <div className="px-4 sm:px-6 md:px-12 py-8 sm:py-12">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setSelectedPreviousOrderId('')}
          className="inline-flex items-center gap-2 text-sm sm:text-base font-bold uppercase tracking-widest text-emerald-200 hover:text-emerald-300"
        >
          <ChevronLeft size={18} />
          Back
        </button>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-8 sm:mb-12">Order {selectedPreviousOrder.id}</h1>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] mb-8 sm:mb-10">
          <div className="rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-4 sm:p-6">
            <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-emerald-400">Order details</p>
                <p className="text-xs sm:text-sm md:text-base font-semibold text-zinc-50 mt-1 sm:mt-3 truncate">{selectedPreviousOrder.purchaserEmail || 'No contact email'}</p>
              </div>
              <span className="rounded-full px-1.5 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.35em] bg-emerald-400/20 text-emerald-200 whitespace-nowrap shrink-0 leading-none">
                {selectedPreviousOrder.status}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Payment</p>
                <p className="text-sm text-zinc-100">{selectedPreviousOrder.payment?.status || 'N/A'}</p>
                <p className="text-xs text-zinc-500">Method: {selectedPreviousOrder.payment?.method || 'N/A'}</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Total</p>
                <p className="text-xl sm:text-2xl font-semibold text-emerald-300">₱{Number(selectedPreviousOrder.total || 0).toFixed(2)}</p>
                <p className="text-xs text-zinc-500">Items: {selectedPreviousOrder.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-4 sm:p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 mb-4">Shipping</p>
            <div className="space-y-2 text-sm text-zinc-100 mb-6">
              <p className="font-semibold">{selectedPreviousOrder.shipping?.firstName} {selectedPreviousOrder.shipping?.lastName}</p>
              <p>{selectedPreviousOrder.shipping?.email || selectedPreviousOrder.purchaserEmail}</p>
              <p>{selectedPreviousOrder.shipping?.addressLine}</p>
              <p>{selectedPreviousOrder.shipping?.city}, {selectedPreviousOrder.shipping?.stateProvince} {selectedPreviousOrder.shipping?.postalCode}</p>
            </div>

            {selectedPreviousOrder.status === 'Complete' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedPreviousOrder)}
                  className="w-full rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.25em] text-emerald-200 hover:border-emerald-300"
                >
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => openFeedbackDialog(selectedPreviousOrder)}
                  className="w-full rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.25em] text-sky-200 hover:border-sky-300"
                >
                  Leave Feedback
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-4 sm:p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 mb-4">Order items</p>
          <div className="space-y-4">
            {selectedPreviousOrder.items.map((item) => (
                  <div key={`${item.product?.id || 'unknown'}-${item.size || 'default'}`} className="grid gap-3 md:grid-cols-[1fr_auto] items-center rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-4">
                <div>
                  <p className="font-semibold text-zinc-100">{item.product?.name || 'Unknown product'}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mt-1">Size: {item.size || 'One size'}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-right text-sm font-semibold text-emerald-300">₱{((item.itemPrice || item.product?.price || 0) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
    </div>
  ) : (
    <div className="px-4 sm:px-6 md:px-12 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-8 sm:mb-16">
        Tracking
      </h1>

      {orderMessage && (
        <div className="mb-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-4 text-sm text-emerald-100">
          {orderMessage}
        </div>
      )}

      <div className="space-y-12">
        {currentOrders.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
            <p className="text-lg text-zinc-400 mb-4">You have no active orders right now.</p>
            <button onClick={() => setShowPrevious(true)} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-emerald-200 hover:border-emerald-300">View previous orders</button>
          </div>
        ) : (
          currentOrders.map((order, idx) => (
          <motion.div 
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="border border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-sm relative overflow-hidden"
          >
            {/* Animated background glow for active order */}
            {order.status !== 'Delivered' && order.status !== 'Complete' && (
              <motion.div 
                className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 sm:gap-6 mb-3 sm:mb-6 border-b border-zinc-900 pb-3 sm:pb-8 relative z-10">
              <div>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-500 mb-1 sm:mb-2">Order {order.id}</p>
                <p className="text-zinc-500 text-xs sm:text-sm">{new Date(order.date).toLocaleDateString()} • {order.items.length} items</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-50 mb-1 sm:mb-2">Estimated Delivery</p>
                <p className="text-sm sm:text-xl font-light">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="relative z-10 grid gap-3 sm:gap-6 grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] mb-6 sm:mb-10">
              <div className="rounded-2xl sm:rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-3 sm:p-6">
                <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-emerald-400">Order details</p>
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-zinc-50 mt-1 sm:mt-3 truncate">{order.purchaserEmail || 'No contact email'}</p>
                  </div>
                  <span className={`rounded-full px-1.5 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.35em] whitespace-nowrap shrink-0 leading-none ${order.status === 'Cancelled' ? 'bg-rose-400/20 text-rose-200' : order.status === 'Payment Rejected' ? 'bg-amber-400/20 text-amber-200' : order.status === 'Complete' || order.status === 'Delivered' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-emerald-500/10 text-emerald-300'}`}>
                    {order.status === 'Cancelled' ? 'Order cancelled' : order.status}
                  </span>
                </div>

                <div className="grid gap-2 sm:gap-3 grid-cols-2">
                  <div className="space-y-1 sm:space-y-3">
                    <p className="text-[9px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.35em] text-zinc-500">Payment</p>
                    <p className="text-xs sm:text-sm text-zinc-100">{order.payment?.status || 'N/A'}</p>
                    <p className="text-[9px] sm:text-xs text-zinc-500">Method: {order.payment?.method || 'N/A'}</p>
                    {order.payment?.reference && <p className="text-[9px] sm:text-xs text-zinc-500">Ref: {order.payment.reference}</p>}
                  </div>
                  <div className="space-y-1 sm:space-y-3">
                    <p className="text-[9px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.35em] text-zinc-500">Total</p>
                    <p className="text-base sm:text-lg md:text-2xl font-semibold text-emerald-300">₱{Number(order.total || 0).toFixed(2)}</p>
                    <p className="text-[9px] sm:text-xs text-zinc-500">Items: {order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl sm:rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-3 sm:p-6">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-emerald-400 mb-2 sm:mb-4">Shipping</p>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-zinc-100 mb-3 sm:mb-4">
                  <p className="truncate font-semibold">{order.shipping?.firstName} {order.shipping?.lastName}</p>
                  <p className="truncate">{order.shipping?.email || order.purchaserEmail}</p>
                  <p className="truncate">{order.shipping?.addressLine}</p>
                  <p className="truncate">{order.shipping?.city}, {order.shipping?.stateProvince} {order.shipping?.postalCode}</p>
                </div>

                {canCancel(order) && (
                  <button
                    type="button"
                    onClick={() => requestCancelOrder(order)}
                    disabled={busyOrderId === order.id}
                    className="w-full rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.25em] text-rose-200 hover:border-rose-300 hover:text-white disabled:opacity-60"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <XCircle size={16} />
                      {busyOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </span>
                  </button>
                )}

                {order.status === 'Complete' && (
                  <button
                    type="button"
                    onClick={() => handlePrintReceipt(order)}
                    className="w-full rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.25em] text-emerald-200 hover:border-emerald-300 hover:text-white"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <CheckCircle size={16} />
                      Print Receipt
                    </span>
                  </button>
                )}

                {order.status === 'Cancelled' && (
                  <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                    This order has been cancelled.
                  </p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="relative z-10 mb-8 sm:mb-12 py-4 sm:py-6 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="absolute top-1/2 left-4 right-4 sm:left-0 sm:right-0 h-0.5 bg-zinc-900 -translate-y-1/2" />

              {/* Progress Line */}
              {(() => {
                const progressIndex = STATUS_STEPS.indexOf(order.status);
                const progressPercent = Math.max(0, (progressIndex / (STATUS_STEPS.length - 1)) * 100);
                const progressWidth =
                  progressPercent <= 0
                    ? '0%'
                    : progressPercent >= 100
                      ? '100%'
                      : `calc(${progressPercent}% + 20px)`;

                return (
                  <motion.div
                    className="absolute top-1/2 left-4 sm:left-0 h-0.5 bg-emerald-500 -translate-y-1/2"
                    initial={{ width: '0%' }}
                    animate={{ width: progressWidth }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                );
              })()}

              <div className="relative grid grid-cols-5 items-start gap-2 sm:gap-4 min-w-160 sm:min-w-0">
                {STATUS_STEPS.map((step, index) => {
                  const statusIndex = STATUS_STEPS.indexOf(order.status);
                  const isActive = statusIndex >= index;
                  const isCurrent = order.status === step;
                  
                  return (
                    <div key={step} className="relative flex flex-col items-center gap-2 sm:gap-4 group">
                      <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500 shrink-0 ${
                        isActive ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                      }`}>
                        {index === 0 && <Clock size={16} className="sm:w-5 sm:h-5" />}
                        {index === 1 && <Package size={16} className="sm:w-5 sm:h-5" />}
                        {index === 2 && <Truck size={16} className="sm:w-5 sm:h-5" />}
                        {index === 3 && <CheckCircle size={16} className="sm:w-5 sm:h-5" />}
                        {index === 4 && <CheckCircle size={16} className="sm:w-5 sm:h-5" />}
                        
                        {isCurrent && (
                          <motion.div 
                            className="absolute w-11 sm:w-14 h-11 sm:h-14 border-2 border-emerald-500 rounded-full opacity-50"
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <span className={`text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-tight sm:tracking-widest text-center leading-tight ${
                        isActive ? 'text-zinc-50' : 'text-zinc-600'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="relative z-10 hidden sm:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
              {order.items.slice(0, 4).map(item => (
                <div key={`${item.product?.id || 'unknown'}-${item.size || 'default'}`} className="aspect-3/4 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800 relative group">
                  {item.product?.image ? (
                    <img src={item.product.image} alt={item.product?.name || 'Product image'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-sm text-zinc-500">No image</div>
                  )}
                  <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase">{item.product?.name || 'Unknown product'}</p>
                    <p className="text-xs text-emerald-400 mt-1">Qty {item.quantity}</p>
                    <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">{item.size || 'One size'}</p>
                  </div>
                </div>
              ))}
              {order.items.length > 4 && (
                <div className="aspect-3/4 bg-zinc-900 border border-zinc-800 rounded-sm flex items-center justify-center text-sm font-bold text-zinc-500">
                  +{order.items.length - 4} More
                </div>
              )}
            </div>

            <div className="relative z-10 mt-6 sm:mt-8 rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-3 sm:p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 mb-3 sm:mb-4">Order items</p>
              <div className="space-y-2 sm:space-y-4">
                {order.items.map((item) => (
                  <div key={`${item.product?.id || 'unknown'}-${item.size || 'default'}`} className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-[1fr_auto] items-start sm:items-center rounded-2xl sm:rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-3 sm:p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-zinc-100 truncate">{item.product?.name || 'Unknown product'}</p>
                      <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-zinc-500 mt-1">Size: {item.size || 'One size'}</p>
                      <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-zinc-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-right text-xs sm:text-sm font-semibold text-emerald-300 whitespace-nowrap">₱{((item.itemPrice || item.product?.price || 0) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 md:px-12 py-8 sm:py-12 relative bg-linear-to-br from-zinc-950 via-zinc-950/95 to-zinc-950">
      {mainContent}

      <Dialog open={cancelConfirmOpen} onOpenChange={(open) => { if (!open) { closeCancelDialog(); } setCancelConfirmOpen(open); }}>
        <DialogContent className="bg-zinc-950/80 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Cancel order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {pendingCancelOrder ? `order ${pendingCancelOrder.id}` : 'this order'}? This will stop further processing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={closeCancelDialog} className="px-4 py-2 rounded border border-zinc-700 text-sm text-zinc-200">
              Keep order
            </button>
            <button type="button" onClick={handleCancelOrder} className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700 text-sm text-white">
              Confirm cancellation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={feedbackOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeFeedbackDialog();
            return;
          }

          setFeedbackOpen(open);
        }}
      >
        <DialogContent className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 text-zinc-50 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>How was your order?</DialogTitle>
            <DialogDescription>
              Your feedback will be great help for our performance! Thank You!.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.35em] text-zinc-400">Rating</p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFeedbackRating(value)}
                    className={`flex items-center justify-center rounded-xl border px-3 py-3 text-sm font-bold transition-colors ${feedbackRating === value ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'}`}
                  >
                    <Star size={14} className="mr-1" />
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.35em] text-zinc-400" htmlFor="order-feedback-comment">
                Comment
              </label>
              <textarea
                id="order-feedback-comment"
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value)}
                rows={4}
                placeholder="Tell us what went well or what we should improve."
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-sky-400"
              />
            </div>

            {feedbackMessage && (
              <p className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
                {feedbackMessage}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={closeFeedbackDialog}
              disabled={feedbackSubmitting}
              className="rounded-2xl border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-700 disabled:opacity-60"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={feedbackSubmitting || !feedbackComment.trim()}
              className="rounded-2xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {feedbackSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previousOrders.length > 0 && (
        <div className="fixed right-2 sm:right-8 top-36 z-40 flex flex-col items-end gap-3">
          {!showPrevious ? (
            <button
              type="button"
              onClick={() => setShowPrevious(true)}
              className="rounded-full border border-emerald-400/40 bg-zinc-950/95 px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-emerald-200 shadow-2xl hover:border-emerald-300 transition-colors"
            >
              Show Previous Orders
            </button>
          ) : (
            <div id="previous-orders-panel" className="w-72 sm:w-96 bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-l-2xl sm:rounded-l-3xl p-2 sm:p-4 shadow-2xl max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-bold uppercase text-zinc-100 truncate">Previous orders</h3>
                <button
                  type="button"
                  onClick={() => setShowPrevious(false)}
                  className="rounded-full border border-zinc-800 bg-zinc-900/90 px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.25em] text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-200 transition-colors shrink-0"
                >
                  Hide
                </button>
              </div>

              <div className="space-y-1 sm:space-y-2">
                {previousOrders.length === 0 && <p className="text-[10px] sm:text-xs text-zinc-500">No previous orders yet.</p>}
                {previousOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedPreviousOrderId(o.id)}
                    className="w-full text-left rounded-md border border-zinc-900 p-2 sm:p-3 bg-zinc-900 hover:border-emerald-400/40 hover:bg-zinc-800 transition-colors"
                  >
                    <p className="text-[9px] sm:text-xs text-zinc-400 truncate">{o.id}</p>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">{o.purchaserEmail || 'Unknown'}</p>
                    <p className="text-[9px] sm:text-xs text-zinc-500 truncate">{o.status}</p>
                    <p className="text-[9px] sm:text-xs text-emerald-400 mt-0.5 sm:mt-1">₱{Number(o.total || 0).toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
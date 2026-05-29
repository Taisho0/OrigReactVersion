import { useCallback, useEffect, useMemo, useState, useId } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react';
import { ArchiveRestore, BarChart3, Bell, ShieldCheck, ShoppingBag, Users, UserRoundCog, Upload, DollarSign, Plus, Download, CircleCheckBig, CircleX, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addDoc, collection, getFirestore, onSnapshot, query, orderBy } from 'firebase/firestore';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Label, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '../components/ui/chart';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from '../config/FirebaseConfig';
import { useUserAuth } from '../auth/AuthContext';
import { useStore } from '../context/StoreContext';
import PricingForm from '../components/admin/PricingForm';
import { SHOWCASE_CATEGORIES } from './Showcase';

const API_ORIGIN = '';

export default function Admin() {
  const { session, userProfile, signOut, suspendUser, deleteUser, restoreUser, setUserRole, isConfiguredAdminEmail, authReady } = useUserAuth();
  const {
    activeProducts,
    archivedProducts,
    archiveProduct,
    restoreProduct,
    updateProduct,
    addProduct,
    orders,
    updateOrderStatus,
    approveOrderPayment,
    rejectOrderPayment,
  } = useStore();
  const [busyUserId, setBusyUserId] = useState('');
  const [busyProductId, setBusyProductId] = useState('');
  const [busyOrderId, setBusyOrderId] = useState('');
  const [orderStatusDrafts, setOrderStatusDrafts] = useState({});
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    image: '',
    sizes: [],
    description: '',
  });
  const [productMessage, setProductMessage] = useState('');
  const [savingPricing, setSavingPricing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '',
    image: '',
    sizes: '',
    description: '',
    category: '',
    unitType: 'fixed',
    pricePerUnit: '',
  });
  const [newProductMessage, setNewProductMessage] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [salesMessage, setSalesMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRange, setSelectedRange] = useState('all');
  const [showcaseForm, setShowcaseForm] = useState({
    category: SHOWCASE_CATEGORIES[0],
    productId: '',
    title: '',
    description: '',
    imageFile: null,
    imageUrl: '',
  });
  const [showcaseItems, setShowcaseItems] = useState([]);
  const [showcaseMessage, setShowcaseMessage] = useState('');
  const [savingShowcase, setSavingShowcase] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [paymentApprovalDrafts, setPaymentApprovalDrafts] = useState({});
  const [firebaseUsers, setFirebaseUsers] = useState([]);
  const [feedbackCollectionInbox, setFeedbackCollectionInbox] = useState([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [feedbackStarFilter, setFeedbackStarFilter] = useState('');

  const barGradId = useId();

  const db = getFirestore(app);
  const storage = getStorage(app);

  const loadFirebaseUsers = useCallback(async () => {
    if (!session?.uid) {
      setFirebaseUsers([]);
      return;
    }

    const actorToken = await session.getIdToken();
    const response = await fetch(`${API_ORIGIN}/api/admin/users`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${actorToken}`,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body?.message || `Unable to load Firebase users. (${response.status})`);
    }

    const body = await response.json();
    setFirebaseUsers(Array.isArray(body.users) ? body.users : []);
  }, [session]);

  const accountUsers = useMemo(() => firebaseUsers.filter((user) => user.role !== 'admin'), [firebaseUsers]);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(activeProducts.map((p) => p.category).filter(Boolean))];
    return cats;
  }, [activeProducts]);

  useEffect(() => {
    let mounted = true;

    const syncUsers = async () => {
      try {
        await loadFirebaseUsers();
      } catch (error) {
        if (!mounted) return;
        console.error('Unable to sync users from Firebase:', error);
        console.error('Error details:', error?.message, error?.code, error?.status);
        setFirebaseUsers([]);
      }
    };

    syncUsers();

    return () => {
      mounted = false;
    };
  }, [loadFirebaseUsers]);

  useEffect(() => {
    if (activeProducts.length === 0) {
      setSelectedProductId('');
      return;
    }

    if (!selectedProductId || !activeProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(activeProducts[0].id);
    }
  }, [activeProducts, selectedProductId]);

  useEffect(() => {
    setShowcaseForm((current) => ({
      ...current,
      productId: current.productId || activeProducts[0]?.id || '',
    }));
  }, [activeProducts]);

  useEffect(() => {
    let mounted = true;

    const loadShowcaseItems = async () => {
      try {
        const response = await fetch(`${API_ORIGIN}/api/showcase`);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.message || `Request failed with status ${response.status}`);
        }

        const body = await response.json();
        if (!mounted) return;
        setShowcaseItems(Array.isArray(body.items) ? body.items : []);
      } catch (error) {
        if (!mounted) return;
        console.error('Unable to sync showcase items:', error);
      }
    };

    loadShowcaseItems();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setOrderStatusDrafts((previousDrafts) => {
      const nextDrafts = {};

      orders.forEach((order) => {
        nextDrafts[order.id] = previousDrafts[order.id] ?? order.status;
      });

      return nextDrafts;
    });
  }, [orders]);

  useEffect(() => {
    setPaymentApprovalDrafts((previousDrafts) => {
      const nextDrafts = {};

      orders.forEach((order) => {
        nextDrafts[order.id] = previousDrafts[order.id] ?? false;
      });

      return nextDrafts;
    });
  }, [orders]);

  useEffect(() => {
    const isAdmin = userProfile?.role === 'admin' || (userProfile == null && session?.email && isConfiguredAdminEmail(session.email));

    if (!authReady) {
      console.debug('Admin.jsx - auth not ready, skipping feedback subscription');
      return undefined;
    }

    if (!session?.uid || !isAdmin) {
      console.debug('Admin.jsx - not subscribing to feedbacks: not authenticated admin', { sessionUid: session?.uid, isAdmin });
      setFeedbackCollectionInbox([]);
      return undefined;
    }

    const loadFromServer = async () => {
      try {
        const actorToken = typeof session?.getIdToken === 'function' ? await session.getIdToken(true) : await auth.currentUser?.getIdToken(true);
        const resp = await fetch('/api/admin/feedbacks', {
          method: 'GET',
          headers: {
            authorization: `Bearer ${actorToken}`,
          },
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body?.message || `Unable to load feedbacks. (${resp.status})`);
        }

        const body = await resp.json();
        const docs = Array.isArray(body.feedbacks) ? body.feedbacks : [];
        console.debug('Admin.jsx - server returned feedbacks count:', docs.length, 'sample:', docs[0] || null);
        setFeedbackCollectionInbox(docs);
      } catch (err) {
        console.error('Unable to sync customer feedback:', err);
        setFeedbackCollectionInbox([]);
      }
    };

    loadFromServer();

    return undefined;
  }, [db, session?.uid, userProfile?.role, session?.email, authReady, isConfiguredAdminEmail]);

  const feedbackInbox = useMemo(() => {
    const toMillis = (value) => {
      if (!value) {
        return 0;
      }

      if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
      }

      if (typeof value?.toDate === 'function') {
        return value.toDate().getTime();
      }

      if (typeof value?.seconds === 'number') {
        return value.seconds * 1000;
      }

      return 0;
    };

    const keyFor = (item) => String(item.orderFirestoreId || item.feedbackId || item.orderId || item.id || '').trim();
    const merged = new Map();

    feedbackCollectionInbox.forEach((entry) => {
      const key = keyFor(entry) || `feedback-${entry.id}`;
      merged.set(key, {
        ...entry,
        id: entry.id || key,
      });
    });

    orders.forEach((order) => {
      if (!order?.feedback?.comment) {
        return;
      }

      const key = String(order.firestoreId || order.id || '').trim();
      if (!key || merged.has(key)) {
        return;
      }

      merged.set(key, {
        id: `order-feedback-${key}`,
        feedbackId: key,
        orderFirestoreId: key,
        orderId: order.id || '',
        orderStatus: order.status || '',
        orderDate: order.date || '',
        orderTotal: Number(order.total || 0),
        purchaserUid: order.purchaserUid || '',
        customerEmail: order.feedback.customerEmail || order.purchaserEmail || order.shipping?.email || '',
        customerName:
          order.feedback.customerName
          || `${order.shipping?.firstName || ''} ${order.shipping?.lastName || ''}`.trim(),
        rating: Number(order.feedback.rating || 0),
        comment: String(order.feedback.comment || '').trim(),
        submittedAt: order.feedback.submittedAt || order.feedbackSubmittedAt || order.updatedAt || order.date || '',
      });
    });

    return [...merged.values()].sort((a, b) => toMillis(b.submittedAt) - toMillis(a.submittedAt));
  }, [feedbackCollectionInbox, orders]);

  useEffect(() => {
    const product = activeProducts.find((entry) => entry.id === selectedProductId);

    if (!product) {
      return;
    }

    const sizes = Array.isArray(product.sizes)
      ? product.sizes.map((s) => ({
          width: typeof s === 'object' ? s.width || '' : '',
          length: typeof s === 'object' ? s.length || '' : '',
          sqrMeter: typeof s === 'object' ? s.sqrMeter || '' : '',
        }))
      : [];

    setProductForm({
      name: product.name || '',
      price: String(product.price ?? ''),
      image: product.image || '',
      sizes,
      description: product.description || '',
    });
  }, [activeProducts, selectedProductId]);

  const metrics = useMemo(() => {
    const approvedOrders = orders.filter((order) => {
      const paymentStatus = order.payment?.status;
      return !paymentStatus || paymentStatus === 'approved';
    });
    const pendingPaymentOrders = orders.filter((order) => {
      const paymentStatus = order.payment?.status;
      return ['pending_review', 'pending', 'review'].includes(paymentStatus) || order.status === 'Pending Payment Approval';
    });
    const registeredUsers = firebaseUsers.length;
    const activeUsers = firebaseUsers.filter((user) => user.status === 'active').length;
    const suspendedUsers = firebaseUsers.filter((user) => user.status === 'suspended').length;
    const deletedUsers = firebaseUsers.filter((user) => user.status === 'deleted').length;
    const collaborators = firebaseUsers.filter((user) => user.role === 'collaborator' && user.status === 'active').length;
    const soldItems = approvedOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const revenueFromNormalUsers = approvedOrders
      .filter((order) => order.purchaserRole !== 'admin')
      .reduce((sum, order) => sum + order.total, 0);
    const categoryTotals = activeProducts.reduce((accumulator, product) => {
      const next = { ...accumulator };
      next[product.category] = (next[product.category] || 0) + 1;
      return next;
    }, {});

    return {
      registeredUsers,
      activeUsers,
      suspendedUsers,
      deletedUsers,
      collaborators,
      soldItems,
      revenueFromNormalUsers,
      categoryTotals,
      approvedOrders,
      pendingPaymentOrdersCount: pendingPaymentOrders.length,
    };
  }, [activeProducts, firebaseUsers, orders]);

  const formatDate = (date) => date.toISOString().slice(0, 10);

  const handleSelectRange = (range) => {
    const now = new Date();
    if (range === 'all') {
      setSelectedRange('all');
      setStartDate('');
      setEndDate('');
      return;
    }

    const days = range === '7d' ? 6 : 29;
    const start = new Date(now);
    start.setDate(now.getDate() - days);

    setSelectedRange(range);
    setStartDate(formatDate(start));
    setEndDate(formatDate(now));
  };

  const filteredSalesOrders = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    return orders.filter((order) => {
      // Date range filtering
      if (!order?.date) {
        return true;
      }
      const orderDate = new Date(order.date);
      if (start && orderDate < start) return false;
      if (end && orderDate > end) return false;

      // Status filtering
      if (orderStatusFilter && order.status !== orderStatusFilter) {
        return false;
      }

      // Search filtering - search by order ID
      if (orderSearchQuery.trim()) {
        const searchLower = orderSearchQuery.toLowerCase().trim();
        const orderIdMatch = order.id && order.id.toLowerCase().includes(searchLower);
        if (!orderIdMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, startDate, endDate, orderStatusFilter, orderSearchQuery]);

  const salesAnalytics = useMemo(() => {
    const orders = filteredSalesOrders;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const orderCount = orders.length;
    const itemCount = orders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
      0
    );
    const averageTicket = orderCount ? totalRevenue / orderCount : 0;

    const categoryTotals = orders.reduce((accumulator, order) => {
      order.items.forEach((item) => {
        const category = item.product?.category || item.category || 'Unknown';
        accumulator[category] = (accumulator[category] || 0) + Number(item.quantity || 0);
      });
      return accumulator;
    }, {});

    const productTotals = orders.reduce((accumulator, order) => {
      order.items.forEach((item) => {
        const key = item.product?.id || item.productId || item.name || `${item.name}-${item.size || 'default'}`;
        const name = item.product?.name || item.name || 'Unnamed product';
        const quantity = Number(item.quantity || 0);
        const revenue = Number(item.itemPrice || item.product?.price || 0) * quantity;

        if (!accumulator[key]) {
          accumulator[key] = { name, quantity: 0, revenue: 0 };
        }

        accumulator[key].quantity += quantity;
        accumulator[key].revenue += revenue;
      });
      return accumulator;
    }, {});

    const topProducts = Object.values(productTotals)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const rangeStart = startDate ? new Date(startDate) : new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const rangeEnd = endDate ? new Date(endDate) : new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    const dailySales = [];
    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      const label = cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dateKey = cursor.toISOString().slice(0, 10);
      const total = orders.reduce((sum, order) => {
        const orderDate = new Date(order.date);
        return orderDate.toISOString().slice(0, 10) === dateKey ? sum + Number(order.total || 0) : sum;
      }, 0);

      dailySales.push({ label, total });
      cursor.setDate(cursor.getDate() + 1);
    }

    const maxDaily = Math.max(...dailySales.map((entry) => entry.total), 1);

    return { totalRevenue, orderCount, itemCount, averageTicket, categoryTotals, topProducts, dailySales, maxDaily };
  }, [filteredSalesOrders, startDate, endDate]);

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
    setUserMessage('');
    setBusyUserId(userId);
    try {
      if (action === 'suspend') {
        await suspendUser(userId);
      }

      if (action === 'delete') {
        await deleteUser(userId, { hardDelete: true });
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

      await loadFirebaseUsers();
    } catch (error) {
      setUserMessage(error?.message || 'Unable to complete user action.');
      window.setTimeout(() => setUserMessage(''), 3500);
    } finally {
      setBusyUserId('');
    }
  };

  const handleOrderStatusDraftChange = (orderId, status) => {
    setOrderStatusDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderId]: status,
    }));
  };

  const resetShowcaseForm = () => {
    setShowcaseForm({
      category: SHOWCASE_CATEGORIES[0],
      productId: activeProducts[0]?.id || '',
      title: '',
      description: '',
      imageFile: null,
      imageUrl: '',
    });
  };

  const handleShowcaseUploadFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setShowcaseForm((current) => ({
      ...current,
      imageFile: file,
      imageUrl: '',
    }));
  };

  const handleCreateShowcaseItem = async (event) => {
    event.preventDefault();

    // Prevent non-admins from attempting uploads — avoids repeated storage permission errors.
    if (!userProfile || (userProfile.role !== 'admin' && !isConfiguredAdminEmail(session?.email || ''))) {
      setShowcaseMessage('You are not recognized as an admin. ');
      window.setTimeout(() => setShowcaseMessage(''), 5000);
      return;
    }

    if (!showcaseForm.category || !showcaseForm.productId || (!showcaseForm.imageFile && !showcaseForm.imageUrl)) {
      setShowcaseMessage('Please select a category, product, and upload an image or provide a URL.');
      window.setTimeout(() => setShowcaseMessage(''), 4000);
      return;
    }

    setSavingShowcase(true);
    try {
      let storedImageUrl = showcaseForm.imageUrl;
      let serverCreatedItem = null;

      if (showcaseForm.imageFile) {
        // Always use server-side upload to avoid client storage permission issues.
        const actorToken = await session.getIdToken();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read file for server upload.'));
          reader.readAsDataURL(showcaseForm.imageFile);
        });

        const resp = await fetch(`${API_ORIGIN}/api/showcase`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            actorToken,
            fileName: showcaseForm.imageFile.name,
            dataUrl,
            category: showcaseForm.category,
            productId: showcaseForm.productId,
            productName: activeProducts.find((product) => product.id === showcaseForm.productId)?.name || '',
            title: showcaseForm.title.trim(),
            description: showcaseForm.description.trim(),
          }),
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body?.message || `Server upload failed with status ${resp.status}`);
        }

        const body = await resp.json();
        serverCreatedItem = body?.item || null;
        storedImageUrl = serverCreatedItem?.imageUrl || storedImageUrl;
      }

      // If the server already created the showcase item, skip client-side write.
      // The server upload endpoint returns the created item as `item` when used.
      if (!storedImageUrl) {
        throw new Error('No image URL available after upload.');
      }

      // If `serverCreatedItem` is set by the upload response, the server already
      // created the Firestore document. Otherwise, create it from the client.
      if (!serverCreatedItem) {
        await addDoc(collection(db, 'showcase'), {
          category: showcaseForm.category,
          productId: showcaseForm.productId,
          productName: activeProducts.find((product) => product.id === showcaseForm.productId)?.name || '',
          title: showcaseForm.title.trim(),
          description: showcaseForm.description.trim(),
          imageUrl: storedImageUrl,
          createdAt: new Date().toISOString(),
        });
      }

      resetShowcaseForm();
      setShowcaseMessage('Showcase photo uploaded successfully.');
    } catch (error) {
      console.error('Unable to upload showcase item:', error);
      setShowcaseMessage(error?.message || 'Unable to upload showcase item.');
    } finally {
      setSavingShowcase(false);
      window.setTimeout(() => setShowcaseMessage(''), 4000);
    }
  };

  const handleDeleteShowcaseItem = async (itemId) => {
    try {
      const actorToken = await session?.getIdToken?.(true);
      const response = await fetch(`${API_ORIGIN || ''}/api/showcase`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          actorToken,
          itemId,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || `Server delete failed with status ${response.status}`);
      }

      setShowcaseMessage('Showcase item removed.');

      setShowcaseItems((current) => current.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Unable to remove showcase item:', error);
      setShowcaseMessage(error?.message || 'Unable to remove showcase item.');
    } finally {
      window.setTimeout(() => setShowcaseMessage(''), 4000);
    }
  };

  const handleOrderStatusSave = async (orderId) => {
    const order = orders.find((entry) => entry.id === orderId);

    if (!order) {
      return;
    }

    const nextStatus = orderStatusDrafts[orderId] ?? order.status;
    const isPendingPaymentReview = order.payment?.status === 'pending_review' || order.status === 'Pending Payment Approval';
    const isPaymentApprovalArmed = Boolean(paymentApprovalDrafts[orderId]);

    if (nextStatus === order.status && !isPendingPaymentReview) {
      return;
    }

    setSalesMessage('');
    setBusyOrderId(orderId);
    try {
      if (isPendingPaymentReview) {
        if (!isPaymentApprovalArmed) {
          setSalesMessage('Click Approve Payment first, then Save to confirm approval.');
          return;
        }

        const approved = await approveOrderPayment(orderId);
        if (!approved) {
          setSalesMessage('Unable to approve payment for this order.');
          return;
        }

        setPaymentApprovalDrafts((currentDrafts) => ({
          ...currentDrafts,
          [orderId]: false,
        }));

        setSalesMessage('Payment approved.');

        if (nextStatus && nextStatus !== 'Pending Payment Approval' && nextStatus !== 'Processing') {
          const updated = await updateOrderStatus(orderId, nextStatus);
          if (!updated) {
            setSalesMessage('Payment approved, but unable to update tracking status for this order.');
          }
        }

        return;
      }

      const ok = await updateOrderStatus(orderId, nextStatus);
      if (!ok) {
        setSalesMessage('Unable to update tracking status for this order.');
      }
    } catch (error) {
      setSalesMessage(error?.message || 'Unable to update tracking status for this order.');
    } finally {
      setBusyOrderId('');
    }
  };

  const handleApprovePayment = async (orderId) => {
    setSalesMessage('');
    setPaymentApprovalDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderId]: true,
    }));
    setSalesMessage('Payment approval selected. Click Save to confirm.');
  };

  const handleRejectPayment = async (orderId) => {
    setSalesMessage('');
    setBusyOrderId(orderId);
    try {
      const ok = await rejectOrderPayment(orderId, 'Receipt proof needs verification.');
      if (!ok) {
        setSalesMessage('Unable to reject payment for this order.');
      }
    } catch (error) {
      setSalesMessage(error?.message || 'Unable to reject payment for this order.');
    } finally {
      setBusyOrderId('');
    }
  };

  const getFilteredSalesReportOrders = () => orders.filter((order) => {
    const paymentStatus = order.payment?.status;
    if (paymentStatus && paymentStatus !== 'approved') return false;

    if (startDate) {
      const start = new Date(startDate);
      const orderDate = new Date(order.date);
      if (orderDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const orderDate = new Date(order.date);
      if (orderDate > end) return false;
    }

    return true;
  });

  const getSalesReportRows = (reportOrders) => reportOrders.map((order) => {
    const quantity = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const paymentRef = order.payment?.reference || '-';
    return [
      order.id,
      order.purchaserEmail || 'Unknown buyer',
      String(quantity),
      `PHP ${Number(order.total || 0).toFixed(2)}`,
      order.status,
      paymentRef,
      new Date(order.date).toLocaleDateString(),
    ];
  });

  const handleDownloadSalesReport = async () => {
    const reportOrders = getFilteredSalesReportOrders();

    if (reportOrders.length === 0) {
      setSalesMessage('No approved sales yet. Approve receipt proofs first before exporting PDF.');
      return;
    }

    const [{ default: jsPDF }, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const autoTable = autoTableModule.default;

    const doc = new jsPDF();
    const now = new Date();
    const totalRevenue = reportOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    doc.setFontSize(16);
    doc.text('Originals Printing - Sales Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 24);
    doc.text(`Approved Orders: ${reportOrders.length}`, 14, 30);
    doc.text(`Total Sales: PHP ${totalRevenue.toFixed(2)}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Payment Ref', 'Date']],
      body: getSalesReportRows(reportOrders),
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [10, 10, 10],
      },
    });

    doc.save(`sales-report-${now.toISOString().slice(0, 10)}.pdf`);
    setSalesMessage('Sales report PDF downloaded successfully.');
  };

  const handleDownloadSalesReportExcel = () => {
    const reportOrders = getFilteredSalesReportOrders();

    if (reportOrders.length === 0) {
      setSalesMessage('No approved sales yet. Approve receipt proofs first before exporting Excel.');
      return;
    }

    const rows = [
      ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Payment Ref', 'Date'],
      ...getSalesReportRows(reportOrders),
    ];

    const csvContent = rows
      .map((row) => row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const now = new Date();
    const fileName = `sales-report-${now.toISOString().slice(0, 10)}.csv`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSalesMessage('Sales report Excel file downloaded successfully.');
  };

  const handleProductUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imagePath = `/productImage/${file.name}`;
    setProductForm((current) => ({ ...current, image: imagePath }));
    setProductMessage(`Image path set to ${imagePath}. Make sure the file exists in public/productImage.`);
    window.setTimeout(() => setProductMessage(''), 4000);
  };

  const handleSaveProduct = (event) => {
    event.preventDefault();

    if (!selectedProductId) {
      return;
    }

    updateProduct(selectedProductId, {
      ...productForm,
      price: Number(productForm.price) || 0,
      sizes: productForm.sizes.filter((s) => s.width && s.length && s.sqrMeter),
    });
    setProductMessage('Product updated successfully.');
    window.setTimeout(() => setProductMessage(''), 2500);
  };

  const handleSavePricing = async (pricingData) => {
    if (!selectedProductId) {
      return;
    }
    setSavingPricing(true);
    try {
      updateProduct(selectedProductId, pricingData);
      setProductMessage('Pricing updated successfully.');
      window.setTimeout(() => setProductMessage(''), 2500);
    } finally {
      setSavingPricing(false);
    }
  };

  const handleNewProductUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewProductForm((current) => ({ ...current, image: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = (event) => {
    event.preventDefault();

    if (!newProductForm.name || !newProductForm.price || !newProductForm.category) {
      setNewProductMessage('Please fill in all required fields (Name, Price, Category)');
      window.setTimeout(() => setNewProductMessage(''), 3000);
      return;
    }

    const newProduct = {
      id: `p-${Date.now()}`,
      name: newProductForm.name,
      price: Number(newProductForm.price) || 0,
      image: newProductForm.image,
      sizes: newProductForm.sizes
        ? newProductForm.sizes
            .split(',')
            .map((size) => size.trim())
            .filter(Boolean)
        : [],
      description: newProductForm.description,
      category: newProductForm.category,
      unitType: newProductForm.unitType || 'fixed',
      pricePerUnit: newProductForm.pricePerUnit ? Number(newProductForm.pricePerUnit) : Number(newProductForm.price),
      dimensions: {
        width: null,
        height: null,
        length: null,
      },
      isArchived: false,
    };

    addProduct(newProduct);
    
    setNewProductForm({
      name: '',
      price: '',
      image: '',
      sizes: '',
      description: '',
      category: '',
      unitType: 'fixed',
      pricePerUnit: '',
    });
    setShowCreateForm(false);
    setNewProductMessage('Product created successfully!');
    window.setTimeout(() => setNewProductMessage(''), 2500);
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
        <div className="w-full max-w-none px-3 sm:px-6 md:px-10 py-3 sm:py-5 flex flex-col gap-2 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[9px] sm:text-xs uppercase tracking-[0.35em] text-emerald-400">Admin Control Center</p>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase">Operations dashboard</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-zinc-400">Signed in as {userProfile?.email || session.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link to="/shop" className="rounded-full border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-zinc-300 hover:border-emerald-400 hover:text-emerald-300 transition-colors">
              View shop
            </Link>
            <Link to="/admin/signup" className="rounded-full border border-emerald-400 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-200 transition-colors">
              Create admin account
            </Link>
            <button onClick={() => signOut()} className="rounded-full bg-emerald-400 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-950 hover:bg-emerald-300 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <main className="w-full max-w-none px-3 sm:px-6 md:px-10 py-6 sm:py-10">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 md:p-8">
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <p className="text-[9px] sm:text-xs uppercase tracking-[0.35em] text-emerald-400">Admin sections</p>
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight">Manage everything</h2>
              <p className="text-xs sm:text-sm text-zinc-400">Select the area you want to work with, then use the panel to the right.</p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {[
                { value: 'dashboard', label: 'Dashboard' },
                { value: 'products', label: 'Products' },
                { value: 'showcase', label: 'Showcase' },
                { value: 'users', label: 'Users' },
                { value: 'feedbacks', label: 'Feedback' },
                { value: 'sales', label: 'Sales' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`w-full rounded-2xl sm:rounded-3xl border px-3 sm:px-4 py-2.5 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] transition ${
                    activeTab === tab.value
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-zinc-200 hover:border-emerald-400 hover:bg-emerald-400/5'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {tab.value === 'feedbacks' && <Bell size={14} />}
                    {tab.label}
                    {tab.value === 'feedbacks' && feedbackInbox.length > 0 && (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold tracking-normal text-emerald-300 normal-case">
                        {feedbackInbox.length}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6 sm:space-y-10">
            {activeTab === 'dashboard' && (
              <>
                <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Active users', value: metrics.activeUsers, icon: Users },
                    { label: 'Total users', value: metrics.registeredUsers, icon: Users },
                    { label: 'Pending approvals', value: metrics.pendingPaymentOrdersCount, icon: Bell },
                    { label: 'Items sold', value: metrics.soldItems, icon: ShoppingBag },
                    { label: 'Active products', value: activeProducts.length, icon: UserRoundCog },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="rounded-2xl sm:rounded-4xl border border-white/15 bg-slate-950/90 p-4 sm:p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
                        <div className="flex items-start justify-between gap-3 sm:gap-4">
                          <div>
                            <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-300">{item.label}</p>
                            <p className="mt-2 sm:mt-4 text-2xl sm:text-4xl font-black tracking-tight text-white">{item.value}</p>
                          </div>
                          <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-2xl sm:rounded-3xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20 shrink-0">
                            <Icon size={20} className="sm:w-6 sm:h-6" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>

                <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 md:p-8">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Active users</span>
                        <span className="font-semibold text-zinc-100">{metrics.activeUsers}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Registered users</span>
                        <span className="font-semibold text-zinc-100">{metrics.registeredUsers}</span>
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
                        <span className="text-zinc-400">Normal user sales</span>
                        <span className="font-semibold text-zinc-100">₱{metrics.revenueFromNormalUsers.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
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

                  <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <BarChart3 size={18} className="text-emerald-300 shrink-0" />
                      <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight">Recent sales</h2>
                    </div>

                    <div className="space-y-2 sm:space-y-3 max-h-96 overflow-auto pr-1">
                      {orders.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">
                          No purchases recorded yet.
                        </div>
                      ) : (
                        orders.map((order) => {
                          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                          return (
                            <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs sm:text-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-zinc-100 text-[11px] sm:text-sm">{order.purchaserEmail || 'Unknown buyer'}</p>
                                  <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-500">
                                    {order.purchaserRole || 'customer'} · {new Date(order.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-semibold text-emerald-300 text-xs sm:text-sm">₱{order.total.toFixed(2)}</p>
                                  <p className="text-[8px] sm:text-xs text-zinc-500">{itemCount} items</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'products' && (
              <div className="space-y-4 sm:space-y-6">
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
                            <p className="text-lg font-semibold text-emerald-300">₱{product.price}</p>
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

                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div>
                        <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-emerald-400">Product creation</p>
                        <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black uppercase tracking-tight">Add new product</h2>
                      </div>
                      <Plus size={18} className="text-emerald-300 shrink-0" />
                    </div>

                    {!showCreateForm ? (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="rounded-xl sm:rounded-2xl bg-emerald-400 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-slate-950 hover:bg-emerald-300"
                      >
                        + Create New Product
                      </button>
                    ) : (
                      <form onSubmit={handleCreateProduct} className="space-y-3 sm:space-y-4">
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                          <label className="space-y-2 text-sm text-zinc-300">
                            <span>Product name *</span>
                            <input
                              type="text"
                              value={newProductForm.name}
                              onChange={(event) => setNewProductForm((current) => ({ ...current, name: event.target.value }))}
                              placeholder="e.g., Premium Tarpaulin"
                              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                              required
                            />
                          </label>

                          <label className="space-y-2 text-sm text-zinc-300">
                            <span>Category *</span>
                            <div className="relative">
                              <select
                                value={newProductForm.category}
                                onChange={(event) => setNewProductForm((current) => ({ ...current, category: event.target.value }))}
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-zinc-50 outline-none focus:border-emerald-400 appearance-none"
                                required
                              >
                                <option value="" className="bg-slate-950 text-zinc-50" disabled>Select category</option>
                                {categoryOptions.map((c) => (
                                  <option key={c} value={c} className="bg-slate-950 text-zinc-50">{c}</option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">▾</span>
                            </div>
                          </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2 text-sm text-zinc-300">
                            <span>Base Price (₱) *</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={newProductForm.price}
                              onChange={(event) => setNewProductForm((current) => ({ ...current, price: event.target.value }))}
                              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                              required
                            />
                          </label>

                          <label className="space-y-2 text-sm text-zinc-300">
                            <span>Pricing Unit Type</span>
                            <div className="relative">
                              <select
                                value={newProductForm.unitType}
                                onChange={(event) => setNewProductForm((current) => ({ ...current, unitType: event.target.value }))}
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-zinc-50 outline-none focus:border-emerald-400 appearance-none"
                              >
                                <option value="fixed" className="bg-slate-950 text-zinc-50">Fixed Price</option>
                                <option value="sq_ft" className="bg-slate-950 text-zinc-50">Square Feet</option>
                                <option value="linear_meter" className="bg-slate-950 text-zinc-50">Linear Meters</option>
                                <option value="sq_inch" className="bg-slate-950 text-zinc-50">Square Inches</option>
                              </select>
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">▾</span>
                            </div>
                          </label>
                        </div>

                        {newProductForm.unitType !== 'fixed' && (
                          <label className="space-y-2 text-sm text-zinc-300">
                            <span>Price per {newProductForm.unitType === 'linear_meter' ? 'meter' : 'unit'} (₱)</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={newProductForm.pricePerUnit}
                              onChange={(event) => setNewProductForm((current) => ({ ...current, pricePerUnit: event.target.value }))}
                              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                            />
                          </label>
                        )}

                        <label className="space-y-2 text-sm text-zinc-300 block">
                          <span>Image URL or upload</span>
                          <input
                            type="url"
                            value={newProductForm.image}
                            onChange={(event) => setNewProductForm((current) => ({ ...current, image: event.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                            placeholder="https://..."
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleNewProductUpload}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                          />
                        </label>

                        <label className="space-y-2 text-sm text-zinc-300 block">
                          <span>Sizes</span>
                          <input
                            type="text"
                            value={newProductForm.sizes}
                            onChange={(event) => setNewProductForm((current) => ({ ...current, sizes: event.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                            placeholder="S, M, L, XL"
                          />
                          <p className="text-xs text-zinc-500">Separate sizes with commas. Leave empty if not applicable.</p>
                        </label>

                        <label className="space-y-2 text-sm text-zinc-300 block">
                          <span>Description</span>
                          <textarea
                            rows="4"
                            value={newProductForm.description}
                            onChange={(event) => setNewProductForm((current) => ({ ...current, description: event.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                            placeholder="Describe the product..."
                          />
                        </label>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-slate-950 hover:bg-emerald-300"
                          >
                            Create Product
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateForm(false);
                              setNewProductForm({
                                name: '',
                                price: '',
                                image: '',
                                sizes: '',
                                description: '',
                                category: '',
                                unitType: 'fixed',
                                pricePerUnit: '',
                              });
                            }}
                            className="flex-1 rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-zinc-300 hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Cancel
                          </button>
                        </div>

                        {newProductMessage && (
                          <p className={`text-sm ${newProductMessage.includes('created') ? 'text-emerald-300' : 'text-red-300'}`}>
                            {newProductMessage}
                          </p>
                        )}
                      </form>
                    )}
                  </div>

                  <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div>
                        <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-emerald-400">Product editor</p>
                        <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black uppercase tracking-tight">Edit image, price, sizes</h2>
                      </div>
                      <Upload size={18} className="text-emerald-300 shrink-0" />
                    </div>

                    {activeProducts.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">
                        No active products available to edit.
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProduct} className="space-y-3 sm:space-y-4">
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                          <label className="space-y-2 text-sm text-zinc-300">
                            <span>Choose product</span>
                            <select
                              value={selectedProductId}
                              onChange={(event) => setSelectedProductId(event.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                            >
                              {activeProducts.map((product) => (
                                <option key={product.id} value={product.id} className="bg-slate-950 text-zinc-50">
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="space-y-2 text-sm text-zinc-300">
                            <span>Price</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={productForm.price}
                              onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                            />
                          </label>
                        </div>

                        <label className="space-y-2 text-sm text-zinc-300 block">
                          <span>Image URL or upload</span>
                          <input
                            type="url"
                            value={productForm.image}
                            onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                            placeholder="https://..."
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductUpload}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                          />
                        </label>

                        <label className="space-y-2 text-sm text-zinc-300 block">
                          <span>Sizes</span>
                          <input
                            type="text"
                            value={productForm.sizes}
                            onChange={(event) => setProductForm((current) => ({ ...current, sizes: event.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                            placeholder="S, M, L"
                          />
                          <p className="text-xs text-zinc-500">Separate sizes with commas.</p>
                        </label>

                        <label className="space-y-2 text-sm text-zinc-300 block">
                          <span>Description</span>
                          <textarea
                            rows="4"
                            value={productForm.description}
                            onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                          />
                        </label>

                        <button
                          type="submit"
                          className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.25em] text-slate-950 hover:bg-emerald-300"
                        >
                          Save Product
                        </button>

                        {productMessage && <p className="text-sm text-emerald-300">{productMessage}</p>}
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'showcase' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 md:p-8">
                  <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-emerald-400">Showcase gallery</p>
                      <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black uppercase tracking-tight">Upload showcase work</h2>
                    </div>
                    <Upload size={18} className="text-emerald-300 shrink-0" />
                  </div>
                  <form onSubmit={handleCreateShowcaseItem} className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-zinc-300">
                        <span>Category</span>
                        <select
                          value={showcaseForm.category}
                          onChange={(event) => setShowcaseForm((current) => ({ ...current, category: event.target.value }))}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                        >
                          {SHOWCASE_CATEGORIES.map((category) => (
                            <option key={category} value={category} className="bg-slate-950 text-zinc-50">
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2 text-sm text-zinc-300">
                        <span>Product</span>
                        <select
                          value={showcaseForm.productId}
                          onChange={(event) => setShowcaseForm((current) => ({ ...current, productId: event.target.value }))}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                        >
                          {activeProducts.map((product) => (
                            <option key={product.id} value={product.id} className="bg-slate-950 text-zinc-50">
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                      <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-zinc-300">
                        <span>Title</span>
                        <input
                          type="text"
                          value={showcaseForm.title}
                          onChange={(event) => setShowcaseForm((current) => ({ ...current, title: event.target.value }))}
                          className="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-zinc-50 outline-none focus:border-emerald-400 text-xs sm:text-sm"
                          placeholder="Optional title"
                        />
                      </label>
                      <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-zinc-300">
                        <span>Description</span>
                        <input
                          type="text"
                          value={showcaseForm.description}
                          onChange={(event) => setShowcaseForm((current) => ({ ...current, description: event.target.value }))}
                          className="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-zinc-50 outline-none focus:border-emerald-400 text-xs sm:text-sm"
                          placeholder="Optional description"
                        />
                      </label>
                    </div>

                    <label className="space-y-2 text-sm text-zinc-300 block">
                      <span>Image URL or upload *</span>
                      <input
                        type="url"
                        value={showcaseForm.imageUrl}
                        onChange={(event) => setShowcaseForm((current) => ({ ...current, imageUrl: event.target.value, imageFile: null }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none focus:border-emerald-400"
                        placeholder="https://..."
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleShowcaseUploadFile}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                      />
                      <p className="text-xs text-zinc-500">Use either an image URL or upload a photo directly.</p>
                    </label>

                    <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row">
                      <button
                        type="submit"
                        disabled={savingShowcase}
                        className="flex-1 rounded-xl sm:rounded-2xl bg-emerald-400 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingShowcase ? 'Uploading…' : 'Upload Showcase Photo'}
                      </button>
                      <button
                        type="button"
                        onClick={resetShowcaseForm}
                        className="flex-1 rounded-xl sm:rounded-2xl border border-white/10 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-zinc-300 hover:border-emerald-400 hover:text-emerald-300"
                      >
                        Reset
                      </button>
                    </div>

                    {showcaseMessage && (
                      <p className="text-sm text-emerald-300">{showcaseMessage}</p>
                    )}
                  </form>
                </div>

                <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 md:p-8">
                  <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-emerald-400">Current showcase items</p>
                      <h3 className="mt-1 sm:mt-2 text-base sm:text-xl font-black uppercase tracking-tight">Gallery entries</h3>
                    </div>
                    <span className="text-xs sm:text-sm text-zinc-400">{showcaseItems.length} item{showcaseItems.length === 1 ? '' : 's'}</span>
                  </div>

                  {showcaseItems.length === 0 ? (
                    <div className="rounded-2xl sm:rounded-3xl border border-dashed border-white/10 p-6 sm:p-8 text-center text-sm sm:text-base text-zinc-500">
                      No showcase photos added yet.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {showcaseItems.map((item) => (
                        <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                          <div className="aspect-square overflow-hidden bg-zinc-900">
                            <img src={item.imageUrl} alt={item.title || item.category} className="h-full w-full object-cover" />
                          </div>
                          <div className="p-4 space-y-2">
                            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">{item.category}</p>
                            {item.title && <h4 className="text-lg font-semibold text-zinc-50">{item.title}</h4>}
                            {item.description && <p className="text-sm text-zinc-400 line-clamp-2">{item.description}</p>}
                            <p className="text-xs text-zinc-500">{item.productName || 'Unlinked product'}</p>
                            <button
                              type="button"
                              onClick={() => handleDeleteShowcaseItem(item.id)}
                              className="mt-3 rounded-full border border-rose-400/30 px-3 py-2 text-xs font-bold uppercase tracking-[0.3em] text-rose-200 hover:border-rose-300"
                            >
                              Remove
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-emerald-400">User control</p>
                    <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black uppercase tracking-tight">Account moderation</h2>
                  </div>
                  <ShieldCheck size={18} className="text-emerald-300 shrink-0" />
                </div>

                <div className="space-y-3 sm:space-y-4 max-h-136 overflow-auto pr-1">
                  {accountUsers.map((user) => (
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

                  {userMessage && (
                    <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                      {userMessage}
                    </p>
                  )}

                  {accountUsers.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">
                      No user accounts are available.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'feedbacks' && (
              <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/80 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-emerald-400">Customer notifications</p>
                    <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black uppercase tracking-tight">Feedback inbox</h2>
                    <p className="mt-1 text-xs sm:text-sm text-zinc-400">Messages customers submit after completing an order.</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-300">
                    {(() => {
                      const filtered = feedbackInbox.filter((f) => !feedbackStarFilter || f.rating === parseInt(feedbackStarFilter));
                      return `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
                    })()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackStarFilter('')}
                    className={`rounded-full border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-xs font-semibold uppercase tracking-[0.28em] transition ${
                      feedbackStarFilter === ''
                        ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
                        : 'border-white/10 bg-slate-950 text-zinc-300 hover:border-emerald-400 hover:text-emerald-200'
                    }`}
                  >
                    All
                  </button>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackStarFilter(star.toString())}
                      className={`rounded-full border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-xs font-semibold uppercase tracking-[0.28em] transition flex items-center gap-1 ${
                        feedbackStarFilter === star.toString()
                          ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                          : 'border-white/10 bg-slate-950 text-zinc-300 hover:border-amber-400 hover:text-amber-200'
                      }`}
                    >
                      <Star size={10} />
                      {star}
                    </button>
                  ))}
                </div>

                {feedbackInbox.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">
                    No customer feedback yet.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 max-h-112 overflow-auto pr-1">
                    {feedbackInbox
                      .filter((f) => !feedbackStarFilter || f.rating === parseInt(feedbackStarFilter))
                      .map((feedback) => {
                        const customerName = feedback.customerName || feedback.customerEmail || 'Customer';
                        const submittedAt = feedback.submittedAt ? new Date(feedback.submittedAt).toLocaleString() : '';

                        return (
                          <article key={feedback.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 shadow-sm shadow-black/10">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-zinc-100 truncate">{customerName}</p>
                                <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-zinc-500 truncate">Order {feedback.orderId}</p>
                              </div>
                              <div className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-200 shrink-0">
                                <Star size={10} />
                                {feedback.rating || 0}/5
                              </div>
                            </div>

                            <p className="text-xs sm:text-sm text-zinc-200 leading-6">{feedback.comment}</p>
                            <p className="mt-3 text-[8px] sm:text-[10px] uppercase tracking-[0.28em] text-zinc-500">{submittedAt}</p>
                          </article>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-4 md:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={20} className="text-emerald-300" />
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tight">Sales analytics</h2>
                      <p className="mt-1 text-sm text-zinc-400">Revenue, product and category performance for approved sales.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {[
                      { label: '7d', value: '7d' },
                      { label: '30d', value: '30d' },
                      { label: 'All', value: 'all' },
                    ].map((range) => (
                      <button
                        key={range.value}
                        type="button"
                        onClick={() => handleSelectRange(range.value)}
                        className={`rounded-full border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-xs font-semibold uppercase tracking-[0.28em] transition ${
                          selectedRange === range.value
                            ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
                            : 'border-white/10 bg-slate-950 text-zinc-300 hover:border-emerald-400 hover:text-emerald-200'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs text-zinc-400">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setSelectedRange('custom');
                        setStartDate(e.target.value);
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-emerald-400"
                    />
                    <label className="text-xs text-zinc-400">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setSelectedRange('custom');
                        setEndDate(e.target.value);
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadSalesReport}
                      className="rounded-lg sm:rounded-2xl border border-emerald-400/40 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-emerald-200 hover:border-emerald-300 hover:text-emerald-100 flex items-center gap-1 sm:gap-2 shrink-0"
                    >
                      <Download size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Download PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSalesReportExcel}
                      className="rounded-lg sm:rounded-2xl border border-cyan-400/40 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-cyan-200 hover:border-cyan-300 hover:text-cyan-100 flex items-center gap-1 sm:gap-2 shrink-0"
                    >
                      <Download size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Download Excel</span>
                      <span className="sm:hidden">Excel</span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-4 sm:mb-6">
                  {[{
                    label: 'Sales',
                    value: `₱${salesAnalytics.totalRevenue.toFixed(2)}`,
                    description: `${salesAnalytics.orderCount} approved orders`,
                  }, {
                    label: 'Orders',
                    value: salesAnalytics.orderCount,
                    description: `${salesAnalytics.itemCount} items sold`,
                  }, {
                    label: 'Average Ticket',
                    value: `₱${salesAnalytics.averageTicket.toFixed(2)}`,
                    description: 'Per approved order',
                  }, {
                    label: 'Products sold',
                    value: salesAnalytics.itemCount,
                    description: 'Total quantity',
                  }].map((card) => (
                    <div key={card.label} className="group rounded-4xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm transition duration-300 hover:border-emerald-400/30 hover:bg-slate-950/95 hover:-translate-y-0.5">
                      <div className="h-1 w-14 rounded-full bg-linear-to-r from-emerald-300 via-cyan-300 to-sky-500 shadow-[0_0_20px_rgba(52,211,153,0.18)]" />
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">{card.label}</p>
                        <span className="inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-300">Live</span>
                      </div>
                      <p className="mt-5 text-4xl font-black tracking-tight text-white">{card.value}</p>
                      <p className="mt-3 text-sm text-zinc-400">{card.description}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="rounded-4xl border border-white/10 bg-slate-950/85 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-5 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Daily revenue</p>
                        <p className="text-sm text-zinc-400">Revenue movement across the selected range.</p>
                      </div>
                      <span className="inline-flex rounded-full bg-white/5 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-300 shrink-0">{salesAnalytics.dailySales.length} days</span>
                    </div>
                    <ChartContainer className="h-48 sm:h-64 lg:h-72 rounded-xl sm:rounded-[1.75rem] bg-slate-950/70 p-2 sm:p-3" config={{ revenue: { color: '#34d399' } }}>
                      <AreaChart data={salesAnalytics.dailySales} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} tickFormatter={(value) => `₱${value}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 10 }} formatter={(value) => `₱${value.toFixed(2)}`} />
                        <Area type="monotone" dataKey="total" stroke="#34d399" fill="rgba(52,211,153,0.18)" strokeWidth={2} />
                      </AreaChart>
                    </ChartContainer>
                  </div>

                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/85 p-3 sm:p-4 shadow-2xl shadow-black/20 backdrop-blur-sm flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-3 sm:gap-4 px-2 sm:px-4 pt-2 sm:pt-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Top products</p>
                          <p className="text-sm text-zinc-400">Revenue share for your best sellers.</p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500">By revenue</span>
                      </div>
                      {salesAnalytics.topProducts.length === 0 ? (
                        <div className="grid h-80 place-items-center rounded-2xl border border-dashed border-white/10 text-sm text-zinc-500">No product revenue yet.</div>
                      ) : (
                        <ChartContainer className="h-80 rounded-3xl bg-slate-950/80 p-4" config={{ revenue: { color: '#f59e0b' } }}>
                          <PieChart>
                            <Pie
                              data={salesAnalytics.topProducts}
                              dataKey="revenue"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              startAngle={90}
                              endAngle={-270}
                              innerRadius={48}
                              outerRadius={78}
                              paddingAngle={6}
                              stroke="#0f172a"
                              strokeWidth={2}
                              labelLine={false}
                            >
                              {salesAnalytics.topProducts.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={['#34d399', '#60a5fa', '#f59e0b', '#a855f7', '#f97316'][index % 5]}
                                />
                              ))}
                              <Label
                                value={`₱${salesAnalytics.topProducts.reduce((sum, item) => sum + item.revenue, 0).toFixed(0)}`}
                                position="center"
                                fill="#f8fafc"
                                style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}
                              />
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 14, padding: 14 }}
                              formatter={(value) => `₱${value.toFixed(2)}`}
                              labelStyle={{ color: '#e2e8f0', fontSize: 13 }}
                              itemStyle={{ color: '#e2e8f0', fontSize: 13 }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={44}
                              iconType="circle"
                              wrapperStyle={{ paddingTop: 8 }}
                              formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: 12 }}>{value}</span>}
                              iconSize={10}
                            />
                          </PieChart>
                        </ChartContainer>
                      )}
                    </div>

                    <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/85 p-3 sm:p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3 sm:mb-5 gap-3 sm:gap-4">
                        <div>
                          <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-400">Category sales</p>
                          <p className="text-[10px] sm:text-sm text-zinc-400">Quantity breakdown by category.</p>
                        </div>
                        <span className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-500 shrink-0">Quantity sold</span>
                      </div>
                      {(() => {
                        const categoryData = Object.entries(salesAnalytics.categoryTotals).map(([category, count]) => ({ category, count }));
                        const categoryCount = categoryData.length;
                        let autoBarSize = 52;
                        if (categoryCount <= 3) autoBarSize = 100;
                        else if (categoryCount <= 5) autoBarSize = 72;
                        else if (categoryCount <= 8) autoBarSize = 56;
                        else if (categoryCount <= 12) autoBarSize = 40;
                        else autoBarSize = 30;

                        return (
                          <ChartContainer className="flex-1 w-full rounded-2xl bg-slate-950/80 p-2 sm:p-3 min-h-0" config={{ count: { color: '#60a5fa' } }}>
                            <BarChart data={categoryData} margin={{ top: 14, right: 6, left: 6, bottom: 34 }} barSize={autoBarSize} barCategoryGap="10%" barGap={12}>
                                <defs>
                                  <linearGradient id={`barGrad-${barGradId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#dbeafe" stopOpacity="1" />
                                    <stop offset="45%" stopColor="#93c5fd" stopOpacity="0.95" />
                                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 600, dy: 16 }} interval={0} angle={0} height={50} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 12, dx: -10 }} width={32} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 14, padding: 14 }} formatter={(value) => value} labelStyle={{ color: '#e2e8f0', fontSize: 13 }} itemStyle={{ color: '#e2e8f0', fontSize: 13 }} />
                                <Bar dataKey="count" fill={`url(#barGrad-${barGradId})`} radius={[20, 20, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                              </BarChart>
                          </ChartContainer>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.2fr_0.8fr] mb-4 sm:mb-6">
                  <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/85 p-3 sm:p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3 sm:mb-5 gap-3 sm:gap-4">
                      <div>
                        <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-400">Sales details</p>
                        <p className="text-[10px] sm:text-sm text-zinc-400">Snapshot of top-selling products in the selected period.</p>
                      </div>
                      <span className="inline-flex rounded-full bg-white/5 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-300 shrink-0">Top performers</span>
                    </div>
                    {salesAnalytics.topProducts.length === 0 ? (
                      <div className="rounded-xl sm:rounded-2xl border border-dashed border-white/10 p-3 sm:p-5 text-xs sm:text-sm text-zinc-500">
                        No product sales in the selected range.
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {salesAnalytics.topProducts.map((product) => (
                          <div key={product.name} className="rounded-2xl border border-white/10 bg-slate-950/80 p-2.5 sm:p-4 shadow-sm shadow-black/10">
                            <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                              <div>
                                <p className="font-semibold text-white text-[10px] sm:text-sm">{product.name}</p>
                                <p className="text-[8px] sm:text-xs text-zinc-500">{product.quantity} sold</p>
                              </div>
                              <p className="text-[10px] sm:text-sm font-semibold text-emerald-300 shrink-0">₱{product.revenue.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/85 p-3 sm:p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3 sm:mb-5 gap-3 sm:gap-4">
                      <div>
                        <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-400">Sales activity</p>
                        <p className="text-[10px] sm:text-sm text-zinc-400">Live metrics to keep your operations moving.</p>
                      </div>
                      <span className="inline-flex rounded-full bg-white/5 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-300 shrink-0">Live</span>
                    </div>
                    <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 sm:p-4 text-xs sm:text-sm text-zinc-200 shadow-sm shadow-black/10">
                        <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-500">Approved orders</p>
                        <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-300">{salesAnalytics.orderCount}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 sm:p-4 text-xs sm:text-sm text-zinc-200 shadow-sm shadow-black/10">
                        <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-500">Total items sold</p>
                        <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-300">{salesAnalytics.itemCount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl sm:rounded-4xl border border-white/10 bg-slate-950/85 p-3 sm:p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-400">All orders</p>
                      <p className="text-[10px] sm:text-sm text-zinc-400">Manage and review customer orders.</p>
                    </div>
                    <span className="inline-flex rounded-full bg-white/5 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-300 shrink-0">
                      {filteredSalesOrders.length} orders
                    </span>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div>
                      <label className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-500 block mb-2">Search by Order Number</label>
                      <input
                        type="text"
                        placeholder="Enter order ID..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-500 block mb-2">Filter by Status</label>
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-all cursor-pointer appearance-none"
                      >
                        <option value="">All Statuses</option>
                        <option value="Pending Payment Approval">Pending Payment Approval</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Complete">Complete</option>
                        <option value="Payment Rejected">Payment Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {filteredSalesOrders.length === 0 ? (
                      <div className="rounded-2xl sm:rounded-3xl border border-dashed border-white/10 p-5 sm:p-8 text-center text-sm text-zinc-500">
                        No orders in the selected date range.
                      </div>
                    ) : (
                      filteredSalesOrders.map((order) => {
                        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                        const isPendingPayment = order.payment?.status === 'pending_review' || order.status === 'Pending Payment Approval';

                        return (
                          <Link
                            key={order.id}
                            to={`/admin/order/${order.id}`}
                            className="group block rounded-2xl border border-white/5 bg-slate-950/40 hover:bg-slate-950/60 hover:border-emerald-400/30 p-4 sm:p-5 transition-all duration-200 cursor-pointer"
                          >
                            <div className="grid grid-cols-12 gap-4 sm:gap-5 items-start">
                              {/* Email & Date */}
                              <div className="col-span-12 sm:col-span-5 min-w-0">
                                <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-500 mb-1">Customer</p>
                                <p className="font-semibold text-white text-sm sm:text-base truncate">{order.purchaserEmail || 'Unknown buyer'}</p>
                                <p className="text-[10px] sm:text-xs text-zinc-500 mt-2">
                                  {new Date(order.date).toLocaleDateString(undefined, { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })} • <span className="text-zinc-400">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                                </p>
                              </div>

                              {/* Amount & Status */}
                              <div className="col-span-12 sm:col-span-4 text-right sm:text-left">
                                <p className="text-[8px] sm:text-xs uppercase tracking-[0.35em] text-zinc-500 mb-1">Amount</p>
                                <p className="font-bold text-emerald-300 text-lg sm:text-xl mb-2">₱{order.total.toFixed(2)}</p>
                                <span className={`inline-block rounded-lg px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.35em] ${
                                  isPendingPayment
                                    ? 'bg-amber-400/20 text-amber-200'
                                    : order.status === 'Complete'
                                    ? 'bg-emerald-400/20 text-emerald-200'
                                    : 'bg-blue-400/20 text-blue-200'
                                }`}>
                                  {order.status}
                                </span>
                              </div>

                              {/* Arrow */}
                              <div className="col-span-12 sm:col-span-3 flex justify-end">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 group-hover:bg-emerald-400/20 text-zinc-400 group-hover:text-emerald-300 transition-all">
                                  →
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
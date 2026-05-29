import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useStore } from '../context/StoreContext';
import { CheckCircle, Smartphone, Upload, AlertCircle } from 'lucide-react';

export const Checkout = () => {
  const { cart, submitOrderForPaymentReview } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedItemKey = new URLSearchParams(location.search).get('selectedItem') || '';
  const selectedCartItems = selectedItemKey
    ? cart.filter((item) => `${item.product.id}::${item.size || 'default'}` === selectedItemKey)
    : cart;
  const selectedCartTotal = selectedCartItems.reduce(
    (sum, item) => sum + (item.itemPrice || item.product.price) * item.quantity,
    0
  );
  const [submittingProof, setSubmittingProof] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [shippingSubmitted, setShippingSubmitted] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [paymentCheckoutUrl, setPaymentCheckoutUrl] = useState('');
  const [paymentConfigHint, setPaymentConfigHint] = useState('');
  const [receiptProofImage, setReceiptProofImage] = useState('');
  const [receiptProofName, setReceiptProofName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [contactErrors, setContactErrors] = useState({});
  const [shippingErrors, setShippingErrors] = useState({});
  const shouldRedirectToCart = selectedCartItems.length === 0 && !completed;

  useEffect(() => {
    if (shouldRedirectToCart) {
      navigate('/cart');
    }
  }, [shouldRedirectToCart, navigate]);

  const parseApiJson = async (response) => {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const createPaymentSession = async () => {
    const generatedReference = `ORIG-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
    const requestBody = {
      reference: generatedReference,
      amount: selectedCartTotal,
      description: `Originals Printing order ${generatedReference}`,
      customerEmail: contactEmail,
      customerName: `${firstName} ${lastName}`.trim(),
      customerPhone: '',
      customerAddress: {
        line1: addressLine,
        city,
        state: stateProvince,
        postal_code: postalCode,
        country: 'PH',
      },
    };

    setCreatingSession(true);
    setPaymentError('');
    setPaymentConfigHint('');
    setPaymentMessage('Creating PayMongo payment session...');
    setPaymentIntentId('');

    try {
      const response = await fetch('/api/payments/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await parseApiJson(response);
      if (!response.ok) {
        if (data?.hint) {
          setPaymentConfigHint(data.hint);
        }

        if (!data?.hint && [502, 503, 504].includes(response.status)) {
          setPaymentConfigHint('Payment API appears offline. Start it with: npm run api (or npm run dev).');
        }

        throw new Error(
          data?.message ||
            ([502, 503, 504].includes(response.status)
              ? 'Payment API is unreachable. Start it with: npm run api'
              : `Unable to create payment session. HTTP ${response.status}`)
        );
      }

      if (!data) {
        throw new Error('Payment API returned an empty response. Check API logs and PayMongo key.');
      }

      setPaymentReference(data.reference || generatedReference);
      setPaymentIntentId(data.paymentIntentId || '');
      setPaymentQrUrl(data.qrImageUrl || '');
      setPaymentCheckoutUrl(data.checkoutUrl || '');

      setPaymentMessage('Payment session ready. Scan the QR, pay, then upload your receipt proof below.');
    } catch (error) {
      setPaymentMessage('');
      if (error instanceof TypeError) {
        setPaymentError('Payment API is unreachable. Start it with: npm run api');
      } else {
        setPaymentError(error?.message || 'Failed to create PayMongo payment session.');
      }
    } finally {
      setCreatingSession(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!shippingSubmitted) {
      // validate contact and shipping fields before creating payment session
      const contactValid = validateContactFields();
      const shippingValid = validateShippingFields();
      if (!contactValid || !shippingValid) {
        return;
      }

      setShippingSubmitted(true);
      await createPaymentSession();
      return;
    }
  };

  const validateContactFields = () => {
    const errors = {};
    // basic email validation
    if (!contactEmail || !/^\S+@\S+\.\S+$/.test(contactEmail)) {
      errors.email = 'Enter a valid email address';
    }
    // names should contain letters, spaces, hyphens or apostrophes only
    const namePattern = /^[A-Za-zÀ-ž'\-\s]{1,50}$/;
    if (!firstName || !namePattern.test(firstName)) {
      errors.firstName = 'Enter a valid first name (letters only)';
    }
    if (!lastName || !namePattern.test(lastName)) {
      errors.lastName = 'Enter a valid last name (letters only)';
    }
    

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateShippingFields = () => {
    const errors = {};
    if (!addressLine || String(addressLine).trim().length === 0) {
      errors.addressLine = 'Address is required';
    }
    // city and state should be letters/spaces only
    const locationPattern = /^[A-Za-zÀ-ž'\-\s]{1,80}$/;
    if (!city || !locationPattern.test(city)) {
      errors.city = 'Enter a valid city (letters only)';
    }
    if (!stateProvince || !locationPattern.test(stateProvince)) {
      errors.stateProvince = 'Enter a valid state/province (letters only)';
    }
    // postal code digits only (3-10 digits)
    if (!postalCode || !/^\d{3,10}$/.test(postalCode)) {
      errors.postalCode = 'Postal code must be numeric (3-10 digits)';
    }

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReceiptUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPaymentError('Please upload an image file for receipt proof.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setPaymentError('Receipt image is too large. Upload an image smaller than 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setReceiptProofImage(result);
      setReceiptProofName(file.name);
      setPaymentError('');
    };

    reader.onerror = () => {
      setPaymentError('Unable to read the uploaded receipt. Please try another image.');
    };

    reader.readAsDataURL(file);
  };

  const handleSubmitPaymentProof = async () => {
    if (!shippingSubmitted) {
      setPaymentError('Complete shipping details and generate a payment session first.');
      return;
    }

    // Re-validate before final submission in case user modified fields
    const contactValid = validateContactFields();
    const shippingValid = validateShippingFields();
    if (!contactValid || !shippingValid) {
      setPaymentError('Please fix shipping/contact errors before submitting.');
      return;
    }

    if (!paymentReference || !paymentIntentId) {
      setPaymentError('Payment session is missing. Please try generating payment session again.');
      return;
    }

    if (!receiptProofImage) {
      setPaymentError('Upload a payment receipt proof before submitting your order.');
      return;
    }

    setSubmittingProof(true);
    try {
      const id = await submitOrderForPaymentReview({
        contact: {
          email: contactEmail,
          firstName,
          lastName,
        },
        shipping: {
          addressLine,
          city,
          stateProvince,
          postalCode,
        },
        payment: {
          reference: paymentReference,
          paymentIntentId,
          qrImageUrl: paymentQrUrl,
          proofImage: receiptProofImage,
          proofFileName: receiptProofName,
        },
        items: selectedCartItems,
        total: selectedCartTotal,
      });

      if (!id) {
        throw new Error('Unable to submit payment proof. Please try again.');
      }

      setOrderId(id);
      setCompleted(true);
      setPaymentError('');
      setPaymentMessage('Payment proof submitted. Your order is pending admin confirmation.');
    } catch (error) {
      setPaymentError(error?.message || 'Unable to submit payment proof. Please try again.');
    } finally {
      setSubmittingProof(false);
    }
  };

  if (shouldRedirectToCart) {
    return null;
  }

  if (completed) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 text-center">
        <div className="text-yellow-500 mb-6 sm:mb-8">
          <Smartphone size={64} className="sm:size-20" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-4 sm:mb-6">Pending Admin Approval</h1>
        <p className="text-base sm:text-xl font-semibold text-zinc-200 mb-3">Order #{orderId}</p>
        <p className="text-base sm:text-lg md:text-xl leading-relaxed text-zinc-100 mb-8 sm:mb-12 max-w-lg mx-auto">Your payment proof has been submitted. An admin will review and confirm your receipt shortly, and your order will be completed once approved.</p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/tracking')}
            className="py-3 px-5 sm:py-4 sm:px-8 bg-zinc-50 text-zinc-950 text-sm sm:text-base font-bold tracking-widest uppercase hover:bg-emerald-400 transition-colors"
          >
            Track Order
          </button>
          <button 
            onClick={() => navigate('/shop')}
            className="py-3 px-5 sm:py-4 sm:px-8 border border-zinc-800 text-zinc-50 text-sm sm:text-base font-bold tracking-widest uppercase hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 py-4 sm:py-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
      <div>
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-widest text-emerald-400 hover:text-emerald-100 transition-colors"
          >
            ← Back to Cart
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-8 sm:mb-12">Checkout</h1>
        
        <form onSubmit={handleCheckout} className="space-y-5 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4 sm:mb-6">Contact Info</h2>
            <div className="relative">
              <input required type="email" value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); setContactErrors((c)=>{ const copy={...c}; delete copy.email; return copy; }); }} placeholder="Email Address" className={`w-full bg-zinc-900 border p-3 sm:p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50 text-sm sm:text-base ${contactErrors.email ? 'border-red-500' : 'border-zinc-800'}`} aria-invalid={!!contactErrors.email} />
              {contactErrors.email && <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />}
            </div>
            {contactErrors.email && <p className="text-xs text-red-400 mt-1">{contactErrors.email}</p>}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="relative">
                  <input required type="text" inputMode="text" pattern="[A-Za-zÀ-ž'\- ]+" value={firstName} onPaste={(e)=>{ setFirstName(e.clipboardData.getData('text')); setContactErrors((c)=>{ const copy={...c}; delete copy.firstName; return copy; }); }} onChange={(e) => { setFirstName(e.target.value); setContactErrors((c)=>{ const copy={...c}; delete copy.firstName; return copy; }); }} placeholder="First Name" className={`w-full bg-zinc-900 border p-3 sm:p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50 text-sm sm:text-base ${contactErrors.firstName ? 'border-red-500' : 'border-zinc-800'}`} aria-invalid={!!contactErrors.firstName} />
                  {contactErrors.firstName && <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />}
                </div>
                {contactErrors.firstName && <p className="text-xs text-red-400 mt-1">{contactErrors.firstName}</p>}
              </div>
              <div>
                <div className="relative">
                  <input required type="text" inputMode="text" pattern="[A-Za-zÀ-ž'\- ]+" value={lastName} onPaste={(e)=>{ setLastName(e.clipboardData.getData('text')); setContactErrors((c)=>{ const copy={...c}; delete copy.lastName; return copy; }); }} onChange={(e) => { setLastName(e.target.value); setContactErrors((c)=>{ const copy={...c}; delete copy.lastName; return copy; }); }} placeholder="Last Name" className={`w-full bg-zinc-900 border p-3 sm:p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50 text-sm sm:text-base ${contactErrors.lastName ? 'border-red-500' : 'border-zinc-800'}`} aria-invalid={!!contactErrors.lastName} />
                  {contactErrors.lastName && <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />}
                </div>
                {contactErrors.lastName && <p className="text-xs text-red-400 mt-1">{contactErrors.lastName}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-zinc-900">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4 sm:mb-6">Shipping</h2>
            <div>
              <div className="relative">
                <input required type="text" value={addressLine} onChange={(e) => { setAddressLine(e.target.value); setShippingErrors((s)=>{ const copy={...s}; delete copy.addressLine; return copy; }); }} placeholder="Address" className={`w-full bg-zinc-900 border p-3 sm:p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50 text-sm sm:text-base ${shippingErrors.addressLine ? 'border-red-500' : 'border-zinc-800'}`} aria-invalid={!!shippingErrors.addressLine} />
                {shippingErrors.addressLine && <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />}
              </div>
              {shippingErrors.addressLine && <p className="text-xs text-red-400 mt-1">{shippingErrors.addressLine}</p>}
            </div>
            <div>
                <div className="relative">
                <input required type="text" inputMode="text" pattern="[A-Za-zÀ-ž'\- ]+" value={city} onPaste={(e)=>{ setCity(e.clipboardData.getData('text')); setShippingErrors((c)=>{ const copy={...c}; delete copy.city; return copy; }); }} onChange={(e) => { setCity(e.target.value); setShippingErrors((c)=>{ const copy={...c}; delete copy.city; return copy; }); }} placeholder="City" className={`w-full bg-zinc-900 border p-3 sm:p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50 text-sm sm:text-base ${shippingErrors.city ? 'border-red-500' : 'border-zinc-800'}`} aria-invalid={!!shippingErrors.city} />
                {shippingErrors.city && <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />}
              </div>
              {shippingErrors.city && <p className="text-xs text-red-400 mt-1">{shippingErrors.city}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="relative">
                  <input required type="text" value={stateProvince} onChange={(e) => { const v = e.target.value.replace(/[^A-Za-zÀ-ž'\-\s]/g, ''); setStateProvince(v); setShippingErrors((s)=>{ const copy={...s}; delete copy.stateProvince; return copy; }); }} placeholder="State/Province" className={`w-full bg-zinc-900 border p-3 sm:p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50 text-sm sm:text-base ${shippingErrors.stateProvince ? 'border-red-500' : 'border-zinc-800'}`} aria-invalid={!!shippingErrors.stateProvince} />
                  {shippingErrors.stateProvince && <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />}
                </div>
                {shippingErrors.stateProvince && <p className="text-xs text-red-400 mt-1">{shippingErrors.stateProvince}</p>}
              </div>
              <div>
                <div className="relative">
                  <input required type="text" value={postalCode} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setPostalCode(v); setShippingErrors((s)=>{ const copy={...s}; delete copy.postalCode; return copy; }); }} placeholder="Postal Code" className={`w-full bg-zinc-900 border p-3 sm:p-4 focus:outline-none focus:border-emerald-500 transition-colors text-zinc-50 text-sm sm:text-base ${shippingErrors.postalCode ? 'border-red-500' : 'border-zinc-800'}`} aria-invalid={!!shippingErrors.postalCode} />
                  {shippingErrors.postalCode && <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />}
                </div>
                {shippingErrors.postalCode && <p className="text-xs text-red-400 mt-1">{shippingErrors.postalCode}</p>}
              </div>
            </div>
          </div>

          {shippingSubmitted && (
            <div className="space-y-4 sm:space-y-5 pt-6 sm:pt-8 border-t border-zinc-900">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-500">Payment</h2>
              <p className="text-sm text-zinc-400">Pay via PayMongo using GCash or QR-enabled banking app.</p>

              <div className="border border-zinc-800 bg-zinc-950 p-4 sm:p-5 space-y-4">
                <div className="bg-white p-2.5 sm:p-3 w-max mx-auto rounded-sm">
                  {paymentQrUrl ? (
                    <img
                      src={paymentQrUrl}
                      alt="PayMongo checkout QR code"
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
                    />
                  ) : (
                    <div className="w-32 h-32 sm:w-40 sm:h-40 grid place-items-center text-center text-[11px] text-zinc-600 px-3">
                      {creatingSession ? 'Preparing QR...' : 'QR unavailable'}
                    </div>
                  )}
                </div>
<p className="text-[11px] sm:text-xs text-zinc-400 text-center">Ref: {paymentReference || 'Pending'} • Amount: ₱{selectedCartTotal.toFixed(2)}</p>

                <label className="w-full py-2.5 sm:py-3 border border-zinc-700 text-zinc-100 text-xs sm:text-sm font-bold uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <Upload size={16} />
                  {receiptProofName ? 'Replace Receipt Proof' : 'Upload Receipt Proof'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>

                {receiptProofImage && (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 text-center">Uploaded: {receiptProofName || 'Receipt image'}</p>
                    <img
                      src={receiptProofImage}
                      alt="Uploaded payment receipt proof"
                      className="mx-auto max-h-44 sm:max-h-52 w-auto rounded border border-zinc-800"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmitPaymentProof}
                  disabled={submittingProof || !shippingSubmitted || !receiptProofImage || !paymentReference || !paymentIntentId}
                  className="w-full py-2.5 sm:py-3 border border-zinc-700 text-xs sm:text-sm font-bold uppercase tracking-widest text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-50 text-zinc-950 hover:bg-emerald-400"
                >
                  {submittingProof ? 'Submitting Proof...' : 'Submit Proof For Admin Review'}
                </button>
              </div>

              {paymentMessage && (
                <p className="text-sm text-zinc-400">{paymentMessage}</p>
              )}

              {paymentError && <p className="text-sm text-red-400">{paymentError}</p>}
              {paymentConfigHint && <p className="text-xs text-amber-400">{paymentConfigHint}</p>}
            </div>
          )}

          <button 
            type="submit" 
            disabled={submittingProof || shippingSubmitted}
            className="w-full mt-6 sm:mt-10 py-3 sm:py-4 bg-zinc-50 text-zinc-950 text-sm font-bold tracking-widest uppercase hover:bg-emerald-400 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {shippingSubmitted ? (creatingSession ? 'Preparing Payment Session...' : 'Payment Session Ready') : 'Continue to Payment'}
          </button>
        </form>
      </div>

      <div className="bg-zinc-950/80 border border-zinc-800 backdrop-blur-md p-3 sm:p-5 md:p-6 h-max">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4 sm:mb-6">Order Summary</h2>
        <div className="space-y-3 sm:space-y-5 mb-4 sm:mb-8 max-h-[28vh] sm:max-h-[36vh] overflow-y-auto hide-scrollbar">
          {selectedCartItems.map(item => (
            <div key={`${item.product.id}-${item.size || 'default'}`} className="border border-zinc-800 rounded p-2 bg-zinc-950/80">
              <div className="flex gap-3 sm:gap-4 mb-2.5">
                <div className="w-12 h-14 sm:w-14 sm:h-16 bg-zinc-950 rounded-sm overflow-hidden shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="grow flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xs uppercase tracking-wider">{item.product.name}</h3>
                    <p className="font-medium text-sm">₱{((item.itemPrice || item.product.price) * item.quantity).toFixed(2)}</p>
                  </div>
                  <p className="text-zinc-500 text-[11px] mt-1">Qty: {item.quantity} • Size: {item.size || 'One size'}</p>
                </div>
              </div>
              {item.layoutImage && (
                <div className="pt-3 border-t border-zinc-700">
                  <p className="text-xs text-emerald-400 mb-2 font-semibold">✓ Layout Uploaded</p>
                  <img src={item.layoutImage} alt="Layout" className="w-full h-auto max-h-24 object-contain rounded" />
                </div>
              )}
              {!item.layoutImage && (
                <div className="pt-3 border-t border-zinc-700">
                  <p className="text-xs text-amber-500">⚠ No layout uploaded yet</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="pt-4 sm:pt-6 border-t border-zinc-800 flex justify-between items-center text-lg sm:text-xl font-bold">
          <span className="uppercase tracking-widest">Total</span>
          <span className="text-emerald-400">₱{selectedCartTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
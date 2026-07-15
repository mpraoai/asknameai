import React, { useState } from 'react';
import {
  X, CheckCircle2, Loader2, CreditCard, IndianRupee, Shield,
  Tag, ArrowRight, Lock, Smartphone, Wallet, Building2,
  AlertCircle, RotateCcw
} from 'lucide-react';
import { PricingPlan, Campaign, getEffectivePrice } from '../services/campaignService';
import { supabase } from '../lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
  campaigns: Campaign[];
  userEmail?: string;
  userName?: string;
}

type CheckoutStep = 'review' | 'payment_method' | 'card_details' | 'upi_details' | 'processing' | 'success' | 'error';

type PaymentMethod = 'upi' | 'card' | null;

interface UPIApp {
  id: string;
  name: string;
  color: string;
  initials: string;
}

const UPI_APPS: UPIApp[] = [
  { id: 'googlepay', name: 'Google Pay', color: 'from-blue-500 to-green-500', initials: 'G' },
  { id: 'phonepe', name: 'PhonePe', color: 'from-purple-600 to-purple-800', initials: 'P' },
  { id: 'bharatpe', name: 'BharatPe', color: 'from-green-600 to-teal-700', initials: 'B' },
  { id: 'paytm', name: 'Paytm', color: 'from-blue-400 to-blue-700', initials: 'P' },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  campaigns,
  userEmail,
  userName,
}) => {
  const [step, setStep] = useState<CheckoutStep>('review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [selectedUPIApp, setSelectedUPIApp] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [error, setError] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [razorpayKey, setRazorpayKey] = useState('');

  const [checkoutUrl, setCheckoutUrl] = useState('');

  if (!isOpen || !plan) return null;

  const { price, hasDiscount, campaign } = getEffectivePrice(plan, campaigns);
  const savings = hasDiscount ? plan.original_price - price : 0;

  const createRazorpayOrder = async (): Promise<{ order_id: string; key_id: string } | null> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token || '';

    const response = await fetch(`${supabaseUrl}/functions/v1/razorpay-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        action: 'create-order',
        plan_id: plan.id,
        plan_name: plan.name,
        amount: price,
        user_email: userEmail || '',
        user_name: userName || '',
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create order (${response.status})`);
    }

    const data = await response.json();
    return { order_id: data.order_id, key_id: data.key_id };
  };

  const verifyPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<boolean> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token || '';

    const response = await fetch(`${supabaseUrl}/functions/v1/razorpay-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        action: 'verify-payment',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: price,
      }),
    });

    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.verified === true;
  };

  const openRazorpayCheckout = async (method: 'upi' | 'card') => {
    setStep('processing');
    setError('');

    try {
      const order = await createRazorpayOrder();
      if (!order) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      setOrderId(order.order_id);
      setRazorpayKey(order.key_id);

      const amountInPaise = Math.round(price * 100);

      // Build standalone checkout URL — opens in a popup window to avoid iframe restrictions
      const checkoutParams = new URLSearchParams({
        order_id: order.order_id,
        key_id: order.key_id,
        amount: amountInPaise.toString(),
        plan_name: plan.name,
        user_name: userName || '',
        user_email: userEmail || '',
        method,
      });

      const checkoutUrl = `${window.location.origin}/checkout.html?${checkoutParams.toString()}`;
      setCheckoutUrl(checkoutUrl);

      // Open popup window
      const popup = window.open(
        checkoutUrl,
        'razorpay-checkout',
        'width=500,height=650,scrollbars=yes,resizable=yes,status=yes,location=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Listen for payment result from popup
      const messageHandler = async (event: MessageEvent) => {
        if (event.data?.type !== 'razorpay-payment-result') return;

        window.removeEventListener('message', messageHandler);

        if (event.data.success && event.data.razorpay_payment_id) {
          const verified = await verifyPayment(
            event.data.razorpay_order_id,
            event.data.razorpay_payment_id,
            event.data.razorpay_signature
          );
          if (verified) {
            setPaymentId(event.data.razorpay_payment_id);
            setStep('success');
          } else {
            setError('Payment verification failed. Please contact support.');
            setStep('error');
          }
        } else {
          setError(event.data.error || 'Payment was not completed.');
          setStep('error');
        }
      };

      window.addEventListener('message', messageHandler);

      // Poll to check if popup was closed manually
      const popupCheck = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheck);
          window.removeEventListener('message', messageHandler);
          setStep((prev) => {
            if (prev === 'processing') {
              setError('Payment window was closed. Please try again.');
              return 'error';
            }
            return prev;
          });
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('error');
    }
  };

  const handleProceedToPayment = () => {
    setStep('payment_method');
    setError('');
  };

  const handleUPIPay = () => {
    openRazorpayCheckout('upi');
  };

  const handleCardPay = (e: React.FormEvent) => {
    e.preventDefault();
    openRazorpayCheckout('card');
  };

  const handleClose = () => {
    setStep('review');
    setPaymentMethod(null);
    setSelectedUPIApp(null);
    setUpiId('');
    setCardData({ number: '', expiry: '', cvv: '', name: '' });
    setError('');
    setPaymentId('');
    setOrderId('');
    onClose();
  };

  const handleRetry = () => {
    setStep('payment_method');
    setError('');
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {step === 'success' ? 'Payment Successful' : 'Checkout'}
            </h2>
            {step !== 'success' && step !== 'processing' && (
              <p className="text-indigo-200 text-sm mt-1">Amount: ₹{price}</p>
            )}
          </div>
          <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl font-bold text-indigo-600">
                    <IndianRupee className="w-7 h-7 inline" />{price}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-gray-400 line-through">₹{plan.original_price}</span>
                      <span className="bg-amber-100 text-amber-700 text-sm font-bold px-2 py-0.5 rounded-full">
                        Save ₹{savings}
                      </span>
                    </>
                  )}
                </div>

                {campaign && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      <span className="font-semibold">{campaign.discount_label}</span> — {campaign.title}
                    </span>
                  </div>
                )}

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm">Order Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer</span>
                    <span className="text-gray-800 font-medium">{userName || 'Guest'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-800 font-medium">{userEmail || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan</span>
                    <span className="text-gray-800 font-medium">{plan.name}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-700 font-semibold">Total</span>
                    <span className="text-indigo-600 font-bold text-lg">₹{price}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Proceed to Payment <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Payment Method Selection */}
          {step === 'payment_method' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Select Payment Method</h3>
                <p className="text-sm text-gray-500">Choose your preferred way to pay ₹{price}</p>
              </div>

              {/* UPI Option */}
              <div
                onClick={() => setStep('upi_details')}
                className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <Smartphone className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">UPI</div>
                    <div className="text-xs text-gray-500">Google Pay, PhonePe, BharatPe, Paytm</div>
                  </div>
                  <div className="flex gap-1">
                    {UPI_APPS.map((app) => (
                      <div
                        key={app.id}
                        className={`bg-gradient-to-br ${app.color} text-white text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center`}
                      >
                        {app.initials}
                      </div>
                    ))}
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-400" />
                </div>
              </div>

              {/* Card Option */}
              <div
                onClick={() => setStep('card_details')}
                className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <CreditCard className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">Credit / Debit Card</div>
                    <div className="text-xs text-gray-500">Visa, Mastercard, RuPay, Amex</div>
                  </div>
                  <div className="flex gap-1">
                    <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded">VISA</div>
                    <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">MC</div>
                    <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded">RuPay</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-400" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={() => setStep('review')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Back to Review
              </button>
            </div>
          )}

          {/* UPI Details Step */}
          {step === 'upi_details' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Pay via UPI</h3>
                <p className="text-sm text-gray-500">Select your UPI app to pay ₹{price}</p>
              </div>

              {/* UPI App Selection */}
              <div className="grid grid-cols-2 gap-4">
                {UPI_APPS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedUPIApp(app.id)}
                    className={`border-2 rounded-2xl p-5 transition-all flex flex-col items-center gap-3 ${
                      selectedUPIApp === app.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className={`bg-gradient-to-br ${app.color} text-white text-xl font-bold w-12 h-12 rounded-xl flex items-center justify-center`}>
                      {app.initials}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{app.name}</span>
                  </button>
                ))}
              </div>

              {/* UPI ID Input */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Or enter your UPI ID
                </label>
                <input
                  type="text"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Format: yourname@bankname (e.g., john@okhdfcbank)</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUPIPay}
                  disabled={!selectedUPIApp && !upiId}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" /> Pay ₹{price} via UPI
                </button>
                <button
                  onClick={() => setStep('payment_method')}
                  className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Card Details Step */}
          {step === 'card_details' && (
            <form onSubmit={handleCardPay} className="space-y-6">
              <div className="text-center mb-4">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Card Details</h3>
                <p className="text-sm text-gray-500">Enter your card information to pay ₹{price}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={3}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name on Card</label>
                  <input
                    type="text"
                    placeholder={userName || "Cardholder's name"}
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Lock className="w-4 h-4" />
                Your payment is secured with 256-bit SSL encryption via Razorpay
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" /> Pay ₹{price}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('payment_method')}
                  className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment...</h3>
              <p className="text-gray-500">Please don't close this window</p>
              <p className="text-xs text-gray-400 mt-2">A secure payment window should have opened. If it didn't,</p>
              {checkoutUrl && (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline text-sm mt-1 inline-block"
                >
                  click here to open payment
                </a>
              )}
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your <span className="font-semibold">{plan.name}</span> is now activated.
                You'll receive a confirmation email shortly.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan</span>
                    <span className="text-gray-800 font-medium">{plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="text-gray-800 font-medium">₹{price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment ID</span>
                    <span className="text-gray-800 font-medium font-mono text-xs">{paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order ID</span>
                    <span className="text-gray-800 font-medium font-mono text-xs">{orderId}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Continue to Analysis
              </button>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-6">{error}</p>

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Trust Badges */}
          {(step === 'review' || step === 'payment_method' || step === 'upi_details' || step === 'card_details') && (
            <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Shield className="w-4 h-4" /> Secure Payment
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Lock className="w-4 h-4" /> 256-bit SSL
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Wallet className="w-4 h-4" /> Powered by Razorpay
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

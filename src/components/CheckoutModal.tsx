import React, { useState, useEffect } from 'react';
import { X, Check, Loader as Loader2, CreditCard, Smartphone, Shield, ArrowRight, CircleAlert as AlertCircle } from 'lucide-react';
import { PricingPlan, Campaign, getEffectivePrice } from '../services/campaignService';
import { supabase } from '../lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  plan: PricingPlan | null;
  campaign: Campaign | null;
  userName?: string;
  userEmail?: string;
}

type Step = 'payment_method' | 'processing' | 'success' | 'error';
type PaymentMethod = 'upi' | 'card';

const UPI_APPS = [
  { id: 'googlepay', name: 'Google Pay', color: 'from-blue-500 to-green-500', initials: 'G' },
  { id: 'phonepe', name: 'PhonePe', color: 'from-purple-600 to-purple-800', initials: 'P' },
  { id: 'bharatpe', name: 'BharatPe', color: 'from-green-600 to-teal-700', initials: 'B' },
  { id: 'paytm', name: 'Paytm', color: 'from-blue-400 to-blue-700', initials: 'P' },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen, onClose, onPaymentSuccess, plan, campaign, userName = '', userEmail = '',
}) => {
  const [step, setStep] = useState<Step>('payment_method');
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [selectedUPIApp, setSelectedUPIApp] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [paymentLinkUrl, setPaymentLinkUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('payment_method');
      setError('');
      setPaymentId('');
      setPaymentLinkUrl('');
      setSelectedUPIApp('');
    }
  }, [isOpen, plan]);

  useEffect(() => {
    if (!isOpen) return;

    const messageHandler = async (event: MessageEvent) => {
      if (event.data?.type !== 'razorpay-payment-result') return;

      if (event.data.success && event.data.razorpay_payment_id) {
        const verified = await verifyPayment(
          event.data.razorpay_order_id,
          event.data.razorpay_payment_id,
          event.data.razorpay_signature
        );
        if (verified) {
          setPaymentId(event.data.razorpay_payment_id);
          setStep('success');
          setTimeout(() => onPaymentSuccess(), 1500);
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
    return () => window.removeEventListener('message', messageHandler);
  }, [isOpen, plan]);

  if (!isOpen || !plan) return null;

  const price = getEffectivePrice(plan, campaign);

  const createPaymentLink = async (method: PaymentMethod): Promise<{ url: string; order_id: string }> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token || '';

    const response = await fetch(`${supabaseUrl}/functions/v1/razorpay-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey },
      body: JSON.stringify({
        action: 'create-payment-link',
        plan_id: plan.id, plan_name: plan.name, amount: price,
        user_email: userEmail, user_name: userName, method,
        origin: window.location.origin,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create payment link (${response.status})`);
    }
    const data = await response.json();
    return { url: data.payment_link_url, order_id: data.order_id };
  };

  const verifyPayment = async (orderId: string, paymentId: string, signature: string): Promise<boolean> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token || '';

    const response = await fetch(`${supabaseUrl}/functions/v1/razorpay-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey },
      body: JSON.stringify({
        action: 'verify-payment',
        razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature,
      }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.verified === true;
  };

  const handlePay = async () => {
    setStep('processing');
    setError('');

    try {
      const result = await createPaymentLink(paymentMethod);
      setPaymentLinkUrl(result.url);

      const popup = window.open(result.url, 'razorpay-payment', 'width=500,height=650,scrollbars=yes,resizable=yes,status=yes,location=yes');
      if (!popup) return;

      const popupCheck = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheck);
          setStep((prev) => prev === 'processing' ? 'payment_method' : prev);
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-zoom-in">
        <div className="relative bg-gradient-to-br from-brand-600 to-purple-700 px-6 py-8 rounded-t-3xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-white mb-1">Secure Checkout</h2>
          <p className="text-brand-100 text-sm">Complete your payment to continue</p>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Plan</span>
              <span className="font-semibold text-gray-900">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Amount</span>
              <div className="flex items-center gap-2">
                {campaign && campaign.discount_percentage > 0 && (
                  <span className="text-gray-400 line-through text-sm">₹{plan.original_price}</span>
                )}
                <span className="text-2xl font-bold text-brand-600">₹{price}</span>
              </div>
            </div>
          </div>

          {step === 'payment_method' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">Select Payment Method</h3>

              <button onClick={() => setPaymentMethod('upi')}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'upi' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'upi' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">UPI</div>
                  <div className="text-xs text-gray-500">Google Pay, PhonePe, Paytm & more</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'upi' ? 'border-brand-600 bg-brand-600' : 'border-gray-300'}`}>
                  {paymentMethod === 'upi' && <Check className="w-4 h-4 text-white" />}
                </div>
              </button>

              {paymentMethod === 'upi' && (
                <div className="grid grid-cols-4 gap-3 pl-2">
                  {UPI_APPS.map((app) => (
                    <button key={app.id} onClick={() => setSelectedUPIApp(app.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        selectedUPIApp === app.id ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {app.initials}
                      </div>
                      <span className="text-[10px] text-gray-600 text-center leading-tight">{app.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => setPaymentMethod('card')}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'card' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'card' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Card</div>
                  <div className="text-xs text-gray-500">Credit / Debit Card</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'card' ? 'border-brand-600 bg-brand-600' : 'border-gray-300'}`}>
                  {paymentMethod === 'card' && <Check className="w-4 h-4 text-white" />}
                </div>
              </button>

              <button onClick={handlePay}
                className="w-full bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold py-4 rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-2">
                Pay ₹{price} <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                <Shield className="w-4 h-4" /> <span>Secured by Razorpay · 256-bit SSL Encryption</span>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-brand-600 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment...</h3>
              <p className="text-gray-500">Please don't close this window</p>
              <p className="text-xs text-gray-400 mt-2">A secure payment window should have opened.</p>
              {paymentLinkUrl && (
                <a href={paymentLinkUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline text-sm mt-2 inline-block">
                  Click here to open payment
                </a>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-500 mb-1">Your payment has been verified.</p>
              {paymentId && <p className="text-xs text-gray-400 mb-6">Payment ID: {paymentId}</p>}
              <p className="text-brand-600 font-medium text-sm">Redirecting to your report...</p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setStep('payment_method')} className="bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-2xl hover:shadow-lg transition-all">
                  Try Again
                </button>
                <button onClick={onClose} className="bg-gray-100 text-gray-700 font-semibold px-8 py-3 rounded-2xl hover:bg-gray-200 transition-all">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

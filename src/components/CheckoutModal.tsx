import React, { useState } from 'react';
import {
  X, CheckCircle2, Loader2, CreditCard, IndianRupee, Shield,
  Tag, ArrowRight, Lock
} from 'lucide-react';
import { PricingPlan, Campaign, getEffectivePrice } from '../services/campaignService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
  campaigns: Campaign[];
  userEmail?: string;
  userName?: string;
}

type CheckoutStep = 'review' | 'payment' | 'processing' | 'success';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  campaigns,
  userEmail,
  userName,
}) => {
  const [step, setStep] = useState<CheckoutStep>('review');
  const [error, setError] = useState('');

  if (!isOpen || !plan) return null;

  const { price, hasDiscount, campaign } = getEffectivePrice(plan, campaigns);
  const savings = hasDiscount ? plan.original_price - price : 0;

  const handleProceedToPayment = () => {
    setStep('payment');
    setError('');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setError('');

    // TODO: When Stripe is configured, this will call the Stripe checkout edge function
    // For now, simulate payment processing
    setTimeout(() => {
      setStep('success');
    }, 2000);
  };

  const handleClose = () => {
    setStep('review');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">
            {step === 'success' ? 'Payment Successful' : 'Checkout'}
          </h2>
          <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-6">
              {/* Plan Summary */}
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
                      <span className="font-semibold">{campaign.discount_label}</span> applied from {campaign.title}
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

              {/* Customer Info */}
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

          {/* Payment Step */}
          {step === 'payment' && (
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
                <p className="text-sm text-gray-500">Amount due: <span className="font-bold text-indigo-600">₹{price}</span></p>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-4 flex items-center gap-3 cursor-pointer">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Credit / Debit Card</div>
                    <div className="text-xs text-gray-500">Visa, Mastercard, RuPay, Amex</div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              {/* Card Details Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength={3}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Lock className="w-4 h-4" />
                Your payment is secured with 256-bit SSL encryption
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
                  onClick={() => setStep('review')}
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
                    <span className="text-gray-800 font-medium">PAY_{Date.now().toString().slice(-8)}</span>
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

          {/* Trust Badges */}
          {step !== 'success' && step !== 'processing' && (
            <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Shield className="w-4 h-4" /> Secure Payment
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Lock className="w-4 h-4" /> 256-bit SSL
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

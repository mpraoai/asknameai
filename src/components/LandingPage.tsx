import React, { useState, useEffect } from 'react';
import {
  Sparkles, Calculator, Baby, Smartphone, Building2, Hand,
  MessageSquare, Star, Shield, Zap, Clock, CheckCircle2,
  ChevronRight, Menu, X, Phone, Mail, MapPin, Facebook, Instagram
} from 'lucide-react';
import { Campaign } from '../services/campaignService';
import { PricingPlan } from '../services/campaignService';
import { getEffectivePrice } from '../services/campaignService';
import { CampaignBanner } from './CampaignBanner';

interface LandingPageProps {
  campaigns: Campaign[];
  pricingPlans: PricingPlan[];
  onSelectService: (service: string) => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  campaigns,
  pricingPlans,
  onSelectService,
  onOpenAuth,
  onOpenAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    {
      icon: Calculator,
      title: 'AI Name Correction',
      description: 'Chaldean numerology name alignment with 4-step verification. Get corrected name suggestions verified by expert numerologists.',
      color: 'from-indigo-500 to-purple-600',
      action: 'numerology',
      price: '₹599'
    },
    {
      icon: Baby,
      title: 'Baby Name Suggestions',
      description: 'Numerologically perfect baby names based on birth chart and religious preferences. Separate suggestions for boys & girls.',
      color: 'from-pink-500 to-rose-600',
      action: 'babynames',
      price: 'Free'
    },
    {
      icon: Smartphone,
      title: 'Mobile Numerology',
      description: 'Profession-specific lucky mobile number analysis with digit-by-digit compatibility and 5-step verification.',
      color: 'from-amber-500 to-orange-600',
      action: 'numerology',
      price: '₹299'
    },
    {
      icon: Building2,
      title: 'Business Name Correction',
      description: 'Optimize your business name and founder names for Royal Number alignment and maximum prosperity.',
      color: 'from-blue-500 to-indigo-600',
      action: 'numerology',
      price: 'On Request'
    },
    {
      icon: Hand,
      title: 'Palmistry Analysis',
      description: 'Upload your palm image for AI-powered reading of lines, mounts, and signs. 30+ page detailed report.',
      color: 'from-purple-500 to-pink-600',
      action: 'numerology',
      price: 'On Request'
    },
    {
      icon: MessageSquare,
      title: 'AI Chatbot',
      description: 'Your personal AI numerologist, available 24/7. Instant answers about career, love, health, and finances.',
      color: 'from-indigo-500 to-blue-600',
      action: 'numerology',
      price: 'Free'
    },
  ];

  const freeTools = [
    { icon: Calculator, title: 'Name Calculator', description: 'Calculate the numerology value of any name instantly' },
    { icon: Star, title: 'Numerology Chart', description: 'Generate your Lo Shu grid and birth chart' },
    { icon: Sparkles, title: 'Astrology Report', description: 'Basic Vedic astrology reading based on your birth details' },
    { icon: Zap, title: 'BaZi Calculator', description: 'Chinese Four Pillars of Destiny analysis' },
  ];

  const features = [
    { icon: Clock, title: 'Available 24/7', description: 'No appointments needed. Get instant numerological insights anytime.' },
    { icon: Calculator, title: 'Deep Birth Chart Analysis', description: 'Mulank, Bhagyank, Lo Shu grid, and Raj Yogas analysis.' },
    { icon: Shield, title: 'Vedic Science + Modern AI', description: 'Trained on classical numerology texts, verified by practising numerologists.' },
    { icon: Zap, title: 'Instant Answers', description: 'Career, love, health, and financial insights in seconds.' },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Campaign Banner */}
      {campaigns.length > 0 && <CampaignBanner campaigns={campaigns} />}

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg py-3' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 py-5'
      }`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Sparkles className={`w-7 h-7 ${scrolled ? 'text-indigo-600' : 'text-yellow-400'}`} />
            <span className={`text-2xl font-bold ${scrolled ? 'text-gray-800' : 'text-white'}`}>
              AskName<span className={scrolled ? 'text-indigo-600' : 'text-yellow-400'}>AI</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('services')} className={`font-medium hover:text-yellow-400 transition-colors ${scrolled ? 'text-gray-700' : 'text-indigo-100'}`}>Services</button>
            <button onClick={() => scrollToSection('tools')} className={`font-medium hover:text-yellow-400 transition-colors ${scrolled ? 'text-gray-700' : 'text-indigo-100'}`}>Free Tools</button>
            <button onClick={() => scrollToSection('pricing')} className={`font-medium hover:text-yellow-400 transition-colors ${scrolled ? 'text-gray-700' : 'text-indigo-100'}`}>Pricing</button>
            <button onClick={() => scrollToSection('about')} className={`font-medium hover:text-yellow-400 transition-colors ${scrolled ? 'text-gray-700' : 'text-indigo-100'}`}>About</button>
            <button onClick={onOpenAdmin} className={`font-medium hover:text-yellow-400 transition-colors ${scrolled ? 'text-gray-700' : 'text-indigo-100'}`}>Admin</button>
            <button
              onClick={onOpenAuth}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all transform hover:scale-105"
            >
              Login / Sign Up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white shadow-lg rounded-b-2xl mx-4 mt-2 p-6 space-y-4 animate-fadeIn">
            <button onClick={() => scrollToSection('services')} className="block w-full text-left font-medium text-gray-700 hover:text-indigo-600">Services</button>
            <button onClick={() => scrollToSection('tools')} className="block w-full text-left font-medium text-gray-700 hover:text-indigo-600">Free Tools</button>
            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left font-medium text-gray-700 hover:text-indigo-600">Pricing</button>
            <button onClick={() => scrollToSection('about')} className="block w-full text-left font-medium text-gray-700 hover:text-indigo-600">About</button>
            <button onClick={onOpenAdmin} className="block w-full text-left font-medium text-gray-700 hover:text-indigo-600">Admin</button>
            <button
              onClick={onOpenAuth}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold"
            >
              Login / Sign Up
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800">
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400 rounded-full opacity-20 blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-yellow-300 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fadeIn border border-white/20">
              <Sparkles className="w-4 h-4" />
              India's Most Trusted AI-Powered Numerology Service
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Unlock Your Life's Blueprint with <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">AI Numerology</span>
            </h1>

            <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Get instant name corrections, decade-long predictions, and personalised readings.
              Ancient Chaldean numerology meets modern AI technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => onSelectService('numerology')}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
              >
                Start Free Name Check
              </button>
              <button
                onClick={() => onSelectService('babynames')}
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all transform hover:scale-105"
              >
                Get Baby Name Suggestions
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400">1,00,000+</div>
                <div className="text-sm text-indigo-200 mt-1">Names Checked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400">21,000+</div>
                <div className="text-sm text-indigo-200 mt-1">Reports Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400">4.8★</div>
                <div className="text-sm text-indigo-200 mt-1">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Our AI-Powered Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From name corrections to decade-long predictions — each report is AI-generated and verified by expert numerologists.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={idx}
                  onClick={() => onSelectService(service.action)}
                  className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-2 group border border-purple-100"
                >
                  <div className={`bg-gradient-to-br ${service.color} rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-indigo-600">{service.price}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Numerologist Features */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Your Personal AI Numerologist</h2>
            <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
              Combining ancient Vedic wisdom with cutting-edge AI to deliver personalized numerological insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/20 transition-all">
                  <div className="bg-indigo-500/30 rounded-xl w-14 h-14 flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-indigo-200" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-indigo-200 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Free Tools Section */}
      <section id="tools" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Free Insight Tools</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful numerology tools available to everyone. No sign-up required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {freeTools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <div
                  key={idx}
                  onClick={() => onSelectService('numerology')}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 border border-indigo-100 hover:border-indigo-200"
                >
                  <div className="bg-indigo-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.title}</h3>
                  <p className="text-sm text-gray-600">{tool.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Pricing Plans</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transparent pricing for every need. Campaign discounts applied automatically during festive seasons.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => {
              const { price, hasDiscount, campaign } = getEffectivePrice(plan, campaigns);
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl p-8 shadow-lg relative transition-all hover:shadow-2xl transform hover:-translate-y-1 ${
                    plan.is_popular ? 'ring-2 ring-indigo-600 lg:scale-105' : ''
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  {hasDiscount && campaign && (
                    <div className="absolute -top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {campaign.discount_label}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    {hasDiscount && (
                      <span className="text-lg text-gray-400 line-through mr-2">₹{plan.original_price}</span>
                    )}
                    <span className="text-4xl font-bold text-gray-900">₹{price}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onSelectService('numerology')}
                    className={`w-full py-3 rounded-full font-semibold transition-all ${
                      plan.is_popular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">About AskNameAI</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              AskNameAI combines ancient Chaldean numerology with modern AI technology to deliver
              personalized numerological insights. Our system uses authentic Lo Shu grid methodology
              and driver-conductor compatibility analysis to provide accurate name corrections and predictions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Authentic Methodology</h3>
              <p className="text-sm text-gray-600">Based on authentic Chaldean numerology and Lo Shu grid methodology.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">Advanced AI algorithms trained on classical numerology texts.</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Trusted by Thousands</h3>
              <p className="text-sm text-gray-600">Serving customers across India, Australia, USA, and UAE.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Start Your Numerological Journey Today</h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Begin with a free name check or dive into a detailed AI reading. Your destiny awaits.
          </p>
          <button
            onClick={() => onSelectService('numerology')}
            className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                <span className="text-xl font-bold">AskName<span className="text-indigo-400">AI</span></span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Ancient wisdom meets modern technology. Your trusted AI-powered numerology companion.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-indigo-400">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => onSelectService('numerology')} className="hover:text-indigo-400 transition-colors">Name Correction</button></li>
                <li><button onClick={() => onSelectService('babynames')} className="hover:text-indigo-400 transition-colors">Baby Names</button></li>
                <li><button onClick={() => onSelectService('numerology')} className="hover:text-indigo-400 transition-colors">Mobile Numerology</button></li>
                <li><button onClick={() => onSelectService('numerology')} className="hover:text-indigo-400 transition-colors">Business Name</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-indigo-400">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@asknameai.com</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 91173 46555</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4" /> Mon - Sat, 10AM - 6PM</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-indigo-400">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Privacy Policy</li>
                <li>Refund Policy</li>
                <li>Terms & Conditions</li>
                <li className="flex items-center gap-2 mt-4">
                  <Facebook className="w-5 h-5 hover:text-indigo-400 cursor-pointer transition-colors" />
                  <Instagram className="w-5 h-5 hover:text-indigo-400 cursor-pointer transition-colors" />
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 AskNameAI. All rights reserved. Based on authentic Chaldean numerology and Lo Shu grid methodology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

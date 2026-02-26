import React from 'react';
import { Shield, Crown, Calendar, Star, CreditCard } from 'lucide-react';

interface PaymentLinksProps {
  onNavigate: (view: string) => void;
}

interface Product {
  id: string;
  name: string;
  price: string;
  interval: string;
  description: string;
  icon: React.ReactNode;
  stripeUrl: string;
  isRoyalty?: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: 'bot-shield',
    name: 'Bot-Shield Verification',
    price: '$1.00',
    interval: 'one-time',
    description: 'V8 Cloud Verification — Prove you\'re human. One-time fee.',
    icon: <Shield size={24} />,
    stripeUrl: 'https://buy.stripe.com/3cI3cwcR6c3910p18peEo09',
  },
  {
    id: 'founding-member',
    name: 'Founding Member',
    price: '$14.99',
    interval: '/mo',
    description: 'Locked-in founding rate. Regular price $24.99/mo after launch.',
    icon: <Crown size={24} />,
    stripeUrl: 'https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a',
  },
  {
    id: '3-month-founder',
    name: '3-Month Founder',
    price: '$39.99',
    interval: 'one-time',
    description: '3 months of Founding Member access. Save $5 vs monthly.',
    icon: <Calendar size={24} />,
    stripeUrl: 'https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j',
  },
  {
    id: '12-month-founder',
    name: '12-Month Founder',
    price: '$99.99',
    interval: 'one-time',
    description: 'Full year of Founding Member access. Best value — save $80.',
    icon: <Star size={24} />,
    stripeUrl: 'https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c',
  },
  {
    id: 'royalty-card',
    name: 'Royalty Card',
    price: '$2,500',
    interval: 'one-time',
    description: '5 exclusive Founder Cards. Link to RoyaltyDeck for details.',
    icon: <CreditCard size={24} />,
    stripeUrl: 'https://buy.stripe.com/dRmcN604kebheRf2cteEo0d',
    isRoyalty: true,
  },
];

const PaymentLinks: React.FC<PaymentLinksProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-full p-8 bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Payment Products
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          All payment links are live on Stripe. Payments redirect to youandinotai.com/success.
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-[1400px]">
        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="relative bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6 flex flex-col transition-all duration-300 hover:border-slate-600/80 hover:bg-slate-800"
          >
            {/* Live Badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30">
                Live
              </span>
            </div>

            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center text-slate-300 mb-4">
              {product.icon}
            </div>

            {/* Name */}
            <h3 className="text-base font-bold text-white mb-2">
              {product.name}
            </h3>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-2xl font-extrabold text-white font-mono">
                {product.price}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {product.interval}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-1">
              {product.description}
            </p>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              <a
                href={product.stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 cursor-pointer text-center"
              >
                Pay Now
              </a>
              {product.isRoyalty && (
                <button
                  onClick={() => onNavigate('royalty')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-all duration-200 cursor-pointer"
                >
                  Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-8 max-w-[1400px]">
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-5 py-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Payment links are created in your{' '}
            <a
              href="https://dashboard.stripe.com/payment-links"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline hover:text-white transition-colors"
            >
              Stripe Dashboard
            </a>
            . Once created, paste the live URLs here to activate checkout buttons.
            All prices shown are final launch pricing for YouAndINotAI.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentLinks;

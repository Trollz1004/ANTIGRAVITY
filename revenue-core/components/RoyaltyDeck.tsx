import React, { useState, useEffect } from 'react';

interface Card {
  id: number;
  name: string;
  title: string;
  price: number;
  perks: string[];
  status: 'available' | 'reserved' | 'sold';
  buyer?: string;
  glowColor: string;
  borderGradient: string;
}

const FOUNDER_CARDS: Card[] = [
  {
    id: 1,
    name: 'ACE OF HEARTS',
    title: 'The Visionary',
    price: 2500,
    perks: [
      'Lifetime premium membership',
      'Founding member badge (permanent)',
      'Revenue share: 0.5% of dating app gross',
      'Quarterly founder calls with Josh',
      'Name on smart contract (Base Mainnet)',
      'First access to all new features',
    ],
    status: 'available',
    glowColor: '#dc2626',
    borderGradient: 'linear-gradient(135deg, #dc2626, #f59e0b, #dc2626)',
  },
  {
    id: 2,
    name: 'KING OF HEARTS',
    title: 'The Builder',
    price: 2500,
    perks: [
      'Lifetime premium membership',
      'Founding member badge (permanent)',
      'Revenue share: 0.5% of dating app gross',
      'Direct Slack channel with founder',
      'Name on smart contract (Base Mainnet)',
      'Feature request priority queue',
    ],
    status: 'available',
    glowColor: '#f59e0b',
    borderGradient: 'linear-gradient(135deg, #f59e0b, #dc2626, #f59e0b)',
  },
  {
    id: 3,
    name: 'QUEEN OF HEARTS',
    title: 'The Guardian',
    price: 2500,
    perks: [
      'Lifetime premium membership',
      'Founding member badge (permanent)',
      'Revenue share: 0.5% of dating app gross',
      'DAO governance voting rights',
      'Name on smart contract (Base Mainnet)',
      'Charity match: your purchase doubles impact',
    ],
    status: 'available',
    glowColor: '#a855f7',
    borderGradient: 'linear-gradient(135deg, #a855f7, #dc2626, #a855f7)',
  },
  {
    id: 4,
    name: 'JACK OF HEARTS',
    title: 'The Pioneer',
    price: 2500,
    perks: [
      'Lifetime premium membership',
      'Founding member badge (permanent)',
      'Revenue share: 0.5% of dating app gross',
      'Beta tester priority access',
      'Name on smart contract (Base Mainnet)',
      'Annual founder dinner (virtual or in-person)',
    ],
    status: 'available',
    glowColor: '#22c55e',
    borderGradient: 'linear-gradient(135deg, #22c55e, #f59e0b, #22c55e)',
  },
  {
    id: 5,
    name: 'JOKER',
    title: 'The Wildcard',
    price: 2500,
    perks: [
      'ALL perks from every card above',
      'Revenue share: 1% of dating app gross',
      'Permanent advisory board seat',
      'Name on smart contract (Base Mainnet)',
      'Custom AI agent built for you',
      'Random draw — only appears when all 4 cards sell',
    ],
    status: 'reserved',
    glowColor: '#ef4444',
    borderGradient: 'linear-gradient(135deg, #ef4444, #f59e0b, #a855f7, #22c55e, #ef4444)',
  },
];

const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/dRmcN604kebheRf2cteEo0d';

const HeartIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const ShatterEffect: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 6,
            height: 6,
            background: '#ef4444',
            borderRadius: '50%',
            animation: `shatter 0.8s ease-out forwards`,
            animationDelay: `${i * 0.05}s`,
            transform: `rotate(${i * 30}deg) translateX(0)`,
          }}
        />
      ))}
    </div>
  );
};

const RoyaltyDeck: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [shatterCard, setShatterCard] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [soldCount] = useState(0);
  const totalCards = 5;

  const handleCardClick = (card: Card) => {
    if (card.status === 'sold') return;
    if (card.id === 5 && soldCount < 4) return;
    setShatterCard(card.id);
    setTimeout(() => {
      setShatterCard(null);
      setSelectedCard(card.id);
    }, 800);
  };

  const handlePurchase = (card: Card) => {
    window.open(STRIPE_CHECKOUT_URL, '_blank');
  };

  return (
    <div style={{ minHeight: '100%', padding: '32px 24px', background: 'linear-gradient(180deg, #0a0010 0%, #1a0020 50%, #0a0010 100%)' }}>
      <style>{`
        @keyframes shatter {
          0% { transform: rotate(var(--r, 0deg)) translateX(0); opacity: 1; }
          100% { transform: rotate(var(--r, 0deg)) translateX(80px); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes card-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
          ♥ Royalty Deck of Hearts ♥
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#fef2f2', lineHeight: 1.2 }}>
          5 Founder Cards. 5 Legends.
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          Own a piece of the mission. Each card is a permanent stake in YouAndINotAI — with revenue share, governance rights, and your name on the blockchain forever.
        </p>

        {/* Scarcity Counter */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 20,
          padding: '10px 20px',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: 30,
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[...Array(totalCards)].map((_, i) => (
              <div key={i} style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i < soldCount ? '#dc2626' : 'rgba(220, 38, 38, 0.2)',
                border: '1px solid rgba(220, 38, 38, 0.5)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5', fontFamily: "'JetBrains Mono', monospace" }}>
            {totalCards - soldCount} / {totalCards} AVAILABLE
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        {FOUNDER_CARDS.map((card) => {
          const isSelected = selectedCard === card.id;
          const isHovered = hoveredCard === card.id;
          const isJokerLocked = card.id === 5 && soldCount < 4;
          const isSold = card.status === 'sold';

          return (
            <div
              key={card.id}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardClick(card)}
              style={{
                position: 'relative',
                background: isSelected
                  ? 'linear-gradient(135deg, #1a0020, #2a0030)'
                  : 'linear-gradient(135deg, #12101f, #1a1530)',
                border: `2px solid ${isHovered && !isSold ? card.glowColor + '66' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 20,
                padding: 24,
                cursor: isSold || isJokerLocked ? 'not-allowed' : 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered && !isSold ? 'translateY(-4px)' : 'none',
                boxShadow: isHovered && !isSold
                  ? `0 20px 60px ${card.glowColor}22, 0 0 30px ${card.glowColor}11`
                  : 'none',
                opacity: isSold ? 0.4 : isJokerLocked ? 0.6 : 1,
                animation: isHovered && !isSold ? 'float 3s ease-in-out infinite' : 'none',
                overflow: 'hidden',
              }}
            >
              <ShatterEffect active={shatterCard === card.id} />

              {/* Glow effect */}
              {isHovered && !isSold && (
                <div style={{
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: 22,
                  background: card.borderGradient,
                  zIndex: -1,
                  opacity: 0.3,
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }} />
              )}

              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: card.glowColor, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                    {card.name}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                    {card.title}
                  </div>
                </div>
                <HeartIcon size={28} className="" />
              </div>

              {/* Price */}
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: card.glowColor,
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 16,
              }}>
                ${card.price.toLocaleString()}
                <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginLeft: 6 }}>one-time</span>
              </div>

              {/* Perks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {card.perks.map((perk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: card.glowColor, fontSize: 12, marginTop: 2 }}>♥</span>
                    <span style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>{perk}</span>
                  </div>
                ))}
              </div>

              {/* Status Badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                {isSold ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>
                    SOLD — {card.buyer}
                  </span>
                ) : isJokerLocked ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                    🔒 UNLOCKS WHEN 4 CARDS SELL
                  </span>
                ) : (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#22c55e',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    AVAILABLE
                  </span>
                )}

                {!isSold && !isJokerLocked && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePurchase(card); }}
                    style={{
                      padding: '8px 20px',
                      background: `linear-gradient(135deg, ${card.glowColor}, ${card.glowColor}cc)`,
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Claim Card
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Section */}
      <div style={{
        maxWidth: 800,
        margin: '48px auto 0',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}>
          {[
            { label: 'Blockchain Verified', detail: 'Base Mainnet (Chain 8453)', icon: '⛓️' },
            { label: 'Stripe Secured', detail: 'PCI DSS Compliant', icon: '🔒' },
            { label: 'DAO Protected', detail: 'Gnosis Safe Multi-sig', icon: '🏛️' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '16px 12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{item.detail}</div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08), rgba(168, 85, 247, 0.08))',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          borderRadius: 16,
        }}>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, margin: 0 }}>
            Every Royalty Card purchase is recorded on-chain. Your name, your stake, your legacy — immutable and transparent.
            The dating app pays the bills. The AI tools fund the kids. <strong style={{ color: '#fca5a5' }}>Forever.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoyaltyDeck;

/**
 * RoyaltyDeck.tsx — The Royalty Deck of Hearts
 *
 * Premium holographic card component showcasing the $2,500 Royalty Card.
 * 3D perspective tilt, holographic shimmer, floating hearts, and
 * Protocol Omega charity messaging.
 *
 * @license Apache-2.0
 */

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { Crown, Heart, Shield, Star, Gem, Infinity as InfinityIcon, Zap } from 'lucide-react';

const ROYALTY_LINK = 'https://buy.stripe.com/dRmcN604kebheRf2cteEo0d';

/* ─── Floating Hearts Background ─── */
function FloatingHearts() {
  const hearts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${8 + Math.random() * 84}%`,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 6,
    size: 10 + Math.random() * 14,
    opacity: 0.08 + Math.random() * 0.12,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute text-amber-400"
          style={{ left: h.left, bottom: '-20px', opacity: h.opacity }}
          animate={{ y: [0, -800], opacity: [h.opacity, 0], rotate: [0, 360] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: 'linear' }}
        >
          <Heart size={h.size} fill="currentColor" />
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Holographic Card ─── */
function HolographicCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [12, -12]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-12, 12]), { stiffness: 200, damping: 20 });

  const sheenX = useTransform(mouseX, [0, 1], ['-100%', '200%']);
  const sheenY = useTransform(mouseY, [0, 1], ['-100%', '200%']);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const benefits = [
    { icon: InfinityIcon, text: 'Lifetime VIP access — never pay again' },
    { icon: Shield, text: 'Priority matching & dedicated support' },
    { icon: Star, text: 'Exclusive Royalty badge on your profile' },
    { icon: Zap, text: 'Early access to every new feature' },
    { icon: Gem, text: 'Revenue share from platform growth' },
  ];

  return (
    <div style={{ perspective: '1200px' }} className="w-full max-w-md mx-auto">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-3xl overflow-hidden cursor-pointer group"
      >
        {/* Card base with gold gradient border */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 p-[2px]">
          <div className="w-full h-full rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        </div>

        {/* Holographic shimmer overlay */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none z-10"
          style={{
            background: `linear-gradient(
              115deg,
              transparent 20%,
              rgba(255, 215, 0, 0.08) 35%,
              rgba(255, 180, 50, 0.12) 40%,
              rgba(255, 100, 200, 0.08) 45%,
              rgba(100, 200, 255, 0.08) 50%,
              rgba(255, 215, 0, 0.12) 55%,
              transparent 70%
            )`,
            backgroundSize: '200% 200%',
            backgroundPosition: isHovering ? undefined : 'center',
            x: sheenX,
            y: sheenY,
            opacity: isHovering ? 1 : 0.3,
            mixBlendMode: 'screen',
          }}
          transition={{ opacity: { duration: 0.3 } }}
        />

        {/* Outer glow on hover */}
        <motion.div
          className="absolute -inset-1 rounded-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.2) 0%, transparent 70%)',
            opacity: isHovering ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Card content */}
        <div className="relative z-20 p-6 md:p-8">
          {/* Top row: suit corners + crown */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col items-center">
              <span className="text-amber-400 text-2xl font-black leading-none">R</span>
              <Heart size={14} className="text-red-500 fill-red-500 mt-0.5" />
            </div>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Crown size={36} className="text-amber-400 drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]" />
            </motion.div>
            <div className="flex flex-col items-center">
              <span className="text-amber-400 text-2xl font-black leading-none rotate-180">R</span>
              <Heart size={14} className="text-red-500 fill-red-500 mt-0.5" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-5">
            <h3 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 leading-tight">
              ROYALTY CARD
            </h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-amber-500/50" />
              <span className="text-xs uppercase tracking-[0.3em] text-amber-400/70 font-bold">Deck of Hearts</span>
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <div className="inline-block relative">
              <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-300 leading-none">
                $2,500
              </span>
              <motion.div
                className="absolute -top-1 -right-3"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Gem size={16} className="text-amber-400" />
              </motion.div>
            </div>
            <p className="text-amber-400/60 text-xs mt-1 uppercase tracking-widest font-bold">One-time • Lifetime access</p>
          </div>

          {/* Benefits */}
          <div className="space-y-2.5 mb-6">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i + 0.3, duration: 0.4 }}
                className="flex items-center gap-3 text-sm"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  <b.icon size={13} className="text-amber-400" />
                </div>
                <span className="text-gray-300">{b.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Charity callout */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-6 text-center">
            <p className="text-emerald-400 text-sm font-bold">
              💚 60% instantly funds Shriners Children's Hospitals
            </p>
            <p className="text-emerald-400/60 text-xs mt-0.5">
              $1,500 of your Royalty Card goes directly to the kids
            </p>
          </div>

          {/* CTA */}
          <a
            href={ROYALTY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center no-underline"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-lg shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_rgba(255,215,0,0.5)] transition-shadow"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Crown size={20} />
                Claim Your Royalty Card
              </span>
              {/* Animated shine */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              />
            </motion.div>
          </a>

          {/* Bottom suit corners */}
          <div className="flex justify-between mt-4">
            <Heart size={12} className="text-red-500/30 fill-red-500/30" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Heart key={i} size={8} className="text-red-500/20 fill-red-500/20" />
              ))}
            </div>
            <Heart size={12} className="text-red-500/30 fill-red-500/30" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Export ─── */
export function RoyaltyDeck() {
  return (
    <section className="relative z-10 py-16 md:py-24 px-4 overflow-hidden">
      {/* Ambient glow behind everything */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <FloatingHearts />

      <div className="max-w-2xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5 mb-4">
            <Crown size={14} className="text-amber-400" />
            <span className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">Limited Edition</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mb-3">
            The Royalty Deck of Hearts
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            The ultimate founding membership. Lifetime VIP status, revenue share,
            and the knowledge that <span className="text-emerald-400 font-semibold">$1,500 goes directly to children's hospitals</span>.
          </p>
        </motion.div>

        {/* The card */}
        <HolographicCard />

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mt-8 text-xs text-gray-500"
        >
          <span className="flex items-center gap-1.5">
            <Shield size={12} className="text-emerald-500" />
            30-day refund guarantee
          </span>
          <span className="flex items-center gap-1.5">
            <Heart size={12} className="text-red-400 fill-red-400" />
            Protocol Omega verified
          </span>
          <span className="flex items-center gap-1.5">
            <Star size={12} className="text-amber-400" />
            Only {Math.floor(Math.random() * 8) + 3} remaining
          </span>
        </motion.div>
      </div>
    </section>
  );
}

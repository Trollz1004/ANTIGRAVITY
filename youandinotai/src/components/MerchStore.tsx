import React, { useState } from "react";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  Heart,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { motion } from "motion/react";

const MERCH_ITEMS = [
  {
    id: "anti-ai-tee",
    name: "Anti-AI Human-Only Tee",
    price: "$35",
    desc: "Heavyweight cotton street-wear. Prove you were here before the singularity.",
    link: "https://square.link/u/wjJfoKhF", // Extracted from ai-solutions-store
    image: "https://placehold.co/400x400/1a1a1a/ffffff?text=Human+Only+Tee",
  },
  {
    id: "anti-ai-hoodie",
    name: "Identity Shield Hoodie",
    price: "$65",
    desc: "Premium fleece for the digital resistance. 60% of profits to pediatric care.",
    link: "https://square.link/u/wjJfoKhF", // Re-using link for placeholder if needed, update with specific if found
    image: "https://placehold.co/400x400/1a1a1a/ffffff?text=Identity+Hoodie",
  },
];

export const MerchStore: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-8 border-b border-white/10">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-black italic tracking-tighter text-white flex items-center gap-3">
              <ShoppingBag className="text-pink-500" />
              FOUNDER GEAR
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-zinc-400 text-sm max-w-md">
            Wear the mission.{" "}
            <span className="text-pink-400 font-bold">60% of NET proceeds</span>{" "}
            go directly to Shriners Children's Hospitals.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
          {MERCH_ITEMS.map((item) => (
            <div
              key={item.id}
              className="group bg-black/40 border border-white/5 rounded-3xl overflow-hidden hover:border-pink-500/30 transition-all"
            >
              <div className="aspect-square bg-zinc-800 relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded">
                  #FORTHEKIDS
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-white">{item.name}</h3>
                  <span className="text-pink-400 font-black">{item.price}</span>
                </div>
                <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                  {item.desc}
                </p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-pink-500 hover:text-white transition-all text-xs"
                >
                  Checkout on Square <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-6 bg-black/60 border-t border-white/10 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <Truck size={12} className="text-emerald-500" /> Global Shipping
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-blue-500" /> Secured by
              Square
            </div>
            <div className="flex items-center gap-1">
              <Heart size={12} className="text-pink-500" /> Impact Verified
            </div>
          </div>
          <div className="text-[10px] text-zinc-600 font-mono">
            Fulfillment Q2 2026 // ANTI-AI CO.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

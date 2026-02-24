import React from 'react';
import { motion } from 'motion/react';
import { 
  Recycle, 
  Heart, 
  Globe, 
  Cpu, 
  ShoppingBag, 
  ExternalLink, 
  TreeDeciduous, 
  DollarSign, 
  Smartphone 
} from 'lucide-react';

const CharityCard = ({ 
  icon: Icon, 
  name, 
  tagline, 
  url, 
  description,
  color = "from-green-400 to-green-600"
}: { 
  icon: any, 
  name: string, 
  tagline: string, 
  url: string, 
  description: string,
  color?: string
}) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.02 }}
    className="relative group"
  >
    <div className={`absolute -inset-1 bg-gradient-to-r ${color} rounded-[2.5rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200`}></div>
    <div className="relative p-8 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] h-full flex flex-col">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg shadow-green-500/20`}>
        <Icon className="text-white" size={32} />
      </div>
      <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{name}</h3>
      <p className="text-green-400 font-bold text-xs uppercase tracking-widest mb-4">{tagline}</p>
      <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">
        {description}
      </p>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white font-bold hover:bg-green-500 hover:border-green-400 transition-all group/btn"
      >
        Visit Platform
        <ExternalLink size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </a>
    </div>
  </motion.div>
);

const Particle = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ y: '100%', opacity: 0, x: Math.random() * 100 + '%' }}
    animate={{ 
      y: '-10%', 
      opacity: [0, 1, 1, 0],
      x: (Math.random() * 100 - 50) + '%'
    }}
    transition={{ 
      duration: Math.random() * 10 + 10, 
      repeat: Infinity, 
      delay,
      ease: "linear"
    }}
    className="absolute w-1 h-1 bg-green-400 rounded-full blur-[1px]"
  />
);

export function CharitySection() {
  return (
    <section id="charity-section" className="relative min-h-screen py-24 px-6 overflow-hidden bg-gradient-to-b from-black via-[#0a1a0f] to-[#051009]">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <Particle key={i} delay={i * 0.5} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-[0.3em]"
          >
            <Recycle size={14} />
            Give Back & Go Green
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black tracking-tighter text-white leading-none"
          >
            Every Match. Every Device. <br/>
            Every Dollar. <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">FOR THE KIDS. ♥</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg font-light"
          >
            We're building a sustainable future where technology heals. Our ecosystem turns e-waste into miracles and AI revenue into children's smiles.
          </motion.p>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 p-8 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-[3rem]"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-400">
              <Smartphone size={24} />
            </div>
            <div className="text-3xl font-black text-white">E-Waste</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Device Recycling Program</div>
          </div>
          <div className="flex flex-col items-center text-center space-y-2 border-x border-white/5">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
              <Heart size={24} />
            </div>
            <div className="text-3xl font-black text-white">100%</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Proceeds to Shriners</div>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <TreeDeciduous size={24} />
            </div>
            <div className="text-3xl font-black text-white">Green</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sustainable Mission</div>
          </div>
        </motion.div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CharityCard 
            icon={Globe}
            name="AiDoesItAll.website"
            tagline="AI for Good"
            url="https://AiDoesItAll.website"
            description="Our flagship AI platform where 100% of all subscription revenue is directly allocated to children's hospitals. Harnessing the power of Gemini to fund medical breakthroughs."
          />
          <CharityCard 
            icon={Recycle}
            name="OnlineRecycle.org"
            tagline="Trash or Treasure"
            url="https://OnlineRecycle.org"
            description="Responsible e-waste recycling. Ship your old electronics to us; we recycle them and donate all proceeds to Shriners Children's Hospital. Turning old tech into new hope."
            color="from-emerald-400 to-teal-600"
          />
          <CharityCard 
            icon={ShoppingBag}
            name="The Square Store"
            tagline="Donation Portal"
            url="https://onlinerecycler.square.site"
            description="Our official storefront and donation portal. Linked directly to eBay charity listings benefiting Shriners Hospitals for Children. Shop with purpose, give with heart."
            color="from-green-500 to-green-800"
          />
        </div>

        {/* Footer Note */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
              <DollarSign size={24} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white uppercase tracking-tight">Transparency First</div>
              <div className="text-xs text-gray-400">All donations are verified and tracked publicly for total accountability.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

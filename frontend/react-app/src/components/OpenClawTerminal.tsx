import { X } from 'lucide-react';
import { motion } from 'motion/react';

export function OpenClawTerminal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-red-400">CODE RED Terminal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="bg-black rounded-xl p-4 font-mono text-green-400 text-sm min-h-[200px]">
          <p>{'>'} OpenClaw Security Terminal</p>
          <p>{'>'} Status: ONLINE</p>
          <p>{'>'} All systems nominal.</p>
          <p className="mt-4 text-gray-500">Full terminal coming soon...</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

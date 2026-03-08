import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageModal = ({ src, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.button
          className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all z-[1001]"
          onClick={onClose}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="max-w-full max-h-full flex items-center justify-center"
          onClick={e => e.stopPropagation()}
        >
          <img
            src={src}
            alt="Full size"
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5"
          />
        </motion.div>
        
        <div className="absolute bottom-10 inset-x-0 text-center">
           <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Campus Connect Premium Viewer</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageModal;

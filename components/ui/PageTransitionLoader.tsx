"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import MagicLoader from "@/components/lightswind/magic-loader";

interface PageTransitionLoaderProps {
  isLoading: boolean;
}

export default function PageTransitionLoader({ isLoading }: PageTransitionLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Gradient background - fully opaque */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white via-red-50/80 to-rose-50/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Animated background blobs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-red-300/20 to-red-400/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, 50, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-rose-300/20 to-red-300/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, -50, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Main content */}
          <motion.div className="relative z-10 flex flex-col items-center justify-center">
            {/* Magic Loader - Red theme */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <MagicLoader 
                size={160}
                particleCount={3}
                speed={1}
                hueRange={[0, 30]}
                className="drop-shadow-2xl"
              />
            </motion.div>

            {/* Loading text */}
            <motion.div
              className="mt-12 flex flex-col items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xl font-semibold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                Đang tải...
              </p>
              
              {/* Animated dots */}
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-red-500"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

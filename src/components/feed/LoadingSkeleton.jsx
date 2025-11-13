import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function LoadingSkeleton() {
  return (
    <Card className="border-0 bg-gray-900/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Header Skeleton */}
        <div className="p-4 flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-full bg-gray-800"
            animate={{
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <div className="flex-1 space-y-2">
            <motion.div
              className="h-4 bg-gray-800 rounded w-32"
              animate={{
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.1
              }}
            />
            <motion.div
              className="h-3 bg-gray-800 rounded w-24"
              animate={{
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            />
          </div>
        </div>

        {/* Image Skeleton */}
        <motion.div
          className="relative w-full h-64 bg-gray-800"
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>

        {/* Content Skeleton */}
        <div className="p-4 space-y-3">
          <motion.div
            className="h-5 bg-gray-800 rounded w-3/4"
            animate={{
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          />
          <motion.div
            className="h-4 bg-gray-800 rounded w-full"
            animate={{
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4
            }}
          />
          <motion.div
            className="h-4 bg-gray-800 rounded w-5/6"
            animate={{
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />

          {/* Action Buttons Skeleton */}
          <div className="flex items-center gap-6 pt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2"
                animate={{
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6 + i * 0.1
                }}
              >
                <div className="w-6 h-6 rounded-full bg-gray-800" />
                <div className="h-3 bg-gray-800 rounded w-8" />
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
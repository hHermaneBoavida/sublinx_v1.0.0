import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function LoadingSkeleton() {
  return (
    <Card className="bg-gray-900/95 border-0 text-white overflow-hidden shadow-none rounded-none">
      <CardHeader className="p-2.5 pb-1.5">
        <div className="flex items-center gap-2">
          {/* Avatar Skeleton */}
          <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
          <div className="flex-1 space-y-1">
            {/* Name Skeleton */}
            <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
            {/* Location Skeleton */}
            <div className="h-2 w-16 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>

      {/* Image Skeleton with Shimmer */}
      <div className="relative w-full bg-gray-800" style={{ aspectRatio: '16/9' }}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <CardContent className="p-2.5 pt-1.5 space-y-2">
        {/* Actions Skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-6 bg-gray-700 rounded animate-pulse" />
          <div className="w-12 h-6 bg-gray-700 rounded animate-pulse" />
          <div className="w-12 h-6 bg-gray-700 rounded animate-pulse" />
          <div className="flex-1" />
          <div className="w-16 h-6 bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Title Skeleton */}
        <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse" />
        
        {/* Info Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-20 bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Badges Skeleton */}
        <div className="flex gap-1">
          <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Button Skeleton */}
        <div className="h-8 w-full bg-gray-700 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
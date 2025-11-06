import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoadingSkeleton() {
  return (
    <Card className="bg-gray-900/80 border-gray-700 text-white overflow-hidden animate-pulse">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700"></div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-700 rounded"></div>
            <div className="h-3 w-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div className="w-full h-64 bg-gray-700"></div>
      </CardContent>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="w-6 h-6 bg-gray-700 rounded-md"></div>
            <div className="w-6 h-6 bg-gray-700 rounded-md"></div>
            <div className="w-6 h-6 bg-gray-700 rounded-md"></div>
          </div>
          <div className="h-4 w-24 bg-gray-700 rounded"></div>
        </div>
        
        <div className="h-4 w-1/4 bg-gray-700 rounded"></div>
        
        <div className="space-y-2">
          <div className="h-5 w-3/4 bg-gray-700 rounded"></div>
          <div className="h-4 w-full bg-gray-700 rounded"></div>
        </div>
        
        <div className="h-4 w-1/3 bg-gray-700 rounded"></div>
      </div>
    </Card>
  );
}
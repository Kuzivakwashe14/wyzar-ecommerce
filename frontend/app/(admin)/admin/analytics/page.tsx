'use client';

import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Platform analytics and insights</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="p-4 bg-indigo-500/10 rounded-full w-fit mx-auto mb-6">
          <BarChart3 className="w-16 h-16 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600 mb-4">
          Advanced analytics and reporting features coming soon
        </p>
        <p className="text-sm text-gray-500">
          Revenue charts, user growth, sales by category, and more...
        </p>
      </div>
    </div>
  );
}


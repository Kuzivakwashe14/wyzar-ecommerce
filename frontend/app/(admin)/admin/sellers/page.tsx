'use client';

import Link from 'next/link';
import { Store, ArrowRight } from 'lucide-react';

export default function SellersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sellers</h1>
        <p className="text-gray-600">Manage all sellers on the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/sellers/pending"
          className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-8 hover:shadow-lg hover:shadow-amber-500/20 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Store className="w-8 h-8 text-gray-900" />
            </div>
            <ArrowRight className="w-6 h-6 text-gray-900/60 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Verifications</h2>
          <p className="text-amber-100">Review and approve seller applications</p>
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="p-3 bg-green-500/10 rounded-lg w-fit mb-4">
            <Store className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verified Sellers</h2>
          <p className="text-gray-600 mb-4">View all verified sellers</p>
          <p className="text-gray-500 text-sm">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}


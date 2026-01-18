'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContent';
import Link from 'next/link';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Store,
  MapPin,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Shield,
  Ban,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface Seller {
  id: string;
  email: string;
  phone: string;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  sellerDetails: {
    businessName: string;
    businessType: string;
    description: string;
    address: string;
    city: string;
    state: string;
    verificationStatus: string;
  };
}

export default function VerifiedSellersPage() {
  const { axiosInstance } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSellers, setTotalSellers] = useState(0);

  useEffect(() => {
    fetchSellers();
  }, [currentPage]);

  const fetchSellers = async (searchQuery = search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchQuery
      });

      const res = await axiosInstance.get(`/admin/sellers/verified?${params.toString()}`);
      setSellers(res.data.sellers);
      setTotalPages(res.data.totalPages);
      setTotalSellers(res.data.totalSellers);
    } catch (error) {
      console.error('Error fetching verified sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSellers(search);
  };

  const handleSuspend = async (sellerId: string, suspend: boolean) => {
    if (!confirm(`Are you sure you want to ${suspend ? 'suspend' : 'unsuspend'} this seller?`)) return;

    try {
      const reason = suspend ? prompt('Reason for suspension:') : '';
      if (suspend && !reason) return;

      await axiosInstance.put(`/admin/sellers/${sellerId}/suspend`, {
        suspend,
        reason
      });

      // Refresh list
      fetchSellers();
      alert(`Seller ${suspend ? 'suspended' : 'unsuspended'} successfully`);
    } catch (error: any) {
      console.error('Error updating seller status:', error);
      alert(error.response?.data?.msg || 'Failed to update seller status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin/sellers"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sellers
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Verified</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verified Sellers</h1>
          <p className="text-gray-600">Manage approved sellers on the platform</p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 component-card p-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by business name or email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-shop_dark_green focus:ring-1 focus:ring-shop_dark_green transition-all"
            />
          </form>
        </div>
        
        <div className="component-card p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Total Verified Sellers</p>
            <p className="text-2xl font-bold text-gray-900">{totalSellers}</p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Sellers List */}
      <div className="component-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading verified sellers...</p>
            </div>
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No verified sellers found</p>
            <p className="text-gray-500 text-sm mt-1">
              {search ? 'Try adjusting your search terms' : 'Approved sellers will appear here'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                            {seller.sellerDetails?.businessName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">{seller.sellerDetails?.businessName || 'Business Name N/A'}</p>
                            <p className="text-gray-500 text-xs">{seller.sellerDetails?.businessType || 'Type N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            {seller.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {seller.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-3 h-3 mt-1 shrink-0" />
                          <span className="line-clamp-2">
                            {seller.sellerDetails?.city}, {seller.sellerDetails?.state}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 border border-green-200">
                            <Shield className="w-3 h-3" />
                            Verified
                          </span>
                          {seller.isSuspended && (
                             <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 border border-red-200">
                             <Ban className="w-3 h-3" />
                             Suspended
                           </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/sellers/${seller.id}`}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          
                          {seller.isSuspended ? (
                            <button
                              onClick={() => handleSuspend(seller.id, false)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Unsuspend/Reactivate"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(seller.id, true)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Suspend"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

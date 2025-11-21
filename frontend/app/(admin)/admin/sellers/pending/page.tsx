'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContent';
import {
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PendingSeller {
  _id: string;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isSeller: boolean;
  isVerified: boolean;
  sellerDetails: {
    businessName: string;
    sellerType: string;
    verificationDocument: string;
  };
  createdAt: string;
}

export default function PendingSellersPage() {
  const { axiosInstance } = useAuth();
  const [sellers, setSellers] = useState<PendingSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<PendingSeller | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingSellers();
  }, []);

  const fetchPendingSellers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/sellers/pending');
      setSellers(res.data.sellers);
    } catch (error) {
      console.error('Error fetching pending sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId: string) => {
    if (!confirm('Are you sure you want to approve this seller?')) return;

    try {
      setProcessing(sellerId);
      await axiosInstance.put(`/admin/sellers/${sellerId}/verify`, {
        approve: true
      });
      alert('Seller approved successfully!');
      fetchPendingSellers();
      setSelectedSeller(null);
    } catch (error: any) {
      console.error('Error approving seller:', error);
      alert(error.response?.data?.msg || 'Failed to approve seller');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (sellerId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to reject this seller application?')) return;

    try {
      setProcessing(sellerId);
      await axiosInstance.put(`/admin/sellers/${sellerId}/verify`, {
        approve: false,
        reason: rejectReason
      });
      alert('Seller application rejected');
      fetchPendingSellers();
      setSelectedSeller(null);
      setRejectReason('');
    } catch (error: any) {
      console.error('Error rejecting seller:', error);
      alert(error.response?.data?.msg || 'Failed to reject seller');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Loading pending sellers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Pending Seller Verifications</h1>
        <p className="text-slate-400">Review and approve seller applications</p>
      </div>

      {/* Count */}
      <div className="bg-amber-900/20 border border-amber-900/50 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        <p className="text-amber-200">
          {sellers.length} seller application{sellers.length !== 1 ? 's' : ''} awaiting verification
        </p>
      </div>

      {/* Sellers List */}
      {sellers.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-slate-400">There are no pending seller verifications at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sellers.map((seller) => (
            <div
              key={seller._id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seller Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {seller.sellerDetails?.businessName || 'No business name'}
                    </h3>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full">
                      {seller.sellerDetails?.sellerType || 'individual'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{seller.email}</span>
                      {seller.isEmailVerified && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{seller.phone}</span>
                      {seller.isPhoneVerified && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">
                        Applied {new Date(seller.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {seller.sellerDetails?.verificationDocument && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${seller.sellerDetails.verificationDocument}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          View Verification Document →
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  {/* Reject Reason Input */}
                  {selectedSeller?._id === seller._id && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Rejection Reason
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        rows={3}
                        placeholder="Provide a reason for rejection..."
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleApprove(seller._id)}
                      disabled={processing === seller._id}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-all"
                    >
                      {processing === seller._id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Approve Seller
                        </>
                      )}
                    </button>

                    {selectedSeller?._id === seller._id ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReject(seller._id)}
                          disabled={processing === seller._id}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-all"
                        >
                          <XCircle className="w-5 h-5" />
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSeller(null);
                            setRejectReason('');
                          }}
                          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedSeller(seller)}
                        disabled={processing === seller._id}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-lg font-medium transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Application
                      </button>
                    )}
                  </div>

                  {/* Verification Status */}
                  <div className="p-4 bg-slate-900 rounded-lg space-y-2">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-3">
                      Verification Status
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Email Verified</span>
                      {seller.isEmailVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Phone Verified</span>
                      {seller.isPhoneVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Documents Uploaded</span>
                      {seller.sellerDetails?.verificationDocument ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

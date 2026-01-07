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

interface VerificationDocument {
  id: string;
  documentType: string;
  documentPath: string;
  documentName?: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

interface PendingSeller {
  id: string;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isSeller: boolean;
  isVerified: boolean;
  sellerDetails: {
    businessName: string;
    sellerType: string;
    verificationDocument?: string;
    verificationDocuments?: VerificationDocument[];
    verificationStatus?: string;
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
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [documentRejectReasons, setDocumentRejectReasons] = useState<{ [key: string]: string }>({});

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

  const handleDocumentApprove = async (sellerId: string, documentId: string) => {
    if (!confirm('Are you sure you want to approve this document?')) return;

    try {
      setProcessing(`${sellerId}-${documentId}`);
      await axiosInstance.put(`/admin/sellers/${sellerId}/documents/${documentId}/status`, {
        status: 'approved'
      });
      alert('Document approved successfully!');
      fetchPendingSellers();
    } catch (error: any) {
      console.error('Error approving document:', error);
      alert(error.response?.data?.msg || 'Failed to approve document');
    } finally {
      setProcessing(null);
    }
  };

  const handleDocumentReject = async (sellerId: string, documentId: string) => {
    const reason = documentRejectReasons[documentId];
    if (!reason?.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to reject this document?')) return;

    try {
      setProcessing(`${sellerId}-${documentId}`);
      await axiosInstance.put(`/admin/sellers/${sellerId}/documents/${documentId}/status`, {
        status: 'rejected',
        rejectionReason: reason
      });
      alert('Document rejected');
      fetchPendingSellers();
      setDocumentRejectReasons(prev => {
        const updated = { ...prev };
        delete updated[documentId];
        return updated;
      });
    } catch (error: any) {
      console.error('Error rejecting document:', error);
      alert(error.response?.data?.msg || 'Failed to reject document');
    } finally {
      setProcessing(null);
    }
  };

  const toggleDocumentExpansion = (documentId: string) => {
    setExpandedDocuments(prev => {
      const updated = new Set(prev);
      if (updated.has(documentId)) {
        updated.delete(documentId);
      } else {
        updated.add(documentId);
      }
      return updated;
    });
  };

  const handleViewDocument = async (sellerId: string, documentId: string) => {
    try {
      const response = await axiosInstance.get(
        `/admin/sellers/${sellerId}/documents/${documentId}/view`,
        { responseType: 'blob' }
      );

      // Get content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // Create a blob URL with the correct MIME type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up the blob URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Error viewing document:', error);
      alert(error.response?.data?.msg || 'Failed to load document');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      national_id: 'National ID',
      passport: 'Passport',
      business_registration: 'Business Registration',
      tax_certificate: 'Tax Certificate',
      proof_of_address: 'Proof of Address',
      bank_statement: 'Bank Statement',
      other: 'Other Document'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending sellers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Seller Verifications</h1>
        <p className="text-gray-600">Review and approve seller applications</p>
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
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">There are no pending seller verifications at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-500 transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seller Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {seller.sellerDetails?.businessName || 'No business name'}
                    </h3>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full">
                      {seller.sellerDetails?.sellerType || 'individual'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{seller.email}</span>
                      {seller.isEmailVerified && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{seller.phone}</span>
                      {seller.isPhoneVerified && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        Applied {new Date(seller.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Verification Status Badge */}
                    {seller.sellerDetails?.verificationStatus && (
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          seller.sellerDetails.verificationStatus === 'approved' ? 'bg-green-500/10 text-green-400' :
                          seller.sellerDetails.verificationStatus === 'rejected' ? 'bg-red-500/10 text-red-400' :
                          seller.sellerDetails.verificationStatus === 'under_review' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-500/10 text-gray-600'
                        }`}>
                          {seller.sellerDetails.verificationStatus.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Documents Section */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Verification Documents</h4>

                  {seller.sellerDetails?.verificationDocuments && seller.sellerDetails.verificationDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {seller.sellerDetails.verificationDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-gray-50 border border-gray-300 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-indigo-400" />
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {getDocumentTypeLabel(doc.documentType)}
                                </h5>
                                <p className="text-xs text-gray-600">
                                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full ${
                              doc.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                              doc.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {doc.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <button
                              onClick={() => handleViewDocument(seller.id, doc.id)}
                              className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                            >
                              View Document →
                            </button>
                            {doc.documentName && (
                              <span className="text-xs text-gray-500">
                                {doc.documentName}
                              </span>
                            )}
                          </div>

                          {doc.rejectionReason && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-3">
                              <p className="text-sm text-red-300">
                                <strong>Rejection Reason:</strong> {doc.rejectionReason}
                              </p>
                            </div>
                          )}

                          {doc.status === 'pending' && (
                            <div className="space-y-3">
                              {expandedDocuments.has(doc.id) && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rejection Reason
                                  </label>
                                  <textarea
                                    value={documentRejectReasons[doc.id] || ''}
                                    onChange={(e) => setDocumentRejectReasons(prev => ({
                                      ...prev,
                                      [doc.id]: e.target.value
                                    }))}
                                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shop_dark_green text-sm"
                                    rows={2}
                                    placeholder="Provide a reason for rejection..."
                                  />
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDocumentApprove(seller.id, doc.id)}
                                  disabled={processing === `${seller.id}-${doc.id}`}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-gray-900 rounded text-sm font-medium transition-all"
                                >
                                  {processing === `${seller.id}-${doc.id}` ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      Approve
                                    </>
                                  )}
                                </button>

                                {expandedDocuments.has(doc.id) ? (
                                  <>
                                    <button
                                      onClick={() => handleDocumentReject(seller.id, doc.id)}
                                      disabled={processing === `${seller.id}-${doc.id}`}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 text-gray-900 rounded text-sm font-medium transition-all"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Confirm Reject
                                    </button>
                                    <button
                                      onClick={() => toggleDocumentExpansion(doc.id)}
                                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded text-sm font-medium transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => toggleDocumentExpansion(doc.id)}
                                    disabled={processing === `${seller.id}-${doc.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-900 rounded text-sm font-medium transition-all"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No verification documents uploaded</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  {/* Reject Reason Input */}
                  {selectedSeller?.id === seller.id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shop_dark_green"
                        rows={3}
                        placeholder="Provide a reason for rejection..."
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleApprove(seller.id)}
                      disabled={processing === seller.id}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-gray-900 rounded-lg font-medium transition-all"
                    >
                      {processing === seller.id ? (
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

                    {selectedSeller?.id === seller.id ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReject(seller.id)}
                          disabled={processing === seller.id}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 text-gray-900 rounded-lg font-medium transition-all"
                        >
                          <XCircle className="w-5 h-5" />
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSeller(null);
                            setRejectReason('');
                          }}
                          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedSeller(seller)}
                        disabled={processing === seller.id}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-900 rounded-lg font-medium transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Application
                      </button>
                    )}
                  </div>

                  {/* Verification Status */}
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-3">
                      Verification Status
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Email Verified</span>
                      {seller.isEmailVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Phone Verified</span>
                      {seller.isPhoneVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Documents</span>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const docs = seller.sellerDetails?.verificationDocuments || [];
                          const approved = docs.filter(d => d.status === 'approved').length;
                          const pending = docs.filter(d => d.status === 'pending').length;
                          const rejected = docs.filter(d => d.status === 'rejected').length;
                          return (
                            <div className="flex items-center gap-2 text-xs">
                              {approved > 0 && (
                                <span className="text-green-400">{approved} ✓</span>
                              )}
                              {pending > 0 && (
                                <span className="text-amber-400">{pending} ⏳</span>
                              )}
                              {rejected > 0 && (
                                <span className="text-red-400">{rejected} ✗</span>
                              )}
                              {docs.length === 0 && (
                                <span className="text-gray-500">None</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
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


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
    phoneNumber?: string;
    verificationDocument?: string;
    verificationDocuments?: VerificationDocument[];
    verificationStatus?: string;
    // New Fields
    jobTitle?: string;
    website?: string;
    productCategory?: string;
    totalSkuCount?: number;
    annualRevenue?: string;
    primarySalesChannel?: string;
    catalogStandardsAgreed?: boolean;
    slaAgreed?: boolean;
    // Payment
    ecocashNumber?: string;
    ecocashName?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    whatsappNumber?: string;
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
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-500 transition-all shadow-sm"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COLUMN: Seller Info & Business Details */}
                <div className="space-y-6">
                  {/* Basic Header */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {seller.sellerDetails?.businessName || 'No business name'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full uppercase tracking-wide">
                        {seller.sellerDetails?.sellerType || 'individual'}
                      </span>
                      {seller.sellerDetails?.jobTitle && (
                         <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          {seller.sellerDetails.jobTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                    <h4 className="font-semibold text-gray-700 border-b pb-2 mb-2">Contact Information</h4>
                    
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{seller.email}</span>
                      {seller.isEmailVerified && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{seller.phone || seller.sellerDetails?.phoneNumber}</span>
                      {seller.isPhoneVerified && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </div>

                    {seller.sellerDetails?.whatsappNumber && (
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="font-medium w-4 text-center text-green-600">WA</span>
                            <span>{seller.sellerDetails.whatsappNumber}</span>
                        </div>
                    )}
                     {seller.sellerDetails?.website && (
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="font-medium w-4 text-center text-blue-600">🌐</span>
                            <a href={seller.sellerDetails.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px]">{seller.sellerDetails.website}</a>
                        </div>
                    )}
                  </div>

                  {/* Business Details */}
                   <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                    <h4 className="font-semibold text-gray-700 border-b pb-2 mb-2">Business Profile</h4>
                    
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Industry</p>
                            <p className="font-medium">{seller.sellerDetails?.productCategory || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-xs text-gray-500">Sales Channel</p>
                            <p className="font-medium capitalize">{seller.sellerDetails?.primarySalesChannel?.replace('_', ' ') || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-xs text-gray-500">Est. Revenue</p>
                            <p className="font-medium">{seller.sellerDetails?.annualRevenue || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-xs text-gray-500">SKU Count</p>
                            <p className="font-medium">{seller.sellerDetails?.totalSkuCount || '0'}</p>
                        </div>
                     </div>
                  </div>

                  {/* Agreements & Compliance */}
                  <div className="flex gap-4">
                     <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md ${seller.sellerDetails?.catalogStandardsAgreed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {seller.sellerDetails?.catalogStandardsAgreed ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                        Catalog Standards
                     </div>
                     <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md ${seller.sellerDetails?.slaAgreed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {seller.sellerDetails?.slaAgreed ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                        SLA Agreed
                     </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Documents & Actions */}
                <div className="space-y-6">
                  
                  {/* Documents */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                        <span>Verification Documents</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {seller.sellerDetails?.verificationDocuments?.length || 0} Files
                        </span>
                    </h4>

                    {seller.sellerDetails?.verificationDocuments && seller.sellerDetails.verificationDocuments.length > 0 ? (
                        <div className="space-y-3">
                        {seller.sellerDetails.verificationDocuments.map((doc) => (
                            <div
                            key={doc.id}
                            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                            >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h5 className="font-medium text-gray-900 text-sm">
                                    {getDocumentTypeLabel(doc.documentType)}
                                    </h5>
                                    <p className="text-xs text-gray-500">
                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${
                                doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                                doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                                }`}>
                                {doc.status}
                                </span>
                            </div>

                            {/* View Button & Name */}
                             <div className="flex items-center justify-between text-xs pl-[44px]">
                                <span className="text-gray-400 truncate max-w-[150px]">{doc.documentName}</span>
                                <button
                                    onClick={() => handleViewDocument(seller.id, doc.id)}
                                    className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                                >
                                    View File
                                </button>
                            </div>

                            {/* Rejection Display */}
                            {doc.status === "rejected" && doc.rejectionReason && (
                                <div className="mt-2 ml-[44px] bg-red-50 p-2 rounded text-xs text-red-600 border border-red-100">
                                    Reason: {doc.rejectionReason}
                                </div>
                            )}

                             {/* Action Buttons for Pending */}
                            {doc.status === 'pending' && (
                                <div className="mt-3 ml-[44px] space-y-2">
                                    {/* Reject Reason Input (only if expanded) */}
                                    {expandedDocuments.has(doc.id) && (
                                        <textarea
                                        value={documentRejectReasons[doc.id] || ''}
                                        onChange={(e) => setDocumentRejectReasons(prev => ({
                                            ...prev,
                                            [doc.id]: e.target.value
                                        }))}
                                        className="w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded text-gray-900 text-xs focus:ring-1 focus:ring-indigo-500 mb-2"
                                        rows={2}
                                        placeholder="Reason for rejection..."
                                        />
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                        onClick={() => handleDocumentApprove(seller.id, doc.id)}
                                        disabled={processing === `${seller.id}-${doc.id}`}
                                        className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                        >
                                            Approve
                                        </button>

                                        {expandedDocuments.has(doc.id) ? (
                                        <>
                                            <button
                                            onClick={() => handleDocumentReject(seller.id, doc.id)}
                                            disabled={processing === `${seller.id}-${doc.id}`}
                                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                            onClick={() => toggleDocumentExpansion(doc.id)}
                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                        ) : (
                                        <button
                                            onClick={() => toggleDocumentExpansion(doc.id)}
                                            disabled={processing === `${seller.id}-${doc.id}`}
                                            className="flex-1 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors"
                                        >
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
                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No documents uploaded.</p>
                        </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  {/* Final Decision Actions */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Final Decision</h4>
                    
                    {selectedSeller?.id === seller.id && (
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rejection Reason
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm mb-2"
                            rows={2}
                            placeholder="Why is this application being rejected?"
                        />
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {/* Approve Button */}
                        <button
                        onClick={() => handleApprove(seller.id)}
                        disabled={processing === seller.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-shop_dark_green hover:bg-shop_dark_green/90 text-white rounded-lg font-medium shadow-sm transition-all"
                        >
                            {processing === seller.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            Approve Full Application
                        </button>

                        {/* Reject Button Group */}
                        {selectedSeller?.id === seller.id ? (
                        <div className="flex gap-2">
                            <button
                            onClick={() => handleReject(seller.id)}
                            disabled={processing === seller.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                            >
                                <XCircle className="w-4 h-4" />
                                Confirm Rejection
                            </button>
                            <button
                            onClick={() => { setSelectedSeller(null); setRejectReason(''); }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                        ) : (
                        <button
                            onClick={() => setSelectedSeller(seller)}
                            disabled={processing === seller.id}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all"
                        >
                            <XCircle className="w-5 h-5" />
                            Reject Application
                        </button>
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


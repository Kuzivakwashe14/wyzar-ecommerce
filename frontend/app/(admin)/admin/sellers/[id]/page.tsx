'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContent';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  Ban,
  FileText,
  MapPin,
  Globe,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { use } from 'react';

interface VerificationDocument {
  id: string;
  documentType: string;
  documentPath: string;
  documentName?: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

interface SellerDetail {
  id: string;
  // User Fields
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isSeller: boolean;
  isVerified: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  role: string;
  createdAt: string;
  
  // Seller Details
  sellerDetails: {
    id: string;
    businessName: string;
    sellerType: string;
    description?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    website?: string;
    jobTitle?: string;
    productCategory?: string;
    totalSkuCount?: number;
    annualRevenue?: string;
    primarySalesChannel?: string;
    catalogStandardsAgreed?: boolean;
    slaAgreed?: boolean;
    
    // Address
    address?: string; // Prisma model might have split fields, using what's available
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;

    // Payment
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    ecocashNumber?: string;
    ecocashName?: string;
    
    verificationStatus: string;
    verificationDocuments: VerificationDocument[];
  };
}

export default function SellerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { axiosInstance } = useAuth();
  
  const [seller, setSeller] = useState<SellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSellerDetails();
  }, [id]);

  const fetchSellerDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/admin/sellers/${id}`);
      setSeller(res.data.seller);
      setStats(res.data.stats);
    } catch (error: any) {
      console.error('Error fetching seller details:', error);
      if (error.response?.status === 404) {
        alert('Seller not found');
        router.push('/admin/sellers');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (suspend: boolean) => {
    if (!confirm(`Are you sure you want to ${suspend ? 'suspend' : 'unsuspend'} this seller?`)) return;

    try {
      const reason = suspend ? prompt('Reason for suspension:') : '';
      if (suspend && !reason) return;

      setProcessing(true);
      await axiosInstance.put(`/admin/sellers/${id}/suspend`, {
        suspend,
        reason
      });

      alert(`Seller ${suspend ? 'suspended' : 'unsuspended'} successfully`);
      fetchSellerDetails();
    } catch (error: any) {
      console.error('Error updating seller status:', error);
      alert(error.response?.data?.msg || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to DELETE this seller? This action cannot be undone.')) return;
    
    // Double confirmation for safety
    if (!confirm('This will permanently delete the seller account, their products, and other associated data. Existing orders may block this action. Confirm deletion?')) return;

    try {
      setProcessing(true);
      await axiosInstance.delete(`/admin/sellers/${id}`);
      alert('Seller deleted successfully');
      router.push('/admin/sellers/verified');
    } catch (error: any) {
      console.error('Error deleting seller:', error);
      alert(error.response?.data?.msg || 'Failed to delete seller');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const response = await axiosInstance.get(
        `/admin/sellers/${id}/documents/${documentId}/view`,
        { responseType: 'blob' }
      );

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Error viewing document:', error);
      alert(error.response?.data?.msg || 'Failed to load document');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      NATIONAL_ID: 'Government ID (Passport / National ID) *',
      PASSPORT: 'Passport',
      BUSINESS_REGISTRATION: 'Company Registration Certificate *',
      TAX_CERTIFICATE: 'Tax Clearance (Optional)',
      PROOF_OF_ADDRESS: 'Proof of Address',
      BANK_STATEMENT: 'Bank Confirmation / Statement *',
      OTHER: 'Other Document'
    };
    return labels[type] || labels[type.toUpperCase()] || type.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading seller details...</p>
        </div>
      </div>
    );
  }

  if (!seller) return null;

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/sellers/verified"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {seller.sellerDetails.businessName || 'Business Name N/A'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
               <span className="capitalize">{seller.sellerDetails.sellerType?.toLowerCase()} Seller</span>
               <span>•</span>
               <span>Joined {new Date(seller.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
            {seller.isSuspended ? (
                <button
                    onClick={() => handleSuspend(false)}
                    disabled={processing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                    Unsuspend Seller
                </button>
            ) : (
                <button
                    onClick={() => handleSuspend(true)}
                    disabled={processing}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Ban className="w-4 h-4"/>}
                    Suspend Seller
                </button>
            )}
             <button
                onClick={handleDelete}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-red-600 rounded-lg font-medium transition-colors disabled:opacity-50 border border-gray-200"
                title="Permanently Delete Seller"
            >
                {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Overview & Contact */}
        <div className="space-y-6 lg:col-span-1">
            
            {/* Status Card */}
            <div className={`p-4 rounded-xl border ${seller.isSuspended ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold uppercase ${seller.isSuspended ? 'text-red-700' : 'text-green-700'}`}>
                        Current Status
                    </span>
                    {seller.isSuspended ? <Ban className="w-5 h-5 text-red-500"/> : <Shield className="w-5 h-5 text-green-500"/>}
                </div>
                <p className={`text-lg font-bold ${seller.isSuspended ? 'text-red-900' : 'text-green-900'}`}>
                    {seller.isSuspended ? 'Suspended' : 'Active & Verified'}
                </p>
                {seller.isSuspended && seller.suspensionReason && (
                    <p className="mt-2 text-sm text-red-600">
                        Reason: {seller.suspensionReason}
                    </p>
                )}
            </div>

             {/* Performance Stats (If Available) */}
            {stats && (
                 <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
                    <h3 className="font-semibold text-gray-900">Performance</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Products</p>
                            <p className="text-xl font-bold text-gray-900">{stats.products || 0}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Orders</p>
                            <p className="text-xl font-bold text-gray-900">{stats.orders || 0}</p>
                        </div>
                        <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Total Revenue</p>
                            <p className="text-xl font-bold text-gray-900">${(stats.revenue || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900">Contact Details</h3>
                
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{seller.email}</span>
                        {seller.isEmailVerified && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{seller.phone || seller.sellerDetails.phoneNumber || 'N/A'}</span>
                        {seller.isPhoneVerified && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </div>
                     {seller.sellerDetails.whatsappNumber && (
                        <div className="flex items-center gap-3 text-sm">
                            <span className="font-bold text-green-600 text-xs w-4 text-center">WA</span>
                            <span className="text-gray-700">{seller.sellerDetails.whatsappNumber}</span>
                        </div>
                    )}
                    {seller.sellerDetails.website && (
                         <div className="flex items-center gap-3 text-sm">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <a href={seller.sellerDetails.website} target="_blank" className="text-blue-600 hover:underline truncate">
                                {seller.sellerDetails.website}
                            </a>
                        </div>
                    )}
                </div>
            </div>

             {/* Address */}
             <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900">Location</h3>
                <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                        <p>{seller.sellerDetails.streetAddress}</p>
                        <p>{seller.sellerDetails.city}, {seller.sellerDetails.state}</p>
                        <p>{seller.sellerDetails.country}</p>
                    </div>
                </div>
             </div>

        </div>

        {/* CENTER/RIGHT COLUMN: Business Details & Documents */}
        <div className="space-y-6 lg:col-span-2">

             {/* Business Profile */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">Business Profile</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Industry / Category</p>
                        <p className="font-medium text-gray-900">{seller.sellerDetails.productCategory || 'N/A'}</p>
                    </div>
                    <div>
                         <p className="text-xs text-gray-500 uppercase">Job Title</p>
                        <p className="font-medium text-gray-900">{seller.sellerDetails.jobTitle || 'N/A'}</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-500 uppercase">Est. Annual Revenue</p>
                        <p className="font-medium text-gray-900">{seller.sellerDetails.annualRevenue || 'N/A'}</p>
                    </div>
                    <div>
                         <p className="text-xs text-gray-500 uppercase">Total SKU Count</p>
                        <p className="font-medium text-gray-900">{seller.sellerDetails.totalSkuCount || '0'}</p>
                    </div>
                    <div>
                         <p className="text-xs text-gray-500 uppercase">Primary Sales Channel</p>
                        <p className="font-medium text-gray-900 capitalize">{seller.sellerDetails.primarySalesChannel?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                 </div>

                 <div className="mt-6 pt-6 border-t border-gray-100 flex gap-4">
                     <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${seller.sellerDetails?.catalogStandardsAgreed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {seller.sellerDetails?.catalogStandardsAgreed ? <CheckCircle className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                        Catalog Standards
                     </div>
                     <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${seller.sellerDetails?.slaAgreed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {seller.sellerDetails?.slaAgreed ? <CheckCircle className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                        SLA Agreed
                     </div>
                 </div>
            </div>

            {/* Documents */}
             <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-gray-900">Verification Documents</h3>
                     <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                         {seller.sellerDetails.verificationDocuments.length} Files
                     </span>
                </div>

                {seller.sellerDetails.verificationDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {seller.sellerDetails.verificationDocuments.map((doc) => (
                            <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                            <FileText className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                {getDocumentTypeLabel(doc.documentType) === 'Other Document' && doc.documentName 
                                                    ? doc.documentName 
                                                    : getDocumentTypeLabel(doc.documentType)}
                                            </p>
                                            {/* Only show filename if not used as title */}
                                            {doc.documentName && getDocumentTypeLabel(doc.documentType) !== 'Other Document' && (
                                                <p className="text-xs text-gray-500 font-mono mt-0.5 truncate max-w-[200px]" title={doc.documentName}>
                                                    {doc.documentName}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                     </div>
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                        doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {doc.status}
                                    </span>
                                </div>
                                
                                <button
                                    onClick={() => handleViewDocument(doc.id)}
                                    className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Document
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No documents available</p>
                    </div>
                )}
             </div>

             {/* Payment Details (Optional) */}
             <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {seller.sellerDetails.bankName && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-500"/> Bank Account
                            </h4>
                            <div className="space-y-1 text-sm">
                                <p><span className="text-gray-500">Bank:</span> {seller.sellerDetails.bankName}</p>
                                <p><span className="text-gray-500">Account:</span> {seller.sellerDetails.bankAccountNumber}</p>
                                <p><span className="text-gray-500">Name:</span> {seller.sellerDetails.bankAccountName}</p>
                            </div>
                        </div>
                    )}

                    {seller.sellerDetails.ecocashNumber && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                             <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-500"/> EcoCash
                            </h4>
                             <div className="space-y-1 text-sm">
                                <p><span className="text-gray-500">Number:</span> {seller.sellerDetails.ecocashNumber}</p>
                                <p><span className="text-gray-500">Name:</span> {seller.sellerDetails.ecocashName}</p>
                            </div>
                        </div>
                    )}
                     
                     {!seller.sellerDetails.bankName && !seller.sellerDetails.ecocashNumber && (
                         <p className="text-gray-500 text-sm">No payment methods configured.</p>
                     )}
                 </div>
             </div>

        </div>

      </div>
    </div>
  );
}

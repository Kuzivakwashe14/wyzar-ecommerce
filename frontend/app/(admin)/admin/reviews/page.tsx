'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContent';
import { Star, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';

interface Review {
  _id: string;
  product: {
    _id: string;
    name: string;
  };
  user: {
    _id: string;
    email: string;
  };
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  helpful: number;
  createdAt: string;
}

export default function ReviewsPage() {
  const { axiosInstance } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [currentPage, statusFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await axiosInstance.get(`/reviews/admin/all?${params.toString()}`);
      setReviews(res.data.reviews);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string, approve: boolean) => {
    try {
      await axiosInstance.put(`/reviews/admin/${reviewId}/approve`, { approve });
      alert(`Review ${approve ? 'approved' : 'rejected'} successfully`);
      fetchReviews();
      setSelectedReview(null);
    } catch (error: any) {
      console.error('Error updating review:', error);
      alert(error.response?.data?.msg || 'Failed to update review');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await axiosInstance.delete(`/reviews/admin/${reviewId}`);
      alert('Review deleted successfully');
      fetchReviews();
      setSelectedReview(null);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      alert(error.response?.data?.msg || 'Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-500'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
        <p className="text-gray-600">Manage and moderate customer reviews</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <label className="text-gray-600 text-sm">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-shop_dark_green"
          >
            <option value="">All Reviews</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No reviews found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr
                      key={review._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedReview(review)}
                    >
                      <td className="px-6 py-4">
                        <p className="text-gray-900 font-medium">{review.product.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 text-sm">{review.user.email}</p>
                        {review.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded mt-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">{renderStars(review.rating)}</td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          {review.title && (
                            <p className="text-gray-900 font-medium mb-1">{review.title}</p>
                          )}
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {review.comment}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {review.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded">
                            <XCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!review.isApproved && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(review._id, true);
                              }}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 text-sm rounded transition-all"
                            >
                              Approve
                            </button>
                          )}
                          {review.isApproved && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(review._id, false);
                              }}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-gray-900 text-sm rounded transition-all"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(review._id);
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-gray-900 text-sm rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Review Details</h2>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Product</p>
                  <p className="text-gray-900 font-medium">{selectedReview.product.name}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm mb-1">User</p>
                  <p className="text-gray-900">{selectedReview.user.email}</p>
                  {selectedReview.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded mt-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-gray-600 text-sm mb-1">Rating</p>
                  {renderStars(selectedReview.rating)}
                </div>

                {selectedReview.title && (
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Title</p>
                    <p className="text-gray-900 font-medium">{selectedReview.title}</p>
                  </div>
                )}

                <div>
                  <p className="text-gray-600 text-sm mb-1">Review</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedReview.comment}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm mb-1">Status</p>
                  {selectedReview.isApproved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                      <CheckCircle className="w-3 h-3" />
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded">
                      <XCircle className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-gray-600 text-sm mb-1">Date</p>
                  <p className="text-gray-900 text-sm">
                    {new Date(selectedReview.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  {!selectedReview.isApproved && (
                    <button
                      onClick={() => handleApprove(selectedReview._id, true)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-gray-900 rounded transition-all"
                    >
                      Approve
                    </button>
                  )}
                  {selectedReview.isApproved && (
                    <button
                      onClick={() => handleApprove(selectedReview._id, false)}
                      className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-gray-900 rounded transition-all"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedReview._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-gray-900 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



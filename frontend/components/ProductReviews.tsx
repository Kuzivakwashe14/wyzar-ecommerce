"use client";

import { useState, useEffect } from 'react';
import { api, useAuth } from '@/context/AuthContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, ThumbsUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReviewForm from './ReviewForm';

interface Review {
  id: string;
  user: {
    id: string;
    email: string;
  };
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  helpful: number;
  isEdited: boolean;
  createdAt: string;
  editedAt?: string;
}

interface RatingStats {
  average: number;
  count: number;
  distribution: Array<{ _id: number; count: number }>;
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    if (!productId) return; // Guard against undefined productId
    fetchReviews();
    if (isAuthenticated) {
      checkUserReview();
    }
  }, [productId, currentPage, sortBy, isAuthenticated]);

  const fetchReviews = async () => {
    if (!productId) return; // Guard against undefined productId
    try {
      setLoading(true);
      const { data } = await api.get(
        `/reviews/product/${productId}?page=${currentPage}&limit=5&sort=${sortBy}`
      );
      setReviews(data.reviews);
      setRatingStats(data.ratingStats);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = async () => {
    if (!productId) return; // Guard against undefined productId
    try {
      const { data } = await api.get('/reviews/user/me');
      const review = data.reviews.find((r: any) => {
        const rProductId = typeof r.product === 'object' ? r.product.id : r.product;
        return rProductId === productId;
      });
      setUserReview(review || null);
    } catch (error) {
      // User might not have any reviews yet
    }
  };

  const handleReviewSubmit = () => {
    fetchReviews();
    checkUserReview();
    setShowForm(false);
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await api.post(`/reviews/${reviewId}/helpful`);
      fetchReviews();
      toast.success('Thank you for your feedback!');
    } catch (error) {
      toast.error('Failed to mark review as helpful');
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: number) => {
    if (!ratingStats || ratingStats.count === 0) return 0;
    const dist = ratingStats.distribution.find(d => d._id === rating);
    return dist ? Math.round((dist.count / ratingStats.count) * 100) : 0;
  };

  if (loading && !ratingStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {ratingStats && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Rating */}
              <div className="text-center md:text-left">
                <div className="text-4xl font-bold mb-2">
                  {ratingStats.average.toFixed(1)}
                </div>
                {renderStars(Math.round(ratingStats.average), 'lg')}
                <p className="text-sm text-muted-foreground mt-2">
                  Based on {ratingStats.count} review{ratingStats.count !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="md:col-span-2 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const percentage = getRatingPercentage(rating);
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Write Review Button */}
      {isAuthenticated && !userReview && (
        <Card>
          <CardContent className="pt-6">
            <Button onClick={() => setShowForm(true)} className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Write a Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          productId={productId}
          existingReview={userReview}
          onSuccess={handleReviewSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* User's Existing Review */}
      {userReview && !showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {renderStars(userReview.rating)}
                {userReview.verifiedPurchase && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              {userReview.title && (
                <h4 className="font-semibold">{userReview.title}</h4>
              )}
              <p className="text-sm text-muted-foreground">{userReview.comment}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {new Date(userReview.createdAt).toLocaleDateString()}
                </span>
                {userReview.isEdited && (
                  <span>(Edited {new Date(userReview.editedAt!).toLocaleDateString()})</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
                className="mt-2"
              >
                Edit Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reviews</CardTitle>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                        {review.verifiedPurchase && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      {review.title && (
                        <h4 className="font-semibold mb-1">{review.title}</h4>
                      )}
                      <p className="text-sm text-muted-foreground mb-2">
                        {review.comment}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{review.user.email.split('@')[0]}</span>
                        <span>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {review.isEdited && (
                          <span className="italic">
                            (Edited {new Date(review.editedAt!).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkHelpful(review.id)}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.helpful}</span>
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Reply, ThumbsUp, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  reply?: string;
  reviewDate: string;
  responded: boolean;
  source: string;
}

interface ReviewsListProps {
  reviews: Review[];
  loading: boolean;
  onReply: (reviewId: string, reply: string) => Promise<void>;
}

export function ReviewsList({ reviews, loading, onReply }: ReviewsListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(reviewId, replyText);
      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-16 w-full mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= parseFloat(averageRating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="font-medium">{averageRating}</span>
            <span className="text-gray-500">
              ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No reviews yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {review.reviewerName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {review.source}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(review.reviewDate), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  {review.responded && (
                    <Badge className="bg-green-100 text-green-700">
                      Replied
                    </Badge>
                  )}
                </div>

                <p className="text-gray-700 mb-3">{review.comment}</p>

                {review.reply && (
                  <div className="ml-4 p-3 bg-gray-50 rounded-lg mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Reply className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium">Your Reply</span>
                    </div>
                    <p className="text-sm text-gray-600">{review.reply}</p>
                  </div>
                )}

                {!review.responded && replyingTo !== review.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(review.id)}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                )}

                {replyingTo === review.id && (
                  <div className="space-y-3 mt-3">
                    <Textarea
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(review.id)}
                        disabled={!replyText.trim() || submitting}
                      >
                        {submitting ? "Posting..." : "Post Reply"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
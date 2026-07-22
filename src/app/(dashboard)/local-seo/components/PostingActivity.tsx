"use client";

import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, CalendarPlus, History, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PostingActivity() {
  const { data: postsData, isLoading } = useLocalSeoModule<any>('posts');

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!postsData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Posting Data</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          We couldn't load your Google Posts data. Please try again later.
        </p>
      </div>
    );
  }

  // Google API returns { localPosts: [...] }
  const posts = postsData.localPosts || [];
  const totalPosts = posts.length;
  const recentPost = posts[0];
  const lastPostDate = recentPost ? new Date(recentPost.createTime).toLocaleDateString() : "Never";

  // Calculate posts this month
  const now = new Date();
  const thisMonth = posts.filter((p: any) => {
    if (!p.createTime) return false;
    const d = new Date(p.createTime);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Posting Activity</h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/google-business/posts">Create Post</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
            <History className="h-4 w-4" /> Last Post
          </div>
          <div className="text-lg font-bold text-gray-900">{lastPostDate}</div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
            <CalendarPlus className="h-4 w-4" /> This Month
          </div>
          <div className="text-lg font-bold text-gray-900">{thisMonth} {thisMonth === 1 ? 'post' : 'posts'}</div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
            <Clock className="h-4 w-4" /> Target Frequency
          </div>
          <div className="text-lg font-bold text-gray-900">4 posts/month</div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
            <Megaphone className="h-4 w-4" /> Total History
          </div>
          <div className="text-lg font-bold text-gray-900">{totalPosts} {totalPosts === 1 ? 'post' : 'posts'}</div>
        </div>
      </div>
      
      {thisMonth < 4 && (
        <div className="mt-4 p-3 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg border border-amber-100 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          You are falling behind your monthly posting target. Publish {4 - thisMonth} more posts to maximize engagement.
        </div>
      )}
    </div>
  );
}

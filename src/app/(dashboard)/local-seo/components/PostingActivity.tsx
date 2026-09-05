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
  // Explicitly sort posts descending by timestamp so the latest published post is always first
  const rawPosts: any[] = postsData.localPosts || [];
  const posts = [...rawPosts].sort((a: any, b: any) => {
    const timeA = new Date(a.createTime || a.updateTime || 0).getTime();
    const timeB = new Date(b.createTime || b.updateTime || 0).getTime();
    return timeB - timeA;
  });

  const totalPosts = posts.length;
  const recentPost = posts[0];
  const lastPostDate = recentPost
    ? new Date(recentPost.createTime || recentPost.updateTime).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "Never";

  // Calculate posts this month
  const now = new Date();
  const thisMonth = posts.filter((p: any) => {
    const ts = p.createTime || p.updateTime;
    if (!ts) return false;
    const d = new Date(ts);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-indigo-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Posting Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Google Business Profile updates & patient reach</p>
          </div>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" size="sm">
          <Link href="/gbp/posts">Create Post</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
            <History className="h-3.5 w-3.5 text-indigo-500" /> Last Post
          </div>
          <div className="text-base sm:text-lg font-bold text-gray-900">{lastPostDate}</div>
        </div>
        
        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
            <CalendarPlus className="h-3.5 w-3.5 text-emerald-500" /> This Month
          </div>
          <div className="text-base sm:text-lg font-bold text-gray-900">{thisMonth} {thisMonth === 1 ? 'post' : 'posts'}</div>
        </div>

        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> Target
          </div>
          <div className="text-base sm:text-lg font-bold text-gray-900">4 posts/mo</div>
        </div>

        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
            <Megaphone className="h-3.5 w-3.5 text-purple-500" /> Total History
          </div>
          <div className="text-base sm:text-lg font-bold text-gray-900">{totalPosts} {totalPosts === 1 ? 'post' : 'posts'}</div>
        </div>
      </div>
      
      {/* Recent Posts Preview Cards */}
      {posts.length > 0 && (
        <div className="pt-2 border-t border-gray-100/80">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Recent Google Updates</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {posts.slice(0, 2).map((post: any, idx: number) => {
              const postDate = new Date(post.createTime || post.updateTime).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              });
              const summaryText = post.summary || post.event?.title || "Update published to Google";
              const mediaUrl = post.media?.[0]?.googleUrl;

              return (
                <div key={post.name || idx} className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 flex items-start gap-3 hover:bg-gray-100/60 transition-colors">
                  {mediaUrl ? (
                    <img src={mediaUrl} alt="Post" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Megaphone className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        {post.topicType || "STANDARD"}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">{postDate}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-relaxed">
                      {summaryText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {thisMonth < 4 && (
        <div className="p-3 bg-amber-50 text-amber-700 text-xs sm:text-sm font-medium rounded-xl border border-amber-200/60 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>You have published {thisMonth} post(s) this month. Publish {4 - thisMonth} more to hit your 4-post target.</span>
        </div>
      )}
    </div>
  );
}

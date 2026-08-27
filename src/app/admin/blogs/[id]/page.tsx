"use client";

import { useEffect, useState, use } from "react";
import { BlogEditor } from "@/components/admin/blog-editor";
import { useToast } from "@/components/ui/use-toast";

export default function AdminEditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/blogs/${id}`);
        const data = await res.json();
        if (data.id) setPost(data);
        else throw new Error("Article not found");
      } catch (err: any) {
        toast({ title: "Failed to load article", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-gray-500 animate-pulse">
        Loading article editor...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-12 text-center text-sm font-bold text-gray-600">
        Article not found.
      </div>
    );
  }

  return <BlogEditor initialData={post} isNew={false} />;
}

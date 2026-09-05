import { PostScheduler } from "@/components/gbp-posting/post-scheduler"
import { FileText } from "lucide-react"

export default function PostsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Updates</h1>
        <p className="text-sm text-gray-500 mt-1">Publish announcements, patient health tips, and local updates directly to Google Search & Maps</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <PostScheduler />
      </div>
    </div>
  )
}
"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";

export function GoogleQA() {
  const { activeLocationId: locationId } = useLocationContext();
  const isConnected = !!locationId;

  if (isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircleQuestion className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Ask Maps Optimization</h2>
        </div>
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-sm text-gray-600 leading-relaxed">
          <p>
            Google has replaced the traditional Q&A section with an automated conversational search feature called <strong>Ask Maps</strong>. To ensure Google's system accurately answers patient inquiries, it is crucial that your website content, profile description, and list of services are comprehensive and consistently updated.
          </p>
        </div>
      </div>
    );
  }

  // Capability not available
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 text-center text-gray-500">
      <MessageCircleQuestion className="h-8 w-8 mx-auto mb-3 text-gray-300" />
      <p>Ask Maps optimization tracking is not yet available.</p>
    </div>
  );
}

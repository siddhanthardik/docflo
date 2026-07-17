export default function WhatsAppLoading() {
  return (
    <div className="h-[calc(100vh-2rem)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-100">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-10 w-full bg-gray-200 rounded-lg" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 w-full bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
      
      {/* Main Chat Skeleton */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="h-16 border-b border-gray-100 px-6 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-gray-200" />
             <div className="space-y-2">
               <div className="h-4 w-32 bg-gray-200 rounded" />
               <div className="h-3 w-20 bg-gray-200 rounded" />
             </div>
           </div>
        </div>
        {/* Messages Area */}
        <div className="flex-1 p-6 space-y-6">
           <div className="w-1/2 h-20 bg-gray-100 rounded-2xl rounded-tl-sm" />
           <div className="w-1/2 h-16 bg-indigo-50 rounded-2xl rounded-tr-sm ml-auto" />
           <div className="w-1/3 h-12 bg-gray-100 rounded-2xl rounded-tl-sm" />
        </div>
        {/* Input Area */}
        <div className="h-20 border-t border-gray-100 p-4">
           <div className="h-full w-full bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

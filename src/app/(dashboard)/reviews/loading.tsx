export default function ReviewsLoading() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
           <div className="h-32 bg-gray-200 rounded-xl" />
           <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
        <div className="md:col-span-3 space-y-4">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="h-40 bg-gray-200 rounded-xl" />
           ))}
        </div>
      </div>
    </div>
  )
}

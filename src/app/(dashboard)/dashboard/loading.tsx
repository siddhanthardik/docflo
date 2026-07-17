export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl p-6 h-64 bg-gray-200" />
      
      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-32" />
        ))}
      </div>

      {/* Charts & Appointments Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-3 h-64" />
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2 h-64" />
      </div>

      {/* Reviews & Quick Links Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-3 h-64" />
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2 h-64" />
      </div>
    </div>
  )
}

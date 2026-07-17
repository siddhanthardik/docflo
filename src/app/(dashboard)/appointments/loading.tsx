export default function AppointmentsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gray-200" />
          <div>
            <div className="h-8 w-40 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-56 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-lg" />
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-[700px] flex">
        <div className="w-64 border-r border-gray-100 p-4 hidden md:block">
           <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex-1 p-4">
           <div className="h-full bg-gray-50 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

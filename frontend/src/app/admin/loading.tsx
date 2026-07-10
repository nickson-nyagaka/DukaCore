export default function AdminLoading() {
  return (
    <div className="space-y-8 pb-10 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-8 w-56 rounded-xl" />
        <div className="skeleton h-4 w-72 rounded-lg" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-6 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6 space-y-3">
          <div className="skeleton h-5 w-40 rounded" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
        <div className="space-y-5">
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="skeleton h-5 w-36 rounded" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-11 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

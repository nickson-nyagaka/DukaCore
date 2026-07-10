export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-9 w-28 rounded-xl" />
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 space-y-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

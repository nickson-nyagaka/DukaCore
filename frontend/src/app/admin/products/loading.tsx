export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="skeleton h-8 w-32 rounded-xl" />
        <div className="skeleton h-9 w-32 rounded-xl" />
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 space-y-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

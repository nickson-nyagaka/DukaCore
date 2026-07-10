'use client'

import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface Column<T> {
  key: string
  label: string
  render?: (value: any, row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKeys = []
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Filter logic
  const filteredData = data.filter(row => {
    if (!search || searchKeys.length === 0) return true
    const s = search.toLowerCase()
    return searchKeys.some(k => {
      const val = row[k]
      if (val === null || val === undefined) return false
      return String(val).toLowerCase().includes(s)
    })
  })

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {searchKeys.length > 0 && (
        <div className="relative max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="input-field pl-10"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
      )}

      {/* Table Shell */}
      <div className="glass rounded-2xl overflow-hidden border border-border shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface/50 border-b border-border text-muted">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="p-4 font-semibold text-xs uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-surface/40 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="p-4 align-middle">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-muted">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-border bg-surface/30">
            <div className="text-xs text-muted">
              Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(startIndex + itemsPerPage, filteredData.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredData.length}</span> entries
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border bg-card text-muted hover:text-foreground hover:bg-surface transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-border bg-card text-muted hover:text-foreground hover:bg-surface'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border bg-card text-muted hover:text-foreground hover:bg-surface transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

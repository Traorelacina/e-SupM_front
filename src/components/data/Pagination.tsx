import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPages = () => {
    const pages: number[] = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-xl hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {currentPage > 3 && <><button onClick={() => onPageChange(1)} className="w-9 h-9 rounded-xl text-sm font-semibold hover:bg-stone-100">1</button><span className="px-1 text-stone-400">…</span></>}
      {getPages().map(page => (
        <button key={page} onClick={() => onPageChange(page)} className={cn('w-9 h-9 rounded-xl text-sm font-semibold transition-all', page === currentPage ? 'bg-brand-orange text-stone-900 shadow-brand' : 'hover:bg-stone-100 text-stone-600')}>{page}</button>
      ))}
      {currentPage < totalPages - 2 && <><span className="px-1 text-stone-400">…</span><button onClick={() => onPageChange(totalPages)} className="w-9 h-9 rounded-xl text-sm font-semibold hover:bg-stone-100">{totalPages}</button></>}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-xl hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

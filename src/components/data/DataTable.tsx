import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './Input'
import { Skeleton } from './Skeleton'
import { EmptyState } from '@/components/data/EmptyState'
import { Pagination } from '@/components/data/Pagination'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  totalPages?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  totalRows?: number
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  rowKey?: keyof T
  onRowClick?: (row: T) => void
  headerActions?: React.ReactNode
  className?: string
  stickyHeader?: boolean
}

export function DataTable<T extends object>({
  data,
  columns,
  isLoading = false,
  searchable = false,
  searchPlaceholder = 'Rechercher…',
  onSearch,
  totalPages,
  currentPage = 1,
  onPageChange,
  totalRows,
  onSort,
  emptyTitle = 'Aucune donnée',
  emptyDescription,
  emptyAction,
  rowKey,
  onRowClick,
  headerActions,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (!onSort) return
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    onSort(key, newDir)
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown className="h-3.5 w-3.5 text-stone-300" />
    return sortDir === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5 text-brand-orange" />
      : <ChevronDown className="h-3.5 w-3.5 text-brand-orange" />
  }

  const getRowKey = (row: T, index: number): string => {
    if (rowKey && rowKey in row) return String(row[rowKey])
    return String(index)
  }

  const getCellValue = (row: T, key: string): React.ReactNode => {
    const keys = key.split('.')
    let value: unknown = row
    for (const k of keys) {
      if (value == null) return '—'
      value = (value as Record<string, unknown>)[k]
    }
    if (value == null) return '—'
    return String(value)
  }

  return (
    <div className={cn('bg-white rounded-2xl border border-stone-100 shadow-card overflow-hidden', className)}>
      {/* Header */}
      {(searchable || headerActions) && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 flex-wrap">
          {searchable && (
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={searchPlaceholder}
                leftElement={<Search className="h-4 w-4" />}
                onChange={e => onSearch?.(e.target.value)}
                className="!py-2"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={cn('bg-stone-50 border-b border-stone-100', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider select-none',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && onSort && 'cursor-pointer hover:text-stone-900 transition-colors',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className={cn(
                    'flex items-center gap-1.5',
                    col.align === 'center' && 'justify-center',
                    col.align === 'right' && 'justify-end',
                  )}>
                    {col.header}
                    {col.sortable && onSort && <SortIcon columnKey={String(col.key)} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    emoji="📭"
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="py-12"
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <motion.tr
                  key={getRowKey(row, index)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'hover:bg-stone-50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map(col => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-4 py-3',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row, index)
                        : <span className="text-sm text-stone-700">{getCellValue(row, String(col.key))}</span>
                      }
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {(totalPages || totalRows) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100">
          {totalRows !== undefined && (
            <p className="text-xs text-stone-500">
              {totalRows.toLocaleString('fr-CI')} résultat{totalRows !== 1 ? 's' : ''}
            </p>
          )}
          {totalPages && totalPages > 1 && onPageChange && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </div>
      )}
    </div>
  )
}

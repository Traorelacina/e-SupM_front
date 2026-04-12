import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Modal } from './Modal'

// ========================
// TOOLTIP
// ========================
interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const positionClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 px-2.5 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none',
              positionClasses[position]
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ========================
// DROPDOWN MENU
// ========================
interface DropdownItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
  divider?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 w-52 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-stone-100 overflow-hidden py-1.5',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {items.map((item, i) => (
              <React.Fragment key={i}>
                {item.divider && i > 0 && <div className="my-1 border-t border-stone-100" />}
                <button
                  onClick={() => { item.onClick(); setOpen(false) }}
                  disabled={item.disabled}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                    item.destructive
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900',
                    item.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {item.icon && <span className="shrink-0 text-stone-400">{item.icon}</span>}
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ========================
// STAT CARD
// ========================
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  trend?: { value: number; label: string }
  color?: string
  iconBg?: string
}

export function StatCard({ icon: Icon, label, value, sub, trend, color = 'text-stone-900', iconBg = 'bg-amber-100' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className="h-5 w-5 text-amber-700" />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-bold px-2 py-1 rounded-full',
            trend.value >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className={cn('text-2xl font-black font-display', color)}>{value}</p>
      <p className="text-sm font-semibold text-stone-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ========================
// CONFIRM DIALOG
// ========================
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  variant = 'danger', loading = false,
}: ConfirmDialogProps) {
  const iconConfig = {
    danger:  { icon: AlertTriangle, bg: 'bg-red-100',    color: 'text-red-600' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-100',  color: 'text-amber-600' },
    info:    { icon: CheckCircle,   bg: 'bg-blue-100',   color: 'text-blue-600' },
  }
  const { icon: Icon, bg, color } = iconConfig[variant]

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6 text-center">
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4', bg)}>
          <Icon className={cn('h-7 w-7', color)} />
        </div>
        <h3 className="text-lg font-black text-stone-900 font-display">{title}</h3>
        {description && <p className="mt-2 text-sm text-stone-500">{description}</p>}
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ========================
// PROGRESS BAR
// ========================
interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  color?: 'orange' | 'green' | 'blue' | 'red' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

const progressColors = {
  orange: 'bg-brand-orange',
  green:  'bg-green-500',
  blue:   'bg-blue-500',
  red:    'bg-red-500',
  purple: 'bg-purple-500',
}

const progressSizes = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

export function ProgressBar({
  value, max = 100, label, showValue = false,
  color = 'orange', size = 'md', animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100)

  return (
    <div>
      {(label || showValue) && (
        <div className="flex justify-between text-xs font-medium text-stone-600 mb-1.5">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-stone-100 rounded-full overflow-hidden', progressSizes[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: animated ? 1 : 0, ease: 'easeOut' }}
          className={cn('h-full rounded-full', progressColors[color])}
        />
      </div>
    </div>
  )
}

// ========================
// ALERT BANNER
// ========================
interface AlertBannerProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  onClose?: () => void
  action?: React.ReactNode
}

const alertConfig = {
  info:    { bg: 'bg-blue-50 border-blue-200',    icon: '💡', text: 'text-blue-800' },
  success: { bg: 'bg-green-50 border-green-200',  icon: '✅', text: 'text-green-800' },
  warning: { bg: 'bg-amber-50 border-amber-200',  icon: '⚠️', text: 'text-amber-800' },
  error:   { bg: 'bg-red-50 border-red-200',      icon: '❌', text: 'text-red-800' },
}

export function AlertBanner({ type = 'info', title, message, onClose, action }: AlertBannerProps) {
  const cfg = alertConfig[type]
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', cfg.bg)}>
      <span className="text-lg shrink-0 mt-0.5">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-bold', cfg.text)}>{title}</p>}
        <p className={cn('text-sm', title ? 'mt-0.5' : '', cfg.text, 'opacity-90')}>{message}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} className={cn('shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors', cfg.text)}>
          ✕
        </button>
      )}
    </div>
  )
}

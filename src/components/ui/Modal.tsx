import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', full: 'max-w-5xl' }

export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
            className={cn('relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden', sizes[size], className)}
          >
            {(title || description) && (
              <div className="px-6 pt-6 pb-4 border-b border-stone-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {title && <h2 className="text-lg font-bold text-stone-900">{title}</h2>}
                    {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            {!title && (
              <button onClick={onClose} className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-white/80 hover:bg-white text-stone-400 hover:text-stone-600 transition-colors shadow-sm">
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="overflow-y-auto max-h-[85vh]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

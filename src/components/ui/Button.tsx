import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'orange' | 'outline-orange'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  children: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-stone-900 text-white hover:bg-stone-800 shadow-sm hover:shadow-md',
  orange:
    'bg-brand-orange text-stone-900 font-bold hover:bg-brand-orange-dark shadow-brand hover:shadow-brand-lg',
  secondary:
    'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300',
  danger:
    'bg-brand-red text-white hover:bg-brand-red-dark shadow-red',
  ghost:
    'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
  link:
    'text-brand-orange hover:text-brand-orange-dark underline-offset-4 hover:underline p-0 h-auto',
  'outline-orange':
    'border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-stone-900',
}

const sizes: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1',
  sm: 'h-8 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-base rounded-xl gap-2',
  xl: 'h-13 px-7 text-base rounded-2xl gap-2.5',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: isDisabled ? 1 : 0.97 }}
        className={cn(
          'relative inline-flex items-center justify-center font-semibold',
          'transition-all duration-200 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variant !== 'link' && sizes[size],
          variants[variant],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

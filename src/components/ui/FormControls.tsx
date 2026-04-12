import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ========================
// SELECT
// ========================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string | number; label: string; disabled?: boolean }[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id || `select-${Math.random().toString(36).slice(2)}`
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-stone-700 mb-1.5">
            {label}
            {props.required && <span className="text-brand-red ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full pl-4 pr-10 py-3 rounded-xl border bg-white appearance-none',
              'text-stone-900 text-sm font-medium cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange',
              'transition-all duration-200',
              'disabled:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60',
              error ? 'border-brand-red' : 'border-stone-200',
              className
            )}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-brand-red">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ========================
// TEXTAREA
// ========================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).slice(2)}`
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-stone-700 mb-1.5">
            {label}
            {props.required && <span className="text-brand-red ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={cn(
            'w-full px-4 py-3 rounded-xl border border-stone-200 bg-white resize-y',
            'text-stone-900 placeholder-stone-400 text-sm font-medium',
            'focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange',
            'transition-all duration-200',
            'disabled:bg-stone-50 disabled:cursor-not-allowed',
            error && 'border-brand-red focus:ring-brand-red/30',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-brand-red">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ========================
// RADIO GROUP
// ========================
interface RadioOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface RadioGroupProps {
  label?: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  layout?: 'vertical' | 'horizontal' | 'grid'
  error?: string
}

export function RadioGroup({ label, options, value, onChange, layout = 'vertical', error }: RadioGroupProps) {
  return (
    <div>
      {label && <p className="text-sm font-semibold text-stone-700 mb-2">{label}</p>}
      <div className={cn(
        'gap-2',
        layout === 'horizontal' ? 'flex flex-wrap' : layout === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'
      )}>
        {options.map(opt => (
          <label
            key={opt.value}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
              opt.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-orange/50',
              value === opt.value
                ? 'border-brand-orange bg-amber-50'
                : 'border-stone-200 bg-white'
            )}
          >
            <input
              type="radio"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => !opt.disabled && onChange(opt.value)}
              disabled={opt.disabled}
              className="mt-0.5 accent-brand-orange"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {opt.icon && <span>{opt.icon}</span>}
                <span className="text-sm font-semibold text-stone-900">{opt.label}</span>
              </div>
              {opt.description && (
                <p className="text-xs text-stone-500 mt-0.5">{opt.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-brand-red">{error}</p>}
    </div>
  )
}

// ========================
// SWITCH
// ========================
interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <div className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={cn(
          'w-10 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-brand-orange' : 'bg-stone-300'
        )}>
          <div className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
            checked && 'translate-x-4'
          )} />
        </div>
      </div>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-semibold text-stone-900">{label}</p>}
          {description && <p className="text-xs text-stone-500 mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  )
}

// ========================
// QUANTITY STEPPER
// ========================
import { Plus, Minus, Trash2 } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  onRemove?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function QuantityStepper({ value, min = 1, max = 999, onChange, onRemove, size = 'md' }: QuantityStepperProps) {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base' }
  const btnSize = sizes[size]

  return (
    <div className="flex items-center bg-stone-100 rounded-2xl p-1 gap-1">
      <button
        type="button"
        onClick={() => value <= min && onRemove ? onRemove() : onChange(Math.max(min, value - 1))}
        className={cn(
          btnSize,
          'rounded-xl bg-white flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm'
        )}
      >
        {value <= min && onRemove
          ? <Trash2 className="h-3.5 w-3.5 text-red-500" />
          : <Minus className="h-3.5 w-3.5 text-stone-600" />
        }
      </button>
      <span className={cn('font-bold text-stone-900 text-center', size === 'sm' ? 'w-7 text-xs' : size === 'lg' ? 'w-12' : 'w-9 text-sm')}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          btnSize,
          'rounded-xl bg-white flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <Plus className="h-3.5 w-3.5 text-stone-600" />
      </button>
    </div>
  )
}

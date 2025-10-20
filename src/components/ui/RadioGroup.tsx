'use client'

import * as React from 'react'

interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function RadioGroup({ value, onValueChange, children, className = '' }: RadioGroupProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            checked: child.props.value === value,
            onChange: () => onValueChange(child.props.value),
          })
        }
        return child
      })}
    </div>
  )
}

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
}

export function RadioGroupItem({ className = '', ...props }: RadioGroupItemProps) {
  return (
    <input
      type="radio"
      className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 ${className}`}
      {...props}
    />
  )
}

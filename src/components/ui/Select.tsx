"use client"

import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}

export function Select({ options, className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm",
        "focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

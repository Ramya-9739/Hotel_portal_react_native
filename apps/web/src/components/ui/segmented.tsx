"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SegmentedProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string
  options: { label: string; value: string; icon?: React.ReactNode }[]
  onChange: (value: string) => void
}

export function Segmented({
  value,
  options,
  onChange,
  className,
  ...props
}: SegmentedProps) {
  return (
    <div
      className={cn(
        "inline-flex h-[44px] items-center justify-center rounded-full bg-muted p-1 text-muted-foreground",
        className
      )}
      role="group"
      {...props}
    >
      {options.map((option) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-full items-center justify-center whitespace-nowrap rounded-full px-4 text-[14px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              isSelected
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {option.icon && <span className="mr-2">{option.icon}</span>}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

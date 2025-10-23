import * as React from 'react'
import { cn } from '@/lib/utils'

// shadcn/ui style pagination primitives
export function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

export function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />
}

export function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('inline-flex', className)} {...props} />
}

export type PaginationLinkProps = React.ComponentProps<'a'> & {
  isActive?: boolean
}

export const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ className, isActive, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
        className,
      )}
      {...props}
    />
  ),
)
PaginationLink.displayName = 'PaginationLink'

export const PaginationPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
  ({ className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="Go to previous page"
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      Previous
    </button>
  ),
)
PaginationPrevious.displayName = 'PaginationPrevious'

export const PaginationNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
  ({ className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="Go to next page"
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      Next
    </button>
  ),
)
PaginationNext.displayName = 'PaginationNext'

export function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('inline-flex h-9 items-center justify-center px-2 text-sm text-muted-foreground', className)}
      {...props}
    >
      …
    </span>
  )
}

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// Spinner component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)}
      aria-label="Loading"
    />
  )
}

// Skeleton component
interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Loading button component
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: React.ReactNode
  loadingText?: string
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  loadingText,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {loading ? loadingText || 'Loading...' : children}
    </button>
  )
}

// Page loading component
interface PageLoadingProps {
  message?: string
  className?: string
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  message = 'Loading...', 
  className 
}) => {
  return (
    <div className={cn(
      'flex min-h-[400px] flex-col items-center justify-center space-y-4',
      className
    )}>
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('rounded-lg border p-6 space-y-4', className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

// Form skeleton
export const FormSkeleton: React.FC<{ fields?: number; className?: string }> = ({ 
  fields = 3, 
  className 
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      
      {/* Chart area */}
      <div className="rounded-lg border p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-lg border p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <TableSkeleton rows={5} columns={5} />
        </div>
      </div>
    </div>
  )
}

// Loading overlay
interface LoadingOverlayProps {
  loading: boolean
  children: React.ReactNode
  message?: string
  className?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  message = 'Loading...',
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline loading
interface InlineLoadingProps {
  loading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  loading,
  children,
  fallback,
  size = 'sm'
}) => {
  if (loading) {
    return fallback || <Spinner size={size} />
  }
  
  return <>{children}</>
}

// Suspense fallback
export const SuspenseFallback: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-2">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
} 
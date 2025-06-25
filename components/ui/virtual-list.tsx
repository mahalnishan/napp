import React, { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
  onEndReached?: () => void
  onEndReachedThreshold?: number
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
  onEndReached,
  onEndReachedThreshold = 0.8
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const endMarkerRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight) + overscan
  )

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1)

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!onEndReached || !endMarkerRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onEndReached()
          }
        })
      },
      {
        root: containerRef.current,
        rootMargin: `${height * onEndReachedThreshold}px`,
        threshold: 0
      }
    )

    observerRef.current.observe(endMarkerRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [onEndReached, height, onEndReachedThreshold])

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
        {onEndReached && (
          <div
            ref={endMarkerRef}
            style={{
              height: 1,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0
            }}
          />
        )}
      </div>
    </div>
  )
}

// Specialized virtual list for tables
interface VirtualTableProps<T> {
  items: T[]
  height: number
  rowHeight: number
  columns: {
    key: string
    header: string
    width?: number | string
    render?: (item: T, index: number) => React.ReactNode
  }[]
  className?: string
  overscan?: number
  onEndReached?: () => void
  onEndReachedThreshold?: number
}

export function VirtualTable<T>({
  items,
  height,
  rowHeight,
  columns,
  className,
  overscan = 5,
  onEndReached,
  onEndReachedThreshold = 0.8
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const endMarkerRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / rowHeight) + overscan
  )

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1)

  // Calculate total height and offset
  const totalHeight = items.length * rowHeight
  const offsetY = startIndex * rowHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!onEndReached || !endMarkerRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onEndReached()
          }
        })
      },
      {
        root: containerRef.current,
        rootMargin: `${height * onEndReachedThreshold}px`,
        threshold: 0
      }
    )

    observerRef.current.observe(endMarkerRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [onEndReached, height, onEndReachedThreshold])

  return (
    <div className={cn('border rounded-lg', className)}>
      {/* Table Header */}
      <div className="bg-muted/50 border-b">
        <div className="flex">
          {columns.map((column) => (
            <div
              key={column.key}
              className="px-4 py-3 font-medium text-sm"
              style={{ width: column.width }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Table Body */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: height - 48 }} // Subtract header height
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: offsetY,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.map((item, index) => (
              <div
                key={startIndex + index}
                className="flex border-b hover:bg-muted/50 transition-colors"
                style={{ height: rowHeight }}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className="px-4 py-3 text-sm flex items-center"
                    style={{ width: column.width }}
                  >
                    {column.render 
                      ? column.render(item, startIndex + index)
                      : (item as any)[column.key]
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
          {onEndReached && (
            <div
              ref={endMarkerRef}
              style={{
                height: 1,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
} 
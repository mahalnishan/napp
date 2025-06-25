'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  fcp: number | null
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  domLoad: number | null
  windowLoad: number | null
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    domLoad: null,
    windowLoad: null
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Measure Time to First Byte
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      setMetrics(prev => ({
        ...prev,
        ttfb: navigationEntry.responseStart - navigationEntry.requestStart
      }))
    }

    // Measure DOM and Window load times
    const domLoad = navigationEntry?.domContentLoadedEventEnd - navigationEntry?.domContentLoadedEventStart
    const windowLoad = navigationEntry?.loadEventEnd - navigationEntry?.loadEventStart

    setMetrics(prev => ({
      ...prev,
      domLoad,
      windowLoad
    }))

    // Measure First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fcpEntry = entries[entries.length - 1]
      setMetrics(prev => ({
        ...prev,
        fcp: fcpEntry.startTime
      }))
    })

    fcpObserver.observe({ entryTypes: ['paint'] })

    // Measure Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lcpEntry = entries[entries.length - 1]
      setMetrics(prev => ({
        ...prev,
        lcp: lcpEntry.startTime
      }))
    })

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    // Measure First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fidEntry = entries[entries.length - 1] as PerformanceEventTiming
      setMetrics(prev => ({
        ...prev,
        fid: fidEntry.processingStart - fidEntry.startTime
      }))
    })

    fidObserver.observe({ entryTypes: ['first-input'] })

    // Measure Cumulative Layout Shift
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      for (const entry of entries) {
        const layoutShiftEntry = entry as any
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value
        }
      }
      setMetrics(prev => ({
        ...prev,
        cls: clsValue
      }))
    })

    clsObserver.observe({ entryTypes: ['layout-shift'] })

    // Cleanup observers
    return () => {
      fcpObserver.disconnect()
      lcpObserver.disconnect()
      fidObserver.disconnect()
      clsObserver.disconnect()
    }
  }, [])

  // Send metrics to analytics (if enabled)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && metrics.fcp !== null) {
      // Send to analytics service
      console.log('Performance metrics:', metrics)
    }
  }, [metrics])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
      <div className="font-bold mb-2">Performance Metrics</div>
      <div className="space-y-1">
        <div>FCP: {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : '...'}</div>
        <div>LCP: {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : '...'}</div>
        <div>FID: {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : '...'}</div>
        <div>CLS: {metrics.cls ? metrics.cls.toFixed(3) : '...'}</div>
        <div>TTFB: {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : '...'}</div>
        <div>DOM: {metrics.domLoad ? `${metrics.domLoad.toFixed(0)}ms` : '...'}</div>
        <div>Window: {metrics.windowLoad ? `${metrics.windowLoad.toFixed(0)}ms` : '...'}</div>
      </div>
    </div>
  )
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        const renderTime = endTime - startTime
        
        if (renderTime > 16) { // Longer than one frame
          console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`)
        }
      }
    }
  })
}

// Hook for measuring async operations
export function useAsyncPerformance(operationName: string) {
  return {
    start: () => {
      if (process.env.NODE_ENV === 'development') {
        const startTime = performance.now()
        return () => {
          const endTime = performance.now()
          const duration = endTime - startTime
          console.log(`${operationName} took ${duration.toFixed(2)}ms`)
        }
      }
      return () => {}
    }
  }
} 
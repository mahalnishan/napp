'use client'

import Image from 'next/image'
import { useState } from 'react'
import { User } from 'lucide-react'

interface OptimizedImageProps {
  src: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackIcon?: React.ReactNode
}

export function OptimizedImage({
  src,
  alt,
  width = 32,
  height = 32,
  className = '',
  fallbackIcon = <User className="h-4 w-4 text-gray-400" />
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Handle null/undefined src or error state
  if (!src || error) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center overflow-hidden ${className}`}
        style={{ width, height }}
      >
        {fallbackIcon}
      </div>
    )
  }

  // Validate URL format
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // If URL is invalid, show fallback
  if (!isValidUrl(src)) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center overflow-hidden ${className}`}
        style={{ width, height }}
      >
        {fallbackIcon}
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`object-cover transition-opacity duration-200 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
        priority={width > 100} // Prioritize larger images
        unoptimized={src.includes('supabase.co')} // Skip optimization for Supabase URLs
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="animate-pulse bg-gray-300 rounded" style={{ width: width * 0.6, height: height * 0.6 }} />
        </div>
      )}
    </div>
  )
} 
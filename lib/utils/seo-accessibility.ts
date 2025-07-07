import { Metadata } from 'next'

// SEO utilities
export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  author?: string
  canonical?: string
  openGraph?: {
    title?: string
    description?: string
    image?: string
    url?: string
    type?: 'website' | 'article' | 'profile'
    siteName?: string
  }
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player'
    site?: string
    creator?: string
    title?: string
    description?: string
    image?: string
  }
  schema?: Record<string, any>
}

export const generateMetadata = (config: SEOConfig): Metadata => {
  const {
    title,
    description,
    keywords,
    author,
    canonical,
    openGraph,
    twitter,
  } = config

  return {
    title,
    description,
    keywords,
    authors: author ? [{ name: author }] : undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph: openGraph ? {
      title: openGraph.title || title,
      description: openGraph.description || description,
      url: openGraph.url,
      siteName: openGraph.siteName,
      images: openGraph.image ? [
        {
          url: openGraph.image,
          width: 1200,
          height: 630,
          alt: openGraph.title || title,
        }
      ] : undefined,
      type: openGraph.type || 'website',
    } : undefined,
    twitter: twitter ? {
      card: twitter.card || 'summary_large_image',
      site: twitter.site,
      creator: twitter.creator,
      title: twitter.title || title,
      description: twitter.description || description,
      images: twitter.image ? [twitter.image] : undefined,
    } : undefined,
  }
}

// Schema.org structured data generators
export const generateOrganizationSchema = (data: {
  name: string
  url: string
  logo?: string
  description?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  phone?: string
  email?: string
  socialMedia?: string[]
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    address: data.address ? {
      '@type': 'PostalAddress',
      streetAddress: data.address.street,
      addressLocality: data.address.city,
      addressRegion: data.address.state,
      postalCode: data.address.zipCode,
      addressCountry: data.address.country,
    } : undefined,
    telephone: data.phone,
    email: data.email,
    sameAs: data.socialMedia,
  }
}

export const generateWebsiteSchema = (data: {
  name: string
  url: string
  description?: string
  author?: string
  publisher?: string
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
    description: data.description,
    author: data.author ? {
      '@type': 'Person',
      name: data.author,
    } : undefined,
    publisher: data.publisher ? {
      '@type': 'Organization',
      name: data.publisher,
    } : undefined,
  }
}

export const generateArticleSchema = (data: {
  title: string
  description: string
  author: string
  datePublished: string
  dateModified?: string
  image?: string
  url: string
  publisher: {
    name: string
    logo?: string
  }
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    author: {
      '@type': 'Person',
      name: data.author,
    },
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    image: data.image,
    url: data.url,
    publisher: {
      '@type': 'Organization',
      name: data.publisher.name,
      logo: data.publisher.logo ? {
        '@type': 'ImageObject',
        url: data.publisher.logo,
      } : undefined,
    },
  }
}

export const generateServiceSchema = (data: {
  name: string
  description: string
  provider: string
  areaServed?: string
  serviceType?: string
  url?: string
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.name,
    description: data.description,
    provider: {
      '@type': 'Organization',
      name: data.provider,
    },
    areaServed: data.areaServed,
    serviceType: data.serviceType,
    url: data.url,
  }
}

// Accessibility utilities
export const generateAriaLabel = (text: string, context?: string): string => {
  if (context) {
    return `${text} - ${context}`
  }
  return text
}

export const generateAriaDescribedBy = (id: string, suffix: string = 'description'): string => {
  return `${id}-${suffix}`
}

export const createAccessibleButton = (props: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  className?: string
}) => {
  const { children, onClick, disabled, ariaLabel, ariaDescribedBy, className } = props
  
  return {
    role: 'button',
    tabIndex: disabled ? -1 : 0,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-disabled': disabled,
    className,
    onClick: disabled ? undefined : onClick,
    onKeyDown: disabled ? undefined : (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    },
    children,
  }
}

export const createAccessibleLink = (props: {
  href: string
  children: React.ReactNode
  external?: boolean
  ariaLabel?: string
  className?: string
}) => {
  const { href, children, external, ariaLabel, className } = props
  
  return {
    href,
    'aria-label': ariaLabel,
    target: external ? '_blank' : undefined,
    rel: external ? 'noopener noreferrer' : undefined,
    className,
    children,
  }
}

// Form accessibility helpers
export const createAccessibleInput = (props: {
  id: string
  label: string
  type?: string
  required?: boolean
  error?: string
  description?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}) => {
  const { id, label, type = 'text', required, error, description, placeholder, value, onChange } = props
  
  const describedBy = [
    description ? `${id}-description` : null,
    error ? `${id}-error` : null,
  ].filter(Boolean).join(' ')

  return {
    input: {
      id,
      type,
      required,
      'aria-required': required,
      'aria-invalid': !!error,
      'aria-describedby': describedBy || undefined,
      placeholder,
      value,
      onChange: onChange ? (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) : undefined,
    },
    label: {
      htmlFor: id,
      children: label + (required ? ' *' : ''),
    },
    description: description ? {
      id: `${id}-description`,
      children: description,
    } : null,
    error: error ? {
      id: `${id}-error`,
      role: 'alert',
      'aria-live': 'polite',
      children: error,
    } : null,
  }
}

// Focus management utilities
export const createFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
  const focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  const getFocusableElements = (): HTMLElement[] => {
    if (!containerRef.current) return []
    return Array.from(containerRef.current.querySelectorAll(focusableElements))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  const activate = () => {
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
    document.addEventListener('keydown', handleKeyDown)
  }

  const deactivate = () => {
    document.removeEventListener('keydown', handleKeyDown)
  }

  return { activate, deactivate }
}

// Screen reader utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.setAttribute('class', 'sr-only')
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g)
    if (!rgb) return 0

    const [r, g, b] = rgb.map(val => {
      const normalized = parseInt(val) / 255
      return normalized <= 0.03928 
        ? normalized / 12.92 
        : Math.pow((normalized + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

export const meetsWCAGContrast = (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const ratio = getContrastRatio(color1, color2)
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7
}

// Responsive utilities
export const generateResponsiveImageSizes = (breakpoints: Record<string, number>) => {
  const sizes = Object.entries(breakpoints)
    .sort(([, a], [, b]) => b - a)
    .map(([size, width]) => `(max-width: ${width}px) ${size}`)
    .join(', ')
  
  return sizes
}

// Performance accessibility
export const createReducedMotionCSS = () => {
  return `
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `
}

// Keyboard navigation utilities
export const createKeyboardNavigation = (items: HTMLElement[], options: {
  loop?: boolean
  orientation?: 'horizontal' | 'vertical'
} = {}) => {
  const { loop = true, orientation = 'vertical' } = options
  let currentIndex = 0

  const focusItem = (index: number) => {
    items[index]?.focus()
    currentIndex = index
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    let nextIndex = currentIndex

    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          e.preventDefault()
          nextIndex = currentIndex + 1
        }
        break
      case 'ArrowUp':
        if (orientation === 'vertical') {
          e.preventDefault()
          nextIndex = currentIndex - 1
        }
        break
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          e.preventDefault()
          nextIndex = currentIndex + 1
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          e.preventDefault()
          nextIndex = currentIndex - 1
        }
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = items.length - 1
        break
      default:
        return
    }

    if (nextIndex < 0) {
      nextIndex = loop ? items.length - 1 : 0
    } else if (nextIndex >= items.length) {
      nextIndex = loop ? 0 : items.length - 1
    }

    focusItem(nextIndex)
  }

  return {
    activate: () => {
      items.forEach((item, index) => {
        item.setAttribute('tabindex', index === 0 ? '0' : '-1')
        item.addEventListener('keydown', handleKeyDown)
        item.addEventListener('focus', () => {
          currentIndex = index
        })
      })
    },
    deactivate: () => {
      items.forEach(item => {
        item.removeEventListener('keydown', handleKeyDown)
        item.removeAttribute('tabindex')
      })
    },
    focusItem,
  }
}

// ARIA live region utilities
export const createLiveRegion = (id: string, level: 'polite' | 'assertive' = 'polite') => {
  let region = document.getElementById(id)
  
  if (!region) {
    region = document.createElement('div')
    region.id = id
    region.setAttribute('aria-live', level)
    region.setAttribute('aria-atomic', 'true')
    region.setAttribute('class', 'sr-only')
    document.body.appendChild(region)
  }

  return {
    announce: (message: string) => {
      if (region) {
        region.textContent = message
      }
    },
    clear: () => {
      if (region) {
        region.textContent = ''
      }
    },
    remove: () => {
      if (region && region.parentNode) {
        region.parentNode.removeChild(region)
      }
    },
  }
}

// Export utility functions for common use cases
export const SEOUtils = {
  generateMetadata,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateArticleSchema,
  generateServiceSchema,
}

export const AccessibilityUtils = {
  generateAriaLabel,
  generateAriaDescribedBy,
  createAccessibleButton,
  createAccessibleLink,
  createAccessibleInput,
  createFocusTrap,
  announceToScreenReader,
  getContrastRatio,
  meetsWCAGContrast,
  createReducedMotionCSS,
  createKeyboardNavigation,
  createLiveRegion,
} 
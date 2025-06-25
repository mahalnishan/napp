"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type Attribute = "class" | "data-theme" | "data-mode"

export function ThemeProvider({ 
  children, 
  ...props 
}: {
  children: React.ReactNode
  attribute?: Attribute | Attribute[]
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
} 
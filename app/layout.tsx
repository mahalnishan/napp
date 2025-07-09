import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import OrderChatWidget from '@/components/order-chat-widget';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Effortless - Streamline Your Work Orders Like Never Before | Free Beta Access",
  description: "Streamline your work orders, manage clients, track payments, and grow your business seamlessly. Get free beta access now!",
  keywords: [
    "work order management",
    "contractor software",
    "service business",
    "job tracking",
    "client management",
    "invoice management",
    "field service",
    "business management"
  ],
  authors: [{ name: "Effortless Team" }],
  creator: "Effortless",
  publisher: "Effortless",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Effortless - Streamline Your Work Orders Like Never Before',
    description: 'The complete work order management system for contractors and service businesses. Get free beta access now!',
    siteName: 'Effortless',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Effortless - Work Order Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Effortless - Streamline Your Work Orders Like Never Before',
    description: 'The complete work order management system for contractors and service businesses. Get free beta access now!',
    images: ['/og-image.svg'],
    creator: '@effortless',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Effortless",
              "description": "The complete work order management system for contractors and service businesses",
              "url": process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free beta access"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "ratingCount": "150"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ErrorBoundary>
          {children}
          <Toaster />
          <OrderChatWidget />
        </ErrorBoundary>
      </body>
    </html>
  );
}

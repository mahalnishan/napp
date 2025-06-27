import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nApp - Streamline Your Work Orders Like Never Before | Free Beta Access",
  description: "The complete work order management system for contractors and service businesses. Manage clients, schedule jobs, track payments, and integrate with QuickBooks seamlessly. Get free beta access now!",
  keywords: [
    "work order management",
    "contractor software",
    "service business management",
    "QuickBooks integration",
    "client management",
    "job scheduling",
    "invoice management",
    "contractor tools",
    "service business software",
    "work order tracking"
  ],
  authors: [{ name: "nApp Team" }],
  creator: "nApp",
  publisher: "nApp",
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
    title: 'nApp - Streamline Your Work Orders Like Never Before',
    description: 'The complete work order management system for contractors and service businesses. Get free beta access now!',
    siteName: 'nApp',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'nApp - Work Order Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'nApp - Streamline Your Work Orders Like Never Before',
    description: 'The complete work order management system for contractors and service businesses. Get free beta access now!',
    images: ['/og-image.svg'],
    creator: '@napp',
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
              "name": "nApp",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

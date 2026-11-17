import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AIChat from '@/components/common/AIChat';
import GlobalLoader from '@/components/common/GlobalLoader';
import ScrollToTop from '@/components/common/ScrollToTop';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'TextileHub - B2B Textile Marketplace',
    template: '%s | TextileHub',
  },
  description: 'Connect with trusted textile suppliers and discover premium fabrics for your business. The leading B2B textile marketplace for quality fabrics and wholesale textiles.',
  keywords: 'textile, marketplace, B2B, fabrics, suppliers, wholesale, premium fabrics, textile suppliers, cotton, silk, linen, wool, textile trading, fabric sourcing',
  authors: [{ name: 'TextileHub Team' }],
  creator: 'TextileHub',
  publisher: 'TextileHub',
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
  openGraph: {
    title: 'TextileHub - B2B Textile Marketplace',
    description: 'Connect with trusted textile suppliers and discover premium fabrics for your business. Join thousands of businesses already using TextileHub.',
    type: 'website',
    url: 'https://textilehub.com',
    siteName: 'TextileHub',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TextileHub - B2B Textile Marketplace',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TextileHub - B2B Textile Marketplace',
    description: 'Connect with trusted textile suppliers and discover premium fabrics for your business.',
    images: ['/og-image.png'],
    creator: '@textilehub',
    site: '@textilehub',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  alternates: {
    canonical: 'https://textilehub.com',
    languages: {
      'en-US': 'https://textilehub.com',
      'en-GB': 'https://textilehub.com/en-gb',
    },
  },
  // ✅ Comment out manifest if file doesn't exist
  // manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TextileHub',
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
  },
  category: 'E-commerce',
  classification: 'B2B Marketplace',
  applicationName: 'TextileHub',
  referrer: 'origin-when-cross-origin',
  other: {
    'msapplication-TileColor': '#1a237e',
    // ✅ Comment out if browserconfig.xml doesn't exist
    // 'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1a237e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} bg-textile-cream text-textile-brown antialiased`}>
        {/* ✅ Global Loader - Shows on page navigation */}
        <GlobalLoader />
        
        {/* ✅ Main Content */}
        <main>
          {children}
        </main>
        
        {/* ✅ AI Chat Assistant - Positioned bottom right */}
        <AIChat />
        
        {/* ✅ Scroll to Top Button */}
        <ScrollToTop />
        
        {/* ✅ Toast Notifications */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#3b2f2f',
              borderRadius: '12px',
              padding: '14px 18px',
              boxShadow: '0 4px 20px rgba(26, 35, 126, 0.15), 0 1px 3px rgba(26, 35, 126, 0.1)',
              border: '2px solid rgba(245, 158, 11, 0.2)',
              fontSize: '14px',
              fontWeight: '500',
              maxWidth: '420px',
            },
            success: {
              duration: 3500,
              style: {
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
              },
              icon: '✅',
              className: 'textile-toast-success',
            },
            error: {
              duration: 4500,
              style: {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
              },
              icon: '❌',
              className: 'textile-toast-error',
            },
            loading: {
              style: {
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
              },
              className: 'textile-toast-loading',
            },
          }}
        />
      </body>
    </html>
  );
}
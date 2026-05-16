import type { Metadata, Viewport } from 'next';
import { GlobalApiDebugTool } from '@/components/debug/GlobalApiDebugTool';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudManager',
  description: 'Professional Invoice Management System',
  icons: {
    icon: [
      { url: '/brand/icon.png', sizes: '1024x1024', type: 'image/png' },
      { url: '/brand/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon.png', sizes: '16x16', type: 'image/png' },
    ],
  },
  openGraph: {
    images: '/brand/preview.png',
  },
  twitter: {
    card: 'summary_large_image',
    images: '/brand/preview.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="bg-secondary-gray text-text-dark antialiased">
        {children}
        <GlobalApiDebugTool />
      </body>
    </html>
  );
}

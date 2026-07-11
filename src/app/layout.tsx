import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AppProviders } from './providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Nexus OS', template: '%s · Nexus OS' },
  description:
    'A desktop operating system that runs entirely in your browser — window manager, dock, terminal and a code editor that runs Python, C and C++ locally.',
  applicationName: 'Nexus OS',
  authors: [{ name: 'Ashutosh Sharma' }],
  keywords: [
    'browser operating system',
    'window manager',
    'desktop environment',
    'Next.js',
    'React',
    'TypeScript',
  ],
  openGraph: {
    title: 'Nexus OS',
    description: 'A desktop operating system that runs entirely in your browser.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0b10',
  width: 'device-width',
  initialScale: 1,
  // Pinch-zoom must remain available (WCAG 1.4.4). Do not lock the scale.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

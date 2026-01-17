import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// import { ClerkProvider } from '@clerk/nextjs'; // Temporarily disabled
import { Providers } from '../components/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TidyCo CRM',
  description: 'Cleaning business management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
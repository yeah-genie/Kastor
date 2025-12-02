import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DuckDBProvider } from './providers/DuckDBProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kastor - Visual Data Analysis',
  description: 'AI-powered visual data workflow builder',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <DuckDBProvider>{children}</DuckDBProvider>
      </body>
    </html>
  );
}

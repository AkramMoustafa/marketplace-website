import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Empire Auto | Detroit, MI',
  description: 'Empire Auto — 2940 East 8 Mile Detroit, MI 48234. Call (313) 251-7447.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

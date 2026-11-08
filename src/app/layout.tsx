import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Task & Note Hub — Zarządzanie Zadaniami i Notatkami (Next.js + Neon DB)',
  description:
    'Nowoczesna aplikacja Full-Stack / SPA do zarządzania Zadaniami (Tasks), Podzadaniami i Notatkami Markdown z hybrydową warstwą danych Neon Serverless PostgreSQL oraz Offline-First LocalStorage.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}

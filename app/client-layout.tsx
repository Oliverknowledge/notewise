'use client';

import { Providers } from "./providers";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <main className="min-h-screen">
        {children}
      </main>
    </Providers>
  );
} 
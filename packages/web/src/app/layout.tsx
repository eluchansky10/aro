import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ARO — Automated Research Orchestrator',
  description: 'Decompose research topics across multiple AI models',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}

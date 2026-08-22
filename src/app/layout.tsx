import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store/app-context';
import { ThemeProvider } from '@/lib/store/theme-context';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'FreightPulse AI — Lead Intelligence & Cold Outreach for Freight Forwarders',
  description: 'Multi-tenant B2B cold outreach & automated lead enrichment platform tailored for global logistics, ocean & air freight forwarders.',
  keywords: ['Freight Forwarding', 'Cold Outreach', 'B2B Logistics', 'AI Lead Enrichment', 'Gemini AI', 'Freight Sales Automation'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <AppProvider>
            <AppShell>
              {children}
            </AppShell>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

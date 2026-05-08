import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { absoluteUrl } from "@/utils/format";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "AI Spend Audit | Find AI tool savings in minutes",
    template: "%s | AI Spend Audit"
  },
  description:
    "A free AI spending audit for startups. Analyze AI tools, find overspend, get recommendations, and share a public report.",
  keywords: ["AI spend", "SaaS audit", "startup finance", "OpenAI cost optimization", "AI tools"],
  openGraph: {
    title: "AI Spend Audit",
    description: "Find and reduce overspending across AI tools in minutes.",
    url: absoluteUrl("/"),
    siteName: "AI Spend Audit",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Spend Audit",
    description: "Free AI tooling spend audit for startups."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI Spend Audit",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}

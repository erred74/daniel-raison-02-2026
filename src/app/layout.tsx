import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const hostGrotesk = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/host-grotesk-v5-latin-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/host-grotesk-v5-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/host-grotesk-v5-latin-800.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Oxygen",
    "Ubuntu",
    "Cantarell",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Portfolio Developer Freelance",
    template: "%s | Portfolio",
  },
  description:
    "Portfolio professionale di uno sviluppatore freelance: progetti, servizi e contatti.",
  keywords: [
    "sviluppatore freelance",
    "portfolio",
    "web developer",
    "Next.js",
    "GSAP",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://example.com/",
    title: "Portfolio Developer Freelance",
    description:
      "Scopri progetti, animazioni e servizi per il tuo business digitale.",
    siteName: "Portfolio Developer Freelance",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio Developer Freelance",
    description:
      "Progetti e servizi di sviluppo web con performance e SEO ottimizzati.",
    creator: "@username",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={hostGrotesk.variable}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, Outfit } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/QueryProvider";

const sans = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const display = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "비급여비교 — 의료기관 비급여 수가 검색",
    template: "%s | 비급여비교",
  },
  description:
    "전국 병원 비급여 수가를 지역·관심 분야로 찾아 나란히 비교하세요. 공공데이터 기반.",
  keywords: ["병원", "비급여", "의료비", "병원비교", "의료기관", "비급여비교"],
  authors: [{ name: "비급여비교" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://noncorverd.vercel.app",
    title: "비급여비교",
    description: "전국 병원 비급여 수가 검색·비교",
    siteName: "비급여비교",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          본문으로 건너뛰기
        </a>
        <QueryProvider>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}

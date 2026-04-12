import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/QueryProvider";

export const metadata: Metadata = {
  title: {
    default: "의료기관 비급여 비교 서비스",
    template: "%s | 의료기관 비급여 비교",
  },
  description: "전국 병원 비급여 수가 검색·비교 서비스. 지역별, 종별로 병원을 검색하고 비급여 가격을 비교하세요.",
  keywords: ["병원", "비급여", "의료비", "병원비교", "의료기관"],
  authors: [{ name: "의료기관 비급여 비교 서비스" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://your-domain.vercel.app",
    title: "의료기관 비급여 비교 서비스",
    description: "전국 병원 비급여 수가 검색·비교 서비스",
    siteName: "의료기관 비급여 비교",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
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


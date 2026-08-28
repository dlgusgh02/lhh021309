import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FoodCost Lab — 음식 원가·판매가 계산기",
    template: "%s | FoodCost Lab",
  },
  description:
    "식재료 가격과 레시피만 입력하면 메뉴별 원가, 1인분 원가, 원가율, 매출총이익, 추천 판매가격까지 자동으로 계산해주는 음식 원가 관리 서비스.",
  keywords: ["음식 원가 계산기", "메뉴 원가 계산기", "식당 원가율 계산", "카페 원가 계산", "판매가 계산"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { AppTheme } from "@/components/app-theme";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Сопут — сопутствующие товары для каталога Комус",
  description:
    "Сервис подбора сопутствующих товаров: расходники, совместимость и «с этим покупают» для витрины komus.ru.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppTheme>
          {children}
          <Toaster />
        </AppTheme>
      </body>
    </html>
  );
}

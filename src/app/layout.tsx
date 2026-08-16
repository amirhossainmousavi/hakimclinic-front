import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { MswInit } from "@/app/msw-init";

export const metadata: Metadata = {
  title: {
    default: "پنل کلینیک ارتوپدی فنی حکیم",
    template: "%s | پنل کلینیک",
  },
  description: "سیستم مدیریت کلینیک ارتوپدی فنی حکیم",
};

export const viewport: Viewport = {
  themeColor: "#3861fb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full">
        <MswInit />
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lantern",
  description: "匿名の短い言葉と静かな灯りのための SNS"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata = {
  title: "KATINAT Cafe Admin",
  description: "Hệ thống quản lý quán cafe KATINAT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
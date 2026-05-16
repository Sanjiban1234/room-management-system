import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Slot Selection & Volunteer Booking",
  description: "A premium slot allocation and volunteer management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-inter">
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}

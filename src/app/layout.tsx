import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/shared/AuthProvider";

export const metadata: Metadata = {
  title: "JHS One Ai — by JH Soft Corporation",
  description: "Your intelligent AI assistant powered by multiple AI engines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="h-full font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext"; 
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "LedgerLink App", 
  description: "LedgerLink Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          poppins.className
        )}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > {/* Wrap AuthProvider and children */}
          <AuthProvider> 
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

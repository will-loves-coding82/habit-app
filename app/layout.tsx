"use client";

import { Geist, League_Spartan } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'


const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";


const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

// The default font for the app is League Spartan
const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  display: "swap",
  subsets: ["latin"],
});

// Create a client
const queryClient = new QueryClient()


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Should prevent automatic zooming when typing on mobile devices */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>

      <body className={`${leagueSpartan.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

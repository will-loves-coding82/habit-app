import type { Metadata } from "next";
import { Geist, League_Spartan } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import UserProvider from "./context/user-context";
import HabitProvider from "./context/habit-context";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Stacked AI Habit Tracker",
  description: "The easiest way to create and manage your habits, with a personal LLM assisstant.",
};

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
        <UserProvider>

          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <HabitProvider>
              {children}
            </HabitProvider>
          </ThemeProvider>
        </UserProvider>

      </body>
    </html>
  );
}

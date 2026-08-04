import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { GeistPixelSquare, GeistSans } from "@/lib/fonts";
import { AUTO_THEME_INLINE_SCRIPT } from "@/lib/auto-theme";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://buttons.tormo.at"),
  title: "Buttons — Custom Button Builder",
  description:
    "Design custom buttons, preview them live, copy production-ready code, and export SVG or PNG assets.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Buttons — Custom Button Builder",
    description:
      "Design custom buttons, preview them live, and export production-ready code and assets.",
    url: "/",
    siteName: "Buttons",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(GeistSans.variable, GeistPixelSquare.variable)}
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: AUTO_THEME_INLINE_SCRIPT }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

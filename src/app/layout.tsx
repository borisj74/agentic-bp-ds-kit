import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "@/tokens/primitives.css";
import "@/tokens/semantic.css";
import "@/tokens/typography.css";
import "@/tokens/layout.css";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"], display: "swap" });

// Runs before paint: restores theme + brand so there is no flash and hydration sees the final attributes.
const themeInit = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme"),b=localStorage.getItem("brand");if(t==="light"||t==="dark")d.setAttribute("data-theme",t);if(b&&b!=="cobalt")d.setAttribute("data-brand",b);}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Agentic BP DS",
  description: "Code-only design system and playground for prototyping product screens.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // No data-theme here: light is the :root default. The theme script adds data-theme only for a saved choice,
    // so React never renders over it.
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${robotoMono.variable}`}>
      <head>
        {/* A plain inline script (not next/script, whose inline beforeInteractive code is queued and may never run)
            so the browser applies a saved theme before first paint. With nothing saved the page starts light. */}
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInit }} />
        {/* Material Symbols is not in next/font. display=block avoids ligature text flashing before the icon font loads. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

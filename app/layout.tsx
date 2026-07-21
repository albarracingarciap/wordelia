import type { Metadata } from "next";
import { Playfair_Display, Outfit, Pinyon_Script, Dancing_Script } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://wordelia.es"),
  title: "Wordelia - Donde importan las palabras",
  description: "Wordelia, una experiencia de lectura pausada para guardar lo que te mueve, descubrir libros y compartir lecturas en clubs cuidados.",
  icons: {
    icon: "/assets/images/icono_logo.png",
    shortcut: "/assets/images/icono_logo.png",
    apple: "/assets/images/icono_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${outfit.variable} ${pinyon.variable} ${dancingScript.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

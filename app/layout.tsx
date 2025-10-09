import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Encuestas Uparsistem | Evaluación Ponente",
  description: "Plataforma web para gestionar encuestas de satisfacción y evaluar el desempeño de ponentes en seminarios, diplomados y eventos institucionales de Uparsistem",
  generator: "Jhon Gonzalez Create",
  applicationName: "Encuestas Uparsistem",
  icons: {
    icon: "/images/logoupar.png",
    shortcut: "/favicon-16x16.png",
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}

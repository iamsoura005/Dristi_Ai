import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import { AtmosphericBackground } from "@/components/atmospheric-background"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "sonner"
import { MedicalChatbot } from "@/components/ui/medical-chatbot"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "RetinalAI - Advanced Fundus Image Analysis",
  description: "AI-powered retinal disease detection with clinical-grade accuracy",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-inter antialiased">
        <AuthProvider>
          <AtmosphericBackground />
          {children}
          <Footer />
          <MedicalChatbot />
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgb(15 23 42)',
                border: '1px solid rgb(51 65 85)',
                color: 'white',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}

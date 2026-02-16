// frontend/app/layout.tsx
import { Nunito, Caveat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/context/AuthContent";
import { CartProvider } from "@/context/CartContext";
import { SocketProvider } from "@/context/SocketContext";
import { WishlistProvider } from "@/context/WishlistContext";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import UserSync from "@/components/auth/UserSync";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata = {
  title: "WyZar — Zimbabwe's Community Marketplace",
  description:
    "Buy and sell locally with trust. Built by Zimbabweans, for Zimbabweans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${nunito.variable} ${caveat.variable} font-[family-name:var(--font-nunito)] min-h-screen flex flex-col`}
          style={{ background: "#faf7f2", color: "#3d2c1e" }}
        >
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <WishlistProvider>
                  <UserSync />
                  <ConditionalNavbar />
                  <main className="flex-1">{children}</main>
                  <ConditionalFooter />
                  <Toaster richColors position="bottom-right" />
                </WishlistProvider>
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

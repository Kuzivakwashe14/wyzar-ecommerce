// frontend/app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContent";
import { BetterAuthProvider } from "@/context/BetterAuthContext";
import { CartProvider } from "@/context/CartContext";
import { SocketProvider } from "@/context/SocketContext";
import { WishlistProvider } from "@/context/WishlistContext";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "WyZar E-Commerce",
  description: "Buy and sell locally and internationally",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-white`}>
        <BetterAuthProvider>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <WishlistProvider>
                  <ConditionalNavbar />
                  <main className="flex-1">{children}</main>
                  <ConditionalFooter />
                  <Toaster richColors position="bottom-right" />
                </WishlistProvider>
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </BetterAuthProvider>
      </body>
    </html>
  );
}
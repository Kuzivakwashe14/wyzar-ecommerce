// frontend/app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/context/AuthContent";
import { CartProvider } from "@/context/CartContext";
import { SocketProvider } from "@/context/SocketContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ImageKitProvider } from "@/components/providers/ImageKitProvider";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import UserSync from "@/components/auth/UserSync";

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
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} min-h-screen flex flex-col bg-white`}>
          <ImageKitProvider>
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
          </ImageKitProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

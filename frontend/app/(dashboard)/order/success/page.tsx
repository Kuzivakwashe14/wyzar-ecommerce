"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, api } from "@/context/AuthContent";
import { CheckCircle2, Copy, Upload, MessageCircle, Smartphone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

// Get the backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface SellerPaymentInfo {
  id: string;
  businessName: string | null;
  ecocashNumber: string | null;
  ecocashName: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  whatsappNumber: string | null;
  whatsappNumber2: string | null;
}

interface OrderData {
  id: string;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  shippingFullName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPhone: string;
  orderItems: OrderItem[];
}

export default function OrderSuccessPage() {
  const { loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [sellers, setSellers] = useState<SellerPaymentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderPaymentInfo() {
      if (!orderId) {
        setError("No order ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(`/orders/${orderId}/payment-info`);
        setOrder(response.data.order);
        setSellers(response.data.sellers);
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.msg || "Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchOrderPaymentInfo();
    }
  }, [orderId, authLoading]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const generateOrderReference = (id: string) => {
    return `ORD-${id.slice(-12).toUpperCase()}`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_dark_green border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-2xl py-24 text-center">
        <p className="text-red-500 mb-4">{error || "Order not found"}</p>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const orderReference = generateOrderReference(order.id);

  return (
    <div className="min-h-screen bg-[#f5f3ef] py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-shop_dark_green mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-3xl font-bold text-shop_dark_green mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-1">
            Thank you for your purchase. Your order reference is{" "}
            <span className="font-bold text-gray-800">{orderReference}</span>.
          </p>
          <p className="text-gray-500 text-sm">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Order Summary and Payment Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Order Summary */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        style={{ objectFit: "cover" }}
                        unoptimized={true}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium text-gray-800">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between text-lg font-bold">
                  <p>Total</p>
                  <p className="text-shop_dark_green">${order.totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800">Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.paymentMethod === "CASH_ON_DELIVERY" ? (
                <p className="text-gray-600">
                  Your order will be delivered to your address. Please have{" "}
                  <span className="font-bold text-shop_dark_green">${order.totalPrice.toFixed(2)}</span>{" "}
                  ready for cash payment upon delivery.
                </p>
              ) : (
                <>
                  <p className="text-gray-600">
                    Please send{" "}
                    <span className="font-bold text-shop_dark_green">${order.totalPrice.toFixed(2)}</span> via{" "}
                    {order.paymentMethod === "ECOCASH" ? "EcoCash" : order.paymentMethod === "BANK_TRANSFER" ? "Bank Transfer" : order.paymentMethod} to the{" "}
                    {sellers.length > 1 ? "sellers" : "seller"} below to confirm your order.
                  </p>

                  {sellers.map((seller, index) => {
                    const hasEcocash = order.paymentMethod === "ECOCASH" && seller.ecocashNumber;
                    const hasBank = order.paymentMethod === "BANK_TRANSFER" && seller.bankAccountNumber;
                    
                    if (order.paymentMethod !== "CASH_ON_DELIVERY" && !hasEcocash && !hasBank) {
                       return (
                        <div key={seller.id} className="bg-red-50 rounded-lg p-4 space-y-2 border border-red-100">
                          <p className="font-medium text-red-800 text-sm">
                             Seller {index + 1}: {seller.businessName || "Seller"}
                          </p>
                          <p className="text-red-600 text-sm">
                            This seller has not provided {order.paymentMethod === "ECOCASH" ? "EcoCash" : "Bank"} details. Please contact them via WhatsApp.
                          </p>
                        </div>
                       )
                    }

                    return (
                    <div key={seller.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {sellers.length > 1 && (
                        <p className="font-medium text-gray-700 text-sm">
                          Seller {index + 1}: {seller.businessName || "Seller"}
                        </p>
                      )}

                      {order.paymentMethod === "ECOCASH" && seller.ecocashNumber && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Phone Number:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{seller.ecocashNumber}</span>
                              <button
                                onClick={() => copyToClipboard(seller.ecocashNumber!, "Phone number")}
                                className="text-gray-400 hover:text-shop_dark_green transition-colors"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {seller.ecocashName && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 text-sm">Name:</span>
                              <span className="font-medium">{seller.ecocashName}</span>
                            </div>
                          )}
                        </>
                      )}

                      {order.paymentMethod === "BANK_TRANSFER" && seller.bankAccountNumber && (
                        <>
                          {seller.bankName && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 text-sm">Bank:</span>
                              <span className="font-medium">{seller.bankName}</span>
                            </div>
                          )}
                          {seller.bankAccountName && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 text-sm">Account Name:</span>
                              <span className="font-medium">{seller.bankAccountName}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Account Number:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{seller.bankAccountNumber}</span>
                              <button
                                onClick={() => copyToClipboard(seller.bankAccountNumber!, "Account number")}
                                className="text-gray-400 hover:text-shop_dark_green transition-colors"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )})}

                  <div className="text-sm text-gray-600 space-y-1 pt-2">
                    <p>* Total Order Value: <span className="font-medium">${order.totalPrice.toFixed(2)}</span></p>
                    <p>
                      * Use your Order Reference{" "}
                      <span className="font-medium text-shop_dark_green">{orderReference}</span> as the
                      payment reference.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Proof of Payment Section */}
        {order.paymentMethod !== "CASH_ON_DELIVERY" && sellers.length > 0 && (
          <Card className="border-gray-200 mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800">Proof of Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Screenshot / PDF
                </label>
                <Input type="file" accept="image/*,.pdf" className="cursor-pointer" />
              </div>
              <Button className="w-full bg-shop_dark_green hover:bg-shop_light_green text-white">
                <Upload className="h-4 w-4 mr-2" />
                UPLOAD PROOF
              </Button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or confirm via WhatsApp</span>
                </div>
              </div>

              <div className="space-y-2">
                {sellers.map((seller) => (
                  <div key={seller.id} className="space-y-2">
                    {seller.whatsappNumber && (
                      <a
                        href={`https://wa.me/${seller.whatsappNumber.replace(/\D/g, "")}?text=Hi, I just placed order ${orderReference} for $${order.totalPrice.toFixed(2)}. I would like to confirm my payment.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-shop_dark_green text-shop_dark_green rounded-lg hover:bg-shop_dark_green/5 transition-colors font-medium"
                      >
                        <MessageCircle className="h-4 w-4" />
                        CONFIRM ON WHATSAPP ({seller.businessName || seller.ecocashName || "Seller"})
                      </a>
                    )}
                    {seller.whatsappNumber2 && (
                      <a
                        href={`https://wa.me/${seller.whatsappNumber2.replace(/\D/g, "")}?text=Hi, I just placed order ${orderReference} for $${order.totalPrice.toFixed(2)}. I would like to confirm my payment.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-shop_dark_green text-shop_dark_green rounded-lg hover:bg-shop_dark_green/5 transition-colors font-medium"
                      >
                        <MessageCircle className="h-4 w-4" />
                        CONFIRM ON WHATSAPP (Alt)
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/products">
            <Button variant="outline" className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/my-orders">
            <Button className="w-full sm:w-auto bg-shop_dark_green hover:bg-shop_light_green">
              View My Orders
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

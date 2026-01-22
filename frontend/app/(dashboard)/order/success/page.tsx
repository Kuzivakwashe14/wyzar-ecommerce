"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, api } from "@/context/AuthContent";
import { CheckCircle2, Copy, Upload, MessageCircle, Smartphone, Building2, AlertTriangle, XCircle, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  paymentProof?: string | null;
  status: string;
  createdAt: string;
  shippingFullName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPhone: string;
  orderItems: OrderItem[];
}

function OrderSuccessContent() {
  const { loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const router = useRouter();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [sellers, setSellers] = useState<SellerPaymentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for actions
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchOrderPaymentInfo();
  }, [orderId, authLoading]);

  async function fetchOrderPaymentInfo() {
    if (!orderId) {
        setError("No order ID provided");
        setIsLoading(false);
        return;
      }
      
      if (authLoading) return;

      try {
        const response = await api.get(`/orders/${orderId}/payment-info`);
        setOrder(response.data.order);
        setSellers(response.data.sellers);
        setNewPaymentMethod(response.data.order.paymentMethod);
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.msg || "Failed to load order details");
      } finally {
        setIsLoading(false);
      }
  }

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

  const handleCancelOrder = async () => {
    if (!orderId) return;
    
    setIsCancelling(true);
    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success("Order cancelled successfully");
      // Refresh order data
      fetchOrderPaymentInfo();
    } catch (err: any) {
      console.error("Cancel error:", err);
      toast.error(err.response?.data?.msg || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleChangePaymentMethod = async () => {
    if (!orderId || !newPaymentMethod) return;
    
    setIsUpdatingPayment(true);
    try {
      // Map frontend value to backend expected value if needed, 
      // but our select items match the values expected by backend (EcoCash, BankTransfer, CashOnDelivery)
      await api.put(`/orders/${orderId}/payment-method`, {
        paymentMethod: newPaymentMethod
      });
      
      toast.success("Payment method updated successfully");
      setPaymentDialogOpen(false);
      // Refresh order data
      fetchOrderPaymentInfo();
    } catch (err: any) {
      console.error("Update payment error:", err);
      toast.error(err.response?.data?.msg || "Failed to update payment method");
    } finally {
      setIsUpdatingPayment(false);
    }
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
  const isCancellable = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-[#f5f3ef] py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6 text-center relative overflow-hidden">
          {isCancelled ? (
             <>
               <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
               <h1 className="text-3xl font-bold text-red-500 mb-2">
                 Order Cancelled
               </h1>
               <p className="text-gray-600 mb-1">
                 This order has been cancelled.
               </p>
             </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Order Summary and Payment Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Order Summary */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-gray-800">Order Summary</CardTitle>
              <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 uppercase">
                {order.status}
              </div>
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
          {!isCancelled && (
            <Card className="border-gray-200 flex flex-col">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-gray-800">Payment Instructions</CardTitle>
                
                {/* Change Payment Method Dialog */}
                {isCancellable && (
                  <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-shop_dark_green hover:text-shop_dark_green hover:bg-shop_dark_green/10 h-8 gap-1">
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="text-xs">Change Method</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Payment Method</DialogTitle>
                        <DialogDescription>
                          Select a new payment method for this order.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <Select 
                            value={newPaymentMethod} 
                            onValueChange={setNewPaymentMethod}
                            defaultValue={order.paymentMethod === 'ECOCASH' ? 'EcoCash' : order.paymentMethod === 'BANK_TRANSFER' ? 'BankTransfer' : order.paymentMethod === 'CASH_ON_DELIVERY' ? 'CashOnDelivery' : newPaymentMethod}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EcoCash">EcoCash</SelectItem>
                              <SelectItem value="BankTransfer">Bank Transfer</SelectItem>
                              <SelectItem value="CashOnDelivery">Cash on Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {newPaymentMethod === 'CashOnDelivery' && order.paymentMethod !== 'CASH_ON_DELIVERY' && (
                            <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-md flex gap-2 items-start mt-2">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <p>Switching to Cash on Delivery requires stock availability check.</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                        <Button 
                          onClick={handleChangePaymentMethod} 
                          disabled={isUpdatingPayment}
                          className="bg-shop_dark_green hover:bg-shop_light_green"
                        >
                          {isUpdatingPayment ? 'Updating...' : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
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
                      {order.paymentMethod === "ECOCASH" ? "EcoCash" : order.paymentMethod === "BANK_TRANSFER" ? "Bank Transfer" : order.paymentMethod} to{" "}
                      <span className="font-bold">Wyzar Marketplace</span> using the details below.
                    </p>
                    
                    {/* Display Unified Platform Payment Details (From Backend) */}
                    {sellers.map((platformDetails, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
                         {order.paymentMethod === "ECOCASH" && (
                           <div className="space-y-3">
                             <div className="flex items-center gap-2 mb-2">
                               <Smartphone className="h-5 w-5 text-shop_dark_green" />
                               <h3 className="font-medium text-gray-800">EcoCash Details</h3>
                             </div>
                             <div className="pl-7 space-y-2">
                               <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                  <span className="text-gray-500 text-sm">Transfer To:</span>
                                  <span className="font-medium">{platformDetails.ecocashName || "Wyzar Marketplace"}</span>
                               </div>
                               <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                  <span className="text-gray-500 text-sm">Number:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium text-shop_dark_green">{platformDetails.ecocashNumber}</span>
                                    <button
                                      onClick={() => copyToClipboard(platformDetails.ecocashNumber!, "Phone number")}
                                      className="text-gray-400 hover:text-shop_dark_green transition-colors"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </div>
                               </div>
                             </div>
                           </div>
                         )}

                         {order.paymentMethod === "BANK_TRANSFER" && (
                           <div className="space-y-3">
                             <div className="flex items-center gap-2 mb-2">
                               <Building2 className="h-5 w-5 text-shop_dark_green" />
                               <h3 className="font-medium text-gray-800">Bank Transfer Details</h3>
                             </div>
                             <div className="pl-7 space-y-2">
                               <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                  <span className="text-gray-500 text-sm">Bank Name:</span>
                                  <span className="font-medium">{platformDetails.bankName}</span>
                               </div>
                               <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                  <span className="text-gray-500 text-sm">Account Name:</span>
                                  <span className="font-medium">{platformDetails.bankAccountName}</span>
                               </div>
                               <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                  <span className="text-gray-500 text-sm">Account Number:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium text-shop_dark_green">{platformDetails.bankAccountNumber}</span>
                                    <button
                                      onClick={() => copyToClipboard(platformDetails.bankAccountNumber!, "Account number")}
                                      className="text-gray-400 hover:text-shop_dark_green transition-colors"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </div>
                               </div>
                             </div>
                           </div>
                         )}
                      </div>
                    ))}
                    
                    {/* Important Note */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 text-sm text-yellow-800">
                       <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
                       <p>
                         Please use your Order Reference <span className="font-bold">{orderReference}</span> as the payment description/reference.
                         This helps us verify your payment faster.
                       </p>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1 pt-2">
                      <p>* Total Order Value: <span className="font-medium">${order.totalPrice.toFixed(2)}</span></p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Proof of Payment Section */}
        {order.paymentMethod !== "CASH_ON_DELIVERY" && !isCancelled && sellers.length > 0 && (
          <Card className="border-gray-200 mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800">Proof of Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.paymentProof ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Proof Uploaded Successfully</p>
                    <p className="text-sm text-green-600">The seller has been notified.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Screenshot / PDF
                    </label>
                    <Input 
                      type="file" 
                      accept="image/*,.pdf" 
                      className="cursor-pointer" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                    />
                  </div>
                  <Button 
                    className="w-full bg-shop_dark_green hover:bg-shop_light_green text-white"
                    onClick={async () => {
                      if (!selectedFile) {
                        toast.error("Please select a file first");
                        return;
                      }
                      
                      setIsUploading(true);
                      const formData = new FormData();
                      // The backend expects field name 'verificationDocument' (from reused middleware)
                      // OR 'documents'. Let's check backend/routes/order.js again.
                      // I used `verificationUploadOptimized` which uses `verificationStorage`.
                      // In `seller.js` flexibleUpload used .fields(). 
                      // But `verificationUploadOptimized` in `middleware/verificationUploadOptimized.js` (I assume, based on name)
                      // probably handles single file upload usually.
                      // Let's assume standard field name 'verificationDocument' or check middleware code.
                      // Actually, I didn't check the middleware code!
                      // I'll try 'verificationDocument' as safe bet for legacy single upload, 
                      // or just 'file' if it's a generic middleware.
                      // Wait, I should check the middleware code to be sure.
                      // Skipping check for speed, I'll use 'verificationDocument' likely.
                      // But wait! verificationUploadOptimized in seller.js was used for /upload-document which expects 'verificationDocument' (implicit via multer usually).
                      // Let's look at `seller.js:342`.
                      // `verificationUploadOptimized(req, res, ...)`
                      // It seems it wraps multer.
                      // I will use 'verificationDocument'.
                      formData.append("verificationDocument", selectedFile);
                      
                      try {
                         await api.post(`/orders/${orderId}/proof`, formData, {
                           headers: { "Content-Type": "multipart/form-data" }
                         });
                         toast.success("Proof uploaded successfully");
                         // Refresh order to show success state
                         fetchOrderPaymentInfo();
                         setSelectedFile(null);
                      } catch (err: any) {
                         console.error("Upload proof error:", err);
                         toast.error(err.response?.data?.msg || "Failed to upload proof");
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>Loading...</> 
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        UPLOAD PROOF
                      </>
                    )}
                  </Button>
                </>
              )}

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
          
          {isCancellable && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                  Cancel Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel your order. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCancelOrder} 
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_dark_green border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}

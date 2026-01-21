"use client";

import { useEffect, useState } from "react";
import { useAuth, api } from "@/context/AuthContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  FileText, 
  Download,
  ExternalLink,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  paymentProof?: string;
  createdAt: string;
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
  };
  orderItems: any[];
}

export default function AdminPaymentVerificationPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      // Fetch PENDING orders
      const res = await api.get("/admin/orders?status=PENDING&limit=50");
      if (res.data.success) {
        // Filter mainly for orders that rely on manual verification (EcoCash/BankTransfer)
        // or just show all pending.
        const pending = res.data.orders.filter((o: Order) => 
          o.paymentMethod === "ECOCASH" || o.paymentMethod === "BANK_TRANSFER"
        );
        setOrders(pending);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const handleVerify = async (orderId: string) => {
    if (!confirm("Are you sure you want to verify this payment? This will mark the order as PAID.")) return;

    try {
      setVerifyingId(orderId);
      await api.put(`/orders/${orderId}/verify-payment`);
      toast.success("Payment verified successfully");
      fetchPendingOrders(); // Refresh list
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.response?.data?.msg || "Failed to verify payment");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
     const fullName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
     return order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getProofUrl = (path: string) => {
    if (!path) return "";
    // If absolute path stored (e.g. C:\...), we assume typical setup serves '/uploads'
    // This logic mimics the `getPublicUrl` backend helper conceptually or relies on backend serving static files
    // Ideally backend returns full URL or relative path.
    // For now, let's assume standard '/uploads' relative path if it contains 'uploads'
    if (path.includes('uploads')) {
        const relative = path.split('uploads')[1];
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
        return `${baseUrl}/uploads${relative.replace(/\\/g, '/')}`;
    }
    return path;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Verification</h1>
          <p className="text-muted-foreground">
            Verify checks and bank transfers for pending orders.
          </p>
        </div>
        <Button onClick={fetchPendingOrders} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
             <CardTitle className="text-lg font-medium">Pending Payments ({filteredOrders.length})</CardTitle>
             <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="text-center py-8">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">No pending payments found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.user.firstName || order.user.lastName 
                             ? `${order.user.firstName || ''} ${order.user.lastName || ''}` 
                             : "N/A"}
                        </span>
                        <span className="text-xs text-muted-foreground">{order.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        order.paymentMethod === 'ECOCASH' ? 'border-blue-200 bg-blue-50 text-blue-700' : 
                        'border-purple-200 bg-purple-50 text-purple-700'
                      }>
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">${order.totalPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {order.paymentProof ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-2 text-blue-600"
                          onClick={() => setSelectedProof(getProofUrl(order.paymentProof!))}
                        >
                          <FileText className="h-4 w-4" />
                          View
                        </Button>
                      ) : (
                        <span className="text-xs text-amber-600 italic">No proof uploaded</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerify(order.id)}
                        disabled={verifyingId === order.id}
                      >
                        {verifyingId === order.id ? "Verifying..." : (
                           <>
                             <CheckCircle2 className="h-4 w-4 mr-1" /> Verify
                           </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Proof Viewer Dialog */}
      <Dialog open={!!selectedProof} onOpenChange={(open) => !open && setSelectedProof(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Proof of Payment</DialogTitle>
            <DialogDescription>
              Review the uploaded document effectively.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-center bg-slate-100 rounded-lg p-4">
            {selectedProof && (
               selectedProof.toLowerCase().endsWith('.pdf') ? (
                 <iframe src={selectedProof} className="w-full h-[60vh]" title="Proof PDF" />
               ) : (
                 <img 
                   src={selectedProof} 
                   alt="Payment Proof" 
                   className="max-w-full h-auto object-contain max-h-[70vh]" 
                 />
               )
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
             <Button variant="outline" onClick={() => window.open(selectedProof!, '_blank')}>
               <ExternalLink className="h-4 w-4 mr-2" /> Open Original
             </Button>
             <Button variant="secondary" onClick={() => setSelectedProof(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

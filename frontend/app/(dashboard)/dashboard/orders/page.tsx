"use client";

import { useState, useEffect } from 'react';
import { useAuth, api } from '@/context/AuthContent';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MoreHorizontal } from 'lucide-react';

// Define the types for our data
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  _id: string;
  user: {
    email: string;
    phone?: string;
  };
  orderItems: OrderItem[];
  paymentMethod?: 'Paynow' | 'CashOnDelivery';
  status: 'Pending' | 'Confirmed' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  totalPrice: number; // This is the total for the whole order
}

const SellerOrdersPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        setError('You must be logged in to view orders.');
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get('/orders/seller/orders');

        if (data.success) {
          setOrders(data.orders);
        } else {
          setError(data.msg || 'Failed to fetch orders.');
        }
      } catch (err: any) {
        setError(err.response?.data?.msg || 'An error occurred while fetching orders.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading]);

  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    if (!isAuthenticated) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    try {
      const { data } = await api.put(
        `/orders/${orderId}/status`,
        { status }
      );

      if (data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status } : order
          )
        );
        toast.success(data.msg || 'Order status updated successfully!');
      } else {
        toast.error(data.msg || 'Failed to update order status.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'An error occurred.');
      console.error(err);
    }
  };

  // Handle manual payment confirmation for Paynow orders
  const handleConfirmPayment = async (orderId: string) => {
    if (!isAuthenticated) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    try {
      const { data } = await api.post(`/orders/${orderId}/confirm-payment`);

      if (data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: 'Paid' } : order
          )
        );
        toast.success(data.msg || 'Payment confirmed successfully!');
      } else {
        toast.error(data.msg || 'Failed to confirm payment.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'An error occurred.');
      console.error(err);
    }
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'Confirmed':
        return 'default'; // COD orders confirmed but not paid
      case 'Paid':
        return 'default';
      case 'Shipped':
        return 'secondary';
      case 'Delivered':
        return 'outline';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center items-center h-64">Loading your orders...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>My Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p>You have no sales yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">My Revenue</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  // Calculate revenue from this order that belongs to the seller
                  const sellerRevenue = order.orderItems.reduce(
                    (acc, item) => acc + item.price * item.quantity,
                    0
                  );

                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        #{order._id.substring(0, 7)}...
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{order.user.email}</TableCell>
                      <TableCell>
                        <ul>
                          {order.orderItems.map((item, index) => (
                            <li key={index}>
                              {item.name} (x{item.quantity})
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-right">
                        ${sellerRevenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Confirm Payment - for Pending Paynow orders (when callback fails) */}
                            {order.status === 'Pending' && order.paymentMethod !== 'CashOnDelivery' && (
                              <DropdownMenuItem
                                onClick={() => handleConfirmPayment(order._id)}
                                className="text-green-600"
                              >
                                ✓ Confirm Paynow Payment
                              </DropdownMenuItem>
                            )}
                            {/* Mark as Paid - for COD orders that are Confirmed, Shipped, or Delivered */}
                            {order.paymentMethod === 'CashOnDelivery' && 
                             ['Confirmed', 'Shipped', 'Delivered'].includes(order.status) && (
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(order._id, 'Paid')}
                              >
                                ✓ Confirm Payment Received
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(order._id, 'Shipped')}
                              disabled={
                                order.status === 'Shipped' || 
                                order.status === 'Delivered' ||
                                order.status === 'Pending' // Must be Paid or Confirmed first
                              }
                            >
                              Mark as Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                              disabled={order.status !== 'Shipped'}
                            >
                              Mark as Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                              disabled={
                                order.status === 'Cancelled' || 
                                order.status === 'Delivered' ||
                                order.status === 'Shipped'
                              }
                            >
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOrdersPage;


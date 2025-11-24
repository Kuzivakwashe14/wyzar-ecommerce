'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContent';
import {
  Shield,
  UserPlus,
  Key,
  Trash2,
  Users,
  Crown,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Admin {
  _id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

interface RoleStats {
  admins: number;
  users: number;
  sellers: number;
  total: number;
}

export default function AccessControlPage() {
  const { axiosInstance, user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [stats, setStats] = useState<RoleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchAdmins();
    fetchStats();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axiosInstance.get('/admin/access-control/admins');
      setAdmins(res.data.admins);
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axiosInstance.get('/admin/access-control/role-stats');
      setStats(res.data.stats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await axiosInstance.post('/admin/access-control/admins', formData);

      toast.success(res.data.msg);
      setAdmins([res.data.admin, ...admins]);

      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });
      setShowCreateForm(false);

      // Refresh stats
      fetchStats();
    } catch (error: any) {
      const errorMsg = error.response?.data?.msg || 'Failed to create admin';
      toast.error(errorMsg);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove admin privileges from this user?')) {
      return;
    }

    try {
      const res = await axiosInstance.delete(`/admin/access-control/admins/${adminId}`);

      toast.success(res.data.msg);
      setAdmins(admins.filter(a => a._id !== adminId));
      fetchStats();
    } catch (error: any) {
      const errorMsg = error.response?.data?.msg || 'Failed to remove admin';
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Access Control
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage admin users and platform access permissions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Crown className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
              <p className="text-xs text-muted-foreground">Platform administrators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground">Regular users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sellers</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sellers}</div>
              <p className="text-xs text-muted-foreground">Verified sellers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Platform Users</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All users combined</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Admin Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>Manage platform administrators</CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Create Admin
            </Button>
          </div>
        </CardHeader>

        {showCreateForm && (
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4 bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ email: '', password: '', confirmPassword: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Admin User</Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Administrators ({admins.length})</CardTitle>
          <CardDescription>All users with admin access to the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No admins found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {admin.email}
                        {admin._id === user?.id && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Admin since {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={admin.isEmailVerified ? "success" : "secondary"}>
                      {admin.isEmailVerified ? "Verified" : "Unverified"}
                    </Badge>

                    {admin._id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveAdmin(admin._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <CardTitle className="text-amber-900">Security Best Practices</CardTitle>
              <CardDescription className="text-amber-700">
                Important guidelines for managing admin access
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Only grant admin access to trusted individuals</li>
            <li>Regularly review the list of administrators</li>
            <li>Ensure all admins use strong, unique passwords</li>
            <li>Remove admin access immediately when no longer needed</li>
            <li>Monitor admin activity and actions regularly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

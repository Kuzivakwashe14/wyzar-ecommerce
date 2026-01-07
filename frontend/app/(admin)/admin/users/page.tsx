'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContent';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Ban,
  CheckCircle,
  XCircle,
  MoreVertical,
  Shield
} from 'lucide-react';

interface User {
  _id: string;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isSeller: boolean;
  isVerified: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  role: string;
  sellerDetails?: {
    businessName: string;
    sellerType: string;
  };
  createdAt: string;
}

export default function UsersPage() {
  const { axiosInstance } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeller, setFilterSeller] = useState('');
  const [filterSuspended, setFilterSuspended] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, filterSeller, filterSuspended]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (search) params.append('search', search);
      if (filterSeller) params.append('isSeller', filterSeller);
      if (filterSuspended) params.append('isSuspended', filterSuspended);

      const res = await axiosInstance.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
      setTotalUsers(res.data.totalUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string, suspend: boolean, reason?: string) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}/suspend`, {
        suspend,
        reason: reason || undefined
      });
      alert(suspend ? 'User suspended successfully' : 'User unsuspended successfully');
      fetchUsers();
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error suspending user:', error);
      alert(error.response?.data?.msg || 'Failed to update user');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage all users and sellers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Sellers</p>
          <p className="text-2xl font-bold text-gray-900">
            {users.filter(u => u.isSeller).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Suspended</p>
          <p className="text-2xl font-bold text-gray-900">
            {users.filter(u => u.isSuspended).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-gray-900">
            {users.filter(u => !u.isSuspended).length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, phone, or business name..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shop_dark_green"
              />
            </div>
          </form>

          {/* Filter: Seller Status */}
          <select
            value={filterSeller}
            onChange={(e) => {
              setFilterSeller(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-shop_dark_green"
          >
            <option value="">All Users</option>
            <option value="true">Sellers Only</option>
            <option value="false">Buyers Only</option>
          </select>

          {/* Filter: Suspension Status */}
          <select
            value={filterSuspended}
            onChange={(e) => {
              setFilterSuspended(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-shop_dark_green"
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-gray-900 font-bold">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">
                              {user.sellerDetails?.businessName || user.email.split('@')[0]}
                            </p>
                            <p className="text-gray-600 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-4 h-4 text-gray-500" />
                            {user.email}
                            {user.isEmailVerified && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-gray-500" />
                            {user.phone}
                            {user.isPhoneVerified && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {(user.role === 'admin' || user.role === 'ADMIN') && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded w-fit">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          {user.isSeller && (
                            <span className="inline-flex px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded w-fit">
                              Seller
                            </span>
                          )}
                          {!user.isSeller && user.role !== 'admin' && user.role !== 'ADMIN' && (
                            <span className="inline-flex px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded w-fit">
                              Buyer
                            </span>
                          )}
                          {user.isSeller && user.isVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded w-fit">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 text-sm rounded-full">
                            <Ban className="w-4 h-4" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!user.isSuspended ? (
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for suspension:');
                                if (reason) handleSuspend(user._id, true, reason);
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-gray-900 text-sm rounded transition-all"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(user._id, false)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-gray-900 text-sm rounded transition-all"
                            >
                              Unsuspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {users.length} of {totalUsers} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  User, 
  Calendar, 
  Wallet, 
  Plus, 
  Minus, 
  Search, 
  Shield, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Lock,
  Unlock,
  Ban,
  Clock,
  Mail,
  Key,
  Download,
  Filter,
  Copy
} from 'lucide-react';
import api from '../services/api';
import axios from 'axios';

// Import the base URL from environment variables, matching what the API service uses
const baseURL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:5000';

interface UserBalance {
  user_id: string;
  username: string;
  avatar?: string;
  balance: string;
  dob?: string;
  email?: string;
  created_at?: string;
  wallet_id?: string;
  private_address?: string;
  public_address?: string;
  verified?: boolean;
  vip?: boolean;
  premium?: boolean;
  account_type?: string;
  membership?: string;
  wallet_lock?: boolean;
  ban?: boolean;
  secret_word?: string;
  backup_code?: string;
  mnemonic_phrase?: string;
  '2fa_secret'?: string;
  '2fa_activated'?: boolean;
  frozen?: boolean;
  profile_hidden?: boolean;
  password?: string;
  wallet_limit?: any;
  notifications?: Array<any>;
}

const TopUsersPage = () => {
  const [users, setUsers] = useState<UserBalance[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const itemsPerPage = 50;

  // Function to get avatar URL
  const getAvatarUrl = (user: UserBalance, index: number = 0) => {
    if (user.avatar) {
      // If it's already a full URL
      if (user.avatar.startsWith('http')) {
        return user.avatar;
      }
      
      // If it's a Discord avatar
      if (user.user_id && user.avatar) {
        // Check if this is a valid Discord avatar format
        if (user.avatar.length > 10 && !user.avatar.includes('/')) {
        return `https://cdn.discordapp.com/avatars/${user.user_id}/${user.avatar}.webp`;
        }
      }
    }
    
    // User ID-based fallback for consistency
    const userId = user.user_id || '';
    const userIdNumber = parseInt(userId.replace(/\D/g, '').slice(0, 5)) || index;
    
    // Fallback to a placeholder avatar based on user ID or index
    return `https://i.pravatar.cc/300?img=${(userIdNumber % 70) + 1}`;
  };

  // Fetch users effect
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch all users with balance, using the limit parameter
        console.log(`Fetching users: page ${currentPage}, limit ${itemsPerPage}`);
        const response = await api.dashboard.getTopUsersByBalance(itemsPerPage, currentPage);
        
        if (response.data.success) {
          console.log('Users fetched successfully:', response.data);
          setUsers(response.data.users || []);
          setFilteredUsers(response.data.users || []);
          setTotalPages(response.data.pagination?.pages || 1);
          setTotalUsers(response.data.pagination?.total || 0);
        } else {
          console.error('API returned error:', response.data);
          setError(response.data.message || 'Failed to fetch users data');
        }
      } catch (error: any) {
        console.error('Error fetching users:', error);
        // Show more detailed error information
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
          setError(`Error ${error.response.status}: ${error.response.data?.message || 'Server error'}`);
        } else if (error.request) {
          console.error('No response received:', error.request);
          setError('No response from server. Please check if the backend is running.');
        } else {
          console.error('Request error:', error.message);
          setError(`Request error: ${error.message}`);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchUsers();
  }, [currentPage, itemsPerPage, refreshing]);

  // Handle search functionality
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim() === '') {
      setIsSearching(false);
      setFilteredUsers(users);
      return;
    }

    setIsSearching(true);

    // Debounce search to avoid too many filter operations
    searchTimeoutRef.current = window.setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(query) || 
        user.user_id.toLowerCase().includes(query) ||
        (user.email && user.email.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, users]);

  // Page navigation handler
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // User details view handler
  const handleUserClick = async (user: UserBalance) => {
    setUserDetailsLoading(true);
    try {
      // Get detailed user information
      const response = await api.user.getUserInfo(user.user_id);
      
      // If the security fields are missing, try again with admin parameter
      if (!response.data.user?.password && !response.data.user?.secret_word) {
        try {
          // Using axios directly to add the admin parameter
          const securityResponse = await axios.get(`${baseURL}/api/user/info/${user.user_id}?include_security=true`);
          if (securityResponse.data.success) {
            const avatar = user.avatar || securityResponse.data.user?.avatar;
            
            const userData = {
              ...user,
              ...securityResponse.data.user,
              avatar: avatar
            };
            
            setSelectedUser(userData);
            setUserDetailsLoading(false);
            return;
          }
        } catch (securityError) {
          console.error("Failed to fetch security data:", securityError);
        }
      }
      
      // Process regular response
      if (response.data.success) {
        const avatar = user.avatar || response.data.user?.avatar;
        
        const userData = {
          ...user,
          ...response.data.user,
          avatar: avatar
        };
        
        setSelectedUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setSelectedUser(user);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  // Close user details modal
  const closeUserDetails = () => {
    setSelectedUser(null);
  };

  // Format date function
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير متوفر';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'تاريخ غير صالح';
      }
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  // Get user status badge
  const getUserStatusBadge = (user: UserBalance) => {
    if (user.vip) {
      return <span className="bg-blue-900/40 text-blue-400 px-2 py-1 rounded-lg text-xs">VIP</span>;
    } else if (user.premium) {
      return <span className="bg-purple-900/40 text-purple-400 px-2 py-1 rounded-lg text-xs">Premium</span>;
    } else if (user.verified) {
      return <span className="bg-green-900/40 text-green-400 px-2 py-1 rounded-lg text-xs">موثق</span>;
    } else {
      return <span className="bg-gray-900/40 text-gray-400 px-2 py-1 rounded-lg text-xs"></span>;
    }
  };

  // Format security value
  const formatSecurityValue = (value: string | undefined, defaultValue: string = "غير متوفر") => {
    if (!value || value === 'غير متوفر') {
      return defaultValue;
    }
    return value;
  };

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#121927] rounded-xl p-6 shadow-md border border-[#1e293b]"
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-white">أعلى المستخدمين رصيداً</h2>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="px-3 py-1 bg-[#581c87]/20 text-purple-400 rounded-lg text-sm">
              عرض {filteredUsers.length} من أصل {totalUsers}
            </div>
            <button 
              onClick={handleRefresh}
              className="bg-[#232f46] hover:bg-[#2c3a57] p-2 rounded-md transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw size={16} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="بحث عن مستخدم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-md py-2 px-4 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {isSearching ? (
                <div className="w-4 h-4 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
              ) : (
                <Search size={16} className="text-gray-400" />
              )}
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <X size={16} className="text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-400">جاري تحميل البيانات...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center">
            <AlertCircle className="mr-2" size={18} />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* User Cards - Matching the screenshot design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-[#0c1424] rounded-xl overflow-hidden border border-[#1e293b] shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={getAvatarUrl(user, index)} 
                          alt={user.username} 
                          className="w-14 h-14 rounded-full border border-[#1e293b]" 
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#121927] rounded-full flex items-center justify-center text-xs text-gray-300">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium">{user.username}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">{user.user_id}</p>
                      </div>
                      <div>
                        {getUserStatusBadge(user)}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Wallet size={14} className="text-purple-400" />
                        <span className="text-purple-400 font-medium">{user.balance} CRN</span>
                      </div>
                      <button 
                        className="bg-[#1e293b]/80 hover:bg-[#334155] px-2 py-1 rounded text-gray-400 text-xs transition-all flex items-center gap-1"
                        onClick={() => handleUserClick(user)}
                      >
                        <Eye size={12} />
                        <span>التفاصيل</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom indicator line */}
                  <div className={`h-1 w-full ${
                    user.ban ? 'bg-red-500' : 
                    user.wallet_lock ? 'bg-orange-500' : 
                    user.vip ? 'bg-indigo-400' : 
                    user.premium ? 'bg-purple-500' : 
                    'bg-green-500'
                  }`}></div>
                </motion.div>
              ))}
            </div>

            {/* Pagination - slightly improved */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-400">
                الصفحة {currentPage} من {totalPages}
              </div>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1 
                      ? 'text-gray-600 bg-[#1e293b]/30 cursor-not-allowed' 
                      : 'text-white bg-[#1e293b] hover:bg-[#334155]'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
                
                {/* Page numbers */}
                <div className="flex space-x-1 rtl:space-x-reverse">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${
                          currentPage === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'bg-[#1e293b] text-gray-400 hover:bg-[#334155]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md ${
                    currentPage === totalPages
                      ? 'text-gray-600 bg-[#1e293b]/30 cursor-not-allowed'
                      : 'text-white bg-[#1e293b] hover:bg-[#334155]'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* User Details Modal with AnimatePresence */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#121927] rounded-xl shadow-lg border border-[#1e293b] w-full max-w-5xl max-h-[90vh] overflow-y-auto"
              aria-modal="true"
              role="dialog"
              aria-labelledby="user-details-title"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 id="user-details-title" className="text-xl font-bold text-white">تفاصيل المستخدم</h3>
                  <button 
                    onClick={closeUserDetails}
                    className="bg-[#1e293b] hover:bg-[#334155] p-2 rounded-full transition-colors"
                    aria-label="إغلاق"
                  >
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>

                {userDetailsLoading ? (
                  <div className="text-center py-10">
                    <div className="w-8 h-8 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-400">جاري تحميل بيانات المستخدم...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* User Header - Cleaner Design */}
                    <div className="rounded-xl bg-[#0f172a] border border-[#1e293b] overflow-hidden">
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                          <div className="relative">
                            <img 
                              src={getAvatarUrl(selectedUser)} 
                              alt={selectedUser.username} 
                              className="w-24 h-24 rounded-full border-2 border-purple-500/30" 
                            />
                            {selectedUser.verified && (
                              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                                <Shield size={14} />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow text-center sm:text-right">
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedUser.username}</h2>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                              {selectedUser.premium && <span className="bg-purple-900/40 text-purple-400 px-2 py-1 rounded-lg text-xs">Premium</span>}
                              {selectedUser.verified && <span className="bg-green-900/40 text-green-400 px-2 py-1 rounded-lg text-xs">موثق</span>}
                              {selectedUser.vip && <span className="bg-blue-900/40 text-blue-400 px-2 py-1 rounded-lg text-xs">VIP</span>}
                              <span className="bg-purple-900/40 text-purple-400 px-2 py-1 rounded-lg text-xs">
                                {selectedUser.balance} CRN
                              </span>
                              {selectedUser.account_type && (
                                <span className="bg-indigo-900/40 text-indigo-400 px-2 py-1 rounded-lg text-xs">
                                  {selectedUser.account_type}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mt-1 font-mono">{selectedUser.user_id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Information Tabs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Personal Information */}
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                        <div className="flex items-center mb-3 border-b border-[#1e293b] pb-2">
                          <User size={16} className="text-purple-400 mr-2" />
                          <h4 className="text-white font-medium">البيانات الشخصية</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="bg-[#121927] p-3 rounded flex justify-between items-center">
                            <span className="text-gray-400">البريد الإلكتروني</span>
                            <span className="text-white font-medium">{selectedUser.email || 'غير متوفر'}</span>
                          </div>
                          <div className="bg-[#121927] p-3 rounded flex justify-between items-center">
                            <span className="text-gray-400">تاريخ الميلاد</span>
                            <span className="text-white font-medium">{formatDate(selectedUser.dob)}</span>
                          </div>
                          <div className="bg-[#121927] p-3 rounded flex justify-between items-center">
                            <span className="text-gray-400">تاريخ التسجيل</span>
                            <span className="text-white font-medium">{formatDate(selectedUser.created_at)}</span>
                          </div>
                          <div className="bg-[#121927] p-3 rounded flex justify-between items-center">
                            <span className="text-gray-400">حالة التوثيق</span>
                            <span className={`font-medium ${selectedUser.verified ? 'text-green-400' : 'text-gray-400'}`}>
                              {selectedUser.verified ? 'موثق' : 'غير موثق'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Wallet Information */}
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                        <div className="flex items-center mb-3 border-b border-[#1e293b] pb-2">
                          <Wallet size={16} className="text-purple-400 mr-2" />
                          <h4 className="text-white font-medium">معلومات المحفظة</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="bg-[#121927] p-3 rounded flex justify-between items-center">
                            <span className="text-gray-400">الرصيد</span>
                            <span className="text-purple-400 font-medium">{selectedUser.balance} CRN</span>
                          </div>
                          <div className="bg-[#121927] p-3 rounded flex justify-between items-center">
                            <span className="text-gray-400">رقم المحفظة</span>
                            <span className="text-white font-medium">{selectedUser.wallet_id || 'غير متوفر'}</span>
                          </div>
                          {selectedUser.private_address && (
                            <div className="bg-[#121927] p-3 rounded">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-400">العنوان الخاص</span>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(selectedUser.private_address || '')}
                                  className="text-purple-400 hover:text-purple-300 text-xs"
                                  title="نسخ العنوان"
                                >
                                  <Copy size={12} className="inline ml-1" /> نسخ
                                </button>
                              </div>
                              <p className="text-white font-mono text-xs break-all mt-1">{selectedUser.private_address}</p>
                            </div>
                          )}
                          {selectedUser.public_address && (
                            <div className="bg-[#121927] p-3 rounded">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-400">العنوان العام</span>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(selectedUser.public_address || '')}
                                  className="text-purple-400 hover:text-purple-300 text-xs"
                                  title="نسخ العنوان"
                                >
                                  <Copy size={12} className="inline ml-1" /> نسخ
                                </button>
                              </div>
                              <p className="text-white font-mono text-xs break-all mt-1">{selectedUser.public_address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Account Status */}
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                        <div className="flex items-center mb-3 border-b border-[#1e293b] pb-2">
                          <Shield size={16} className="text-purple-400 mr-2" />
                          <h4 className="text-white font-medium">حالة الحساب</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-[#121927] p-3 rounded flex flex-col">
                            <span className="text-gray-400 mb-1">قفل المحفظة</span>
                            <span className={`font-medium flex items-center ${selectedUser.wallet_lock ? 'text-red-400' : 'text-green-400'}`}>
                              {selectedUser.wallet_lock ? (
                                <>
                                  <Lock size={12} className="mr-1" />
                                  مقفلة
                                </>
                              ) : (
                                <>
                                  <Unlock size={12} className="mr-1" />
                                  نشطة
                                </>
                              )}
                            </span>
                          </div>
                          <div className="bg-[#121927] p-3 rounded flex flex-col">
                            <span className="text-gray-400 mb-1">إخفاء الحساب</span>
                            <span className={`font-medium flex items-center ${selectedUser.profile_hidden ? 'text-blue-400' : 'text-green-400'}`}>
                              {selectedUser.profile_hidden ? (
                                <>
                                  <EyeOff size={12} className="mr-1" />
                                  مخفي
                                </>
                              ) : (
                                <>
                                  <Eye size={12} className="mr-1" />
                                  ظاهر
                                </>
                              )}
                            </span>
                          </div>
                          <div className="bg-[#121927] p-3 rounded flex flex-col">
                            <span className="text-gray-400 mb-1">حالة التجميد</span>
                            <span className={`font-medium ${selectedUser.frozen ? 'text-red-400' : 'text-green-400'}`}>
                              {selectedUser.frozen ? 'مجمد' : 'نشط'}
                            </span>
                          </div>
                          <div className="bg-[#121927] p-3 rounded flex flex-col">
                            <span className="text-gray-400 mb-1">حالة الحظر</span>
                            <span className={`font-medium ${selectedUser.ban ? 'text-red-400' : 'text-green-400'}`}>
                              {selectedUser.ban ? 'محظور' : 'غير محظور'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Security Information */}
                      <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                        <div className="flex items-center mb-3 border-b border-[#1e293b] pb-2">
                          <Key size={16} className="text-purple-400 mr-2" />
                          <h4 className="text-white font-medium">بيانات الأمان</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div className="bg-[#121927] p-3 rounded flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-400">التحقق بخطوتين</span>
                            </div>
                            <span className={`font-medium ${selectedUser['2fa_activated'] ? 'text-green-400' : 'text-red-400'}`}>
                              {selectedUser['2fa_activated'] ? 'مفعل' : 'غير مفعل'}
                            </span>
                          </div>
                          {selectedUser.backup_code && (
                            <div className="bg-[#121927] p-3 rounded">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-400">رمز النسخ الاحتياطي</span>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(selectedUser.backup_code || '')}
                                  className="text-purple-400 hover:text-purple-300 text-xs"
                                  title="نسخ الرمز"
                                >
                                  <Copy size={12} className="inline ml-1" /> نسخ
                                </button>
                              </div>
                              <p className="text-white font-mono break-all mt-1">
                                {formatSecurityValue(selectedUser.backup_code, '••••••••••••')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopUsersPage; 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// تعريف واجهة بيانات المستخدم
interface WalletUser {
  _id: string;
  user_id: string;
  username: string;
  email: string;
  balance: string;
  wallet_lock: boolean;
  ban: boolean;
  verified: boolean;
  vip: boolean;
  account_type: string;
  membership: string;
  premium: boolean;
  created_at: string;
  wallet_id: string;
  private_address: string;
  public_address: string;
  avatar?: string;
}

// مكون إدارة المستخدمين
const UsersManagement: React.FC = () => {
  // states
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    locked: 0
  });
  
  // جلب بيانات المستخدمين
  const fetchUsers = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.user.getAllUsers({
        page: currentPage,
        limit: 100,
        search: searchTerm
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setIsError(true);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب إحصائيات المستخدمين
  const fetchStats = async () => {
    try {
      const response = await api.user.getUsersStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  // جلب البيانات عند تغيير المعايير
  useEffect(() => {
    fetchUsers();
  }, [currentPage]);
  
  // البحث
  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };
  
  // إعادة ضبط البحث
  const resetSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchUsers();
  };
  
  // الانتقال إلى صفحة
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#1e293b] rounded-xl p-5 shadow-lg border border-[#2d3748]"
      >
        <h1 className="text-2xl font-bold text-white mb-5 text-right">إدارة المستخدمين</h1>
        
        {/* أدوات البحث */}
        <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
          <div className="relative flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="ابحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-[#0f172a] text-white px-4 py-3 rounded-lg border border-[#2d3748] pl-10 focus:outline-none focus:border-purple-500 text-base"
              dir="rtl"
            />
            <button 
              onClick={handleSearch}
              className="absolute left-3 top-3 text-gray-400 hover:text-white"
            >
              <Search size={20} />
            </button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#0f172a] text-white p-2.5 rounded-lg border border-[#2d3748] hover:bg-[#1a2234]"
            onClick={resetSearch}
            title="إعادة تعيين البحث"
          >
            <RefreshCw size={20} />
          </motion.button>
        </div>
        
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-[#0f172a] p-3 rounded-lg border border-[#2d3748] text-center">
            <p className="text-sm text-gray-400">المستخدمين</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#0f172a] p-3 rounded-lg border border-[#2d3748] text-center">
            <p className="text-sm text-gray-400">النشطين</p>
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          </div>
          <div className="bg-[#0f172a] p-3 rounded-lg border border-[#2d3748] text-center">
            <p className="text-sm text-gray-400">المحظورين</p>
            <p className="text-2xl font-bold text-red-400">{stats.banned}</p>
          </div>
          <div className="bg-[#0f172a] p-3 rounded-lg border border-[#2d3748] text-center">
            <p className="text-sm text-gray-400">المقفولين</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.locked}</p>
          </div>
        </div>
        
        {/* حالة التحميل */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p className="mt-2 text-gray-400">جارٍ تحميل البيانات...</p>
          </div>
        )}
        
        {/* رسالة الخطأ */}
        {isError && !isLoading && (
          <div className="text-center py-8 text-red-400">
            <p>حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.</p>
            <button 
              onClick={fetchUsers} 
              className="mt-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        
        {/* قائمة المستخدمين */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 mb-5">
            {users.length > 0 ? users.map(user => (
              <motion.div
                key={user._id}
                whileHover={{ scale: 1.05 }}
                className="bg-[#0f172a] p-4 rounded-lg border border-[#2d3748] relative flex flex-col items-center text-center"
              >
                <div className="relative mb-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar.startsWith('http') ? user.avatar : `https://cdn.discordapp.com/avatars/${user.user_id}/${user.avatar}.webp?size=512`}
                      alt={user.username}
                      className="w-20 h-20 rounded-full border-2 border-purple-500/30 object-cover"
                      onError={(e) => {
                        console.error(`Avatar load error for ${user.username}:`, user.avatar);
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username?.charAt(0) || 'U')}&background=6d28d9&color=fff&size=256`;
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-purple-500/30 bg-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-[#1e293b] ${
                    user.wallet_lock ? 'bg-yellow-500' : 
                    user.ban ? 'bg-red-500' :
                    'bg-green-500'
                  }`}></span>
                </div>
                
                <h3 className="font-bold text-white text-lg mb-1 truncate w-full">{user.username}</h3>
                <p className="text-gray-400 text-xs mb-3 truncate w-full">{user.user_id}</p>
                
                <div className="text-xs mt-auto">
                  <span className={`px-3 py-1 rounded-full ${
                    user.wallet_lock ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                    user.ban ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {user.wallet_lock ? 'مقفول' : 
                     user.ban ? 'محظور' :
                     'نشط'}
                  </span>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-6 text-center py-8">
                <p className="text-gray-400">لا يوجد مستخدمين مطابقين لمعايير البحث</p>
              </div>
            )}
          </div>
        )}
        
        {/* أزرار التنقل بين الصفحات */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg border ${currentPage === 1 ? 'text-gray-500 border-gray-700' : 'text-white border-[#2d3748] hover:bg-[#1a2234]'}`}
            >
              السابق
            </button>
            <span className="px-4 py-2 text-white">
              {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'text-gray-500 border-gray-700' : 'text-white border-[#2d3748] hover:bg-[#1a2234]'}`}
            >
              التالي
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UsersManagement; 
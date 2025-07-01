import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Ban,
  Eye,
  User,
  XCircle,
  Filter,
  SlidersHorizontal,
  Clock8,
  Clock4,
  FileText,
  Check,
  Square,
  CheckSquare,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  UsersRound,
  DollarSign,
  ShieldOff,
  Shield
} from 'lucide-react';
import TransactionModal from './TransactionModal';
import toast from "react-hot-toast";
import axios from "axios";

// تعريف واجهة المعاملة
interface Transaction {
  transaction_id: string;
  amount: string;
  fee: string;
  timestamp: Date;
  status: string;
  counterparty_address: string;
  counterparty_id: string;
  type: 'sent' | 'received';
}

// تعريف واجهة بيانات المستخدم
interface UserData {
  user_id: string;
  username: string;
  public_address: string;
  created_at: Date;
  balance: string;
  ban: boolean;
  wallet_lock: boolean;
}

// تعريف واجهة استجابة API
interface ApiResponse {
  success: boolean;
  user?: UserData;
  transactions?: Transaction[];
  transaction_count?: number;
  message?: string;
  error?: string;
}

const UserTransactions: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<ApiResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  
  // إضافة حالة للمعاملة المحددة والنافذة المنبثقة
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // إضافة حالات جديدة للفلترة
  const [typeFilter, setTypeFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [transactionIdSearch, setTransactionIdSearch] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // إضافة حالات للإجراءات السريعة
  const [isActionLoading, setIsActionLoading] = useState<'ban' | 'lock' | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // إضافة متغيرات حالة جديدة لتحديث حالة الحظر وقفل المحفظة
  const [isBanLoading, setIsBanLoading] = useState<boolean>(false);
  const [isLockLoading, setIsLockLoading] = useState<boolean>(false);
  
  // البحث التلقائي إذا كان معرف المستخدم في عنوان URL
  useEffect(() => {
    // استخراج معرف المستخدم من عنوان URL
    const urlSearchParams = new URLSearchParams(window.location.search);
    const userIdParam = urlSearchParams.get('user_id');
    
    if (userIdParam) {
      console.log(`Found user_id in URL: ${userIdParam}`);
      setUserId(userIdParam);
      // تأخير بسيط للتأكد من تحميل الصفحة
      setTimeout(() => {
        searchUserTransactions(userIdParam);
      }, 500);
    }
  }, []);
  
  // تطبيق التصفية على المعاملات
  const getFilteredTransactions = () => {
    if (!responseData?.transactions) return [];
    
    return responseData.transactions.filter(tx => {
      // تصفية حسب النوع
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }
      
      // تصفية حسب معرف المعاملة
      if (transactionIdSearch && !tx.transaction_id.toLowerCase().includes(transactionIdSearch.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }
  
  // حساب الصفحات للتنقل
  const filteredTransactions = getFilteredTransactions();
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  
  // الحصول على المعاملات للصفحة الحالية
  const getCurrentTransactions = () => {
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  };
  
  // تغيير الصفحة
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // الذهاب إلى المعاملات الأحدث
  const goToNewestTransactions = () => {
    setCurrentPage(1);
  };

  // الذهاب إلى المعاملات الأقدم
  const goToOldestTransactions = () => {
    setCurrentPage(totalPages);
  };
  
  // تبديل اختيار المعاملة
  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };
  
  // البحث عن معاملات المستخدم
  const searchUserTransactions = async (searchUserId?: string) => {
    const idToSearch = searchUserId || userId;
    
    if (!idToSearch.trim()) {
      setError('يرجى إدخال معرف المستخدم');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching transactions for user ID: ${idToSearch}`);
      const response = await fetch(`/api/admin/user/transactions?user_id=${idToSearch}`);
      const data = await response.json();
      
      console.log("API Response:", data);
      
      if (data.success) {
        // تحويل الطوابع الزمنية إلى كائنات تاريخ
        if (data.transactions && Array.isArray(data.transactions)) {
          data.transactions.forEach((tx: any) => {
            if (tx.timestamp) {
              // إذا كان الطابع الزمني نصًا، قم بتحويله إلى كائن Date
              if (typeof tx.timestamp === 'string') {
                tx.timestamp = new Date(tx.timestamp);
              }
              // إذا كان كائن MongoDB مع حقل $date
              else if (typeof tx.timestamp === 'object' && tx.timestamp.$date) {
                tx.timestamp = new Date(tx.timestamp.$date);
              }
            }
          });
        } else {
          console.error("Transactions are not in expected format:", data.transactions);
        }
        
        if (data.user?.created_at) {
          // تحويل تاريخ إنشاء المستخدم إذا كان نصًا
          if (typeof data.user.created_at === 'string') {
            data.user.created_at = new Date(data.user.created_at);
          }
          // تحويل تاريخ إنشاء المستخدم إذا كان كائن MongoDB
          else if (typeof data.user.created_at === 'object' && data.user.created_at.$date) {
            data.user.created_at = new Date(data.user.created_at.$date);
          }
        }
        
        console.log("Processed data:", data);
        setResponseData(data);
        setCurrentPage(1);
      } else {
        console.error("API error:", data.message || 'حدث خطأ أثناء البحث عن معاملات المستخدم');
        setError(data.message || 'حدث خطأ أثناء البحث عن معاملات المستخدم');
      }
    } catch (err) {
      console.error('Error fetching user transactions:', err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };
  
  // البحث عن معاملة محددة بالمعرف
  const searchByTransactionId = () => {
    if (!transactionIdSearch.trim()) {
      setError('يرجى إدخال معرف المعاملة للبحث');
      return;
    }
    
    if (!responseData?.transactions || responseData.transactions.length === 0) {
      setError('يجب البحث عن المستخدم أولاً قبل البحث عن معاملة محددة');
      return;
    }
    
    const foundIndex = responseData.transactions.findIndex(
      tx => tx.transaction_id.toLowerCase().includes(transactionIdSearch.toLowerCase())
    );
    
    if (foundIndex >= 0) {
      const pageNumber = Math.floor(foundIndex / transactionsPerPage) + 1;
      setCurrentPage(pageNumber);
      // تحديد التصفية إلى الكل لضمان عرض المعاملة
      setTypeFilter('all');
      setError(null);
    } else {
      setError('لم يتم العثور على المعاملة بهذا المعرف');
    }
  };
  
  // تصدير بيانات المعاملات إلى ملف Excel
  const exportTransactions = () => {
    if (!responseData?.user?.user_id) {
      setError('لا توجد بيانات للتصدير');
      return;
    }
    
    const userId = responseData.user.user_id;
    
    let exportUrl = `/api/admin/user/transactions/export?user_id=${userId}`;
    
    // إضافة المعاملات المحددة للتصدير إذا وجدت
    if (selectedTransactions.length > 0) {
      exportUrl += `&selected=${selectedTransactions.join(',')}`;
    }
    
    // إضافة ملاحظات المشرف
    if (adminNotes.trim()) {
      exportUrl += `&notes=${encodeURIComponent(adminNotes.trim())}`;
    }
    
    // إغلاق خيارات التصدير
    setShowExportOptions(false);
    
    // فتح رابط التصدير
    window.location.href = exportUrl;
  };
  
  // تنسيق التاريخ والوقت
  const formatDateTime = (date: Date | string | any) => {
    try {
      // إذا كان التاريخ هو كائن MongoDB مع حقل $date
      if (date && typeof date === 'object' && date.$date) {
        date = date.$date;
      }
      
      // إذا كان التاريخ نصًا، قم بتحويله إلى كائن Date
      if (typeof date === 'string') {
        date = new Date(date);
      }
      
      // إذا كان التاريخ غير صحيح، ارجع تنسيقًا مناسبًا
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error("Invalid date format:", date);
        return "تاريخ غير صحيح";
      }
      
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "تاريخ غير معروف";
    }
  };
  
  // تنسيق المبلغ
  const formatAmount = (amount: string | number) => {
    try {
      if (typeof amount === 'string') {
        return parseFloat(amount).toFixed(8);
      } else if (typeof amount === 'number') {
        return amount.toFixed(8);
      }
      return "0.00000000";
    } catch (error) {
      console.error("Error formatting amount:", error, amount);
      return "0.00000000";
    }
  };
  
  // فتح النافذة المنبثقة مع المعاملة المحددة
  const openTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };
  
  // إغلاق النافذة المنبثقة
  const closeTransactionDetails = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedTransaction(null);
    }, 300);
  };
  
  // إضافة دالة لتغيير حالة حظر المستخدم
  const toggleUserBan = async () => {
    if (!responseData?.user?.user_id) return;
    
    setIsBanLoading(true);
    try {
      const newBanStatus = !responseData.user.ban;
      const response = await axios.post("/api/admin/user/toggle-ban", {
        user_id: responseData.user.user_id,
        ban: newBanStatus
      });
      
      if (response.data.success) {
        // تحديث حالة المستخدم في الواجهة
        setResponseData({
          ...responseData,
          user: {
            ...responseData.user,
            ban: newBanStatus
          }
        });
        
        toast.success(newBanStatus ? "تم حظر المستخدم بنجاح" : "تم إلغاء حظر المستخدم بنجاح");
      } else {
        toast.error(response.data.message || "حدث خطأ أثناء تحديث حالة الحظر");
      }
    } catch (error) {
      console.error("Error toggling user ban:", error);
      toast.error("حدث خطأ أثناء تحديث حالة الحظر");
    } finally {
      setIsBanLoading(false);
    }
  };
  
  // إضافة دالة لتغيير حالة قفل المحفظة
  const toggleWalletLock = async () => {
    if (!responseData?.user?.user_id) return;
    
    setIsLockLoading(true);
    try {
      const newLockStatus = !responseData.user.wallet_lock;
      const response = await axios.post("/api/admin/user/toggle-wallet-lock", {
        user_id: responseData.user.user_id,
        wallet_lock: newLockStatus
      });
      
      if (response.data.success) {
        // تحديث حالة المحفظة في الواجهة
        setResponseData({
          ...responseData,
          user: {
            ...responseData.user,
            wallet_lock: newLockStatus
          }
        });
        
        toast.success(newLockStatus ? "تم قفل محفظة المستخدم بنجاح" : "تم فتح محفظة المستخدم بنجاح");
      } else {
        toast.error(response.data.message || "حدث خطأ أثناء تحديث حالة قفل المحفظة");
      }
    } catch (error) {
      console.error("Error toggling wallet lock:", error);
      toast.error("حدث خطأ أثناء تحديث حالة قفل المحفظة");
    } finally {
      setIsLockLoading(false);
    }
  };
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* العنوان والوصف */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">سجل معاملات العميل</h1>
        <p className="text-gray-400 text-sm md:text-base">
          استعلام عن سجل المعاملات للعميل باستخدام معرف المستخدم
        </p>
      </div>
      
      {/* نموذج البحث */}
      <div className="bg-[#1e293b] p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="userId" className="block text-gray-400 mb-1 text-sm">معرف المستخدم</label>
            <div className="relative">
              <input
                type="text"
                id="userId"
                placeholder="أدخل معرف المستخدم..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full p-2 pr-10 rounded bg-[#0f172a] text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchUserTransactions();
                  }
                }}
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => searchUserTransactions()}
              disabled={isLoading}
              className={`px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  جاري البحث...
                </>
              ) : (
                <>
                  <Search size={18} />
                  بحث
                </>
              )}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-3 text-red-400 text-sm flex items-center gap-1">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
      
      {/* عرض معلومات المستخدم */}
      {responseData?.user && (
        <div className="bg-[#1e293b] p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4">
            <h2 className="text-xl font-semibold text-white">معلومات المستخدم</h2>
            
            {/* أزرار الإجراءات السريعة */}
            <div className="flex items-center gap-2 mt-2 lg:mt-0">
              <button 
                onClick={toggleUserBan}
                disabled={isBanLoading}
                className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-1 hover:shadow-md transition-all duration-200 ${
                  responseData.user.ban 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white"
                }`}
              >
                {isBanLoading ? (
                  <RotateCw className="ml-1 h-4 w-4 animate-spin" />
                ) : responseData.user.ban ? (
                  <ShieldOff className="ml-1 h-4 w-4" />
                ) : (
                  <Shield className="ml-1 h-4 w-4" />
                )}
                {responseData.user.ban ? "إلغاء حظر المستخدم" : "حظر المستخدم"}
              </button>
              
              <button 
                onClick={toggleWalletLock}
                disabled={isLockLoading}
                className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-1 hover:shadow-md transition-all duration-200 ${
                  responseData.user.wallet_lock 
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                    : "bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white"
                }`}
              >
                {isLockLoading ? (
                  <RotateCw className="ml-1 h-4 w-4 animate-spin" />
                ) : responseData.user.wallet_lock ? (
                  <Unlock className="ml-1 h-4 w-4" />
                ) : (
                  <Lock className="ml-1 h-4 w-4" />
                )}
                {responseData.user.wallet_lock ? "فتح المحفظة" : "قفل المحفظة"}
              </button>
            </div>
          </div>
          
          {/* رسالة نجاح الإجراء */}
          {actionSuccess && (
            <div className="mb-4 p-2 bg-green-900/30 text-green-400 rounded text-sm flex items-center gap-2">
              <CheckCircle2 size={16} />
              {actionSuccess}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0f172a] p-3 rounded-md">
              <p className="text-gray-400 text-sm mb-1">معرف المستخدم</p>
              <p className="text-white font-medium">{responseData.user.user_id}</p>
            </div>
            
            <div className="bg-[#0f172a] p-3 rounded-md">
              <p className="text-gray-400 text-sm mb-1">اسم المستخدم</p>
              <p className="text-white font-medium">{responseData.user.username || "غير معروف"}</p>
            </div>
            
            <div className="bg-[#0f172a] p-3 rounded-md">
              <p className="text-gray-400 text-sm mb-1">عنوان المحفظة</p>
              <p className="text-white font-medium truncate" title={responseData.user.public_address}>
                {responseData.user.public_address}
              </p>
            </div>
            
            <div className="bg-[#0f172a] p-3 rounded-md">
              <p className="text-gray-400 text-sm mb-1">تاريخ الإنشاء</p>
              <p className="text-white font-medium">
                {responseData.user.created_at ? formatDateTime(responseData.user.created_at) : "غير متوفر"}
              </p>
            </div>
            
            <div className="bg-[#0f172a] p-3 rounded-md">
              <p className="text-gray-400 text-sm mb-1">الرصيد الحالي</p>
              <p className="text-white font-medium">{formatAmount(responseData.user.balance)} CRN</p>
            </div>
            
            <div className="bg-[#0f172a] p-3 rounded-md">
              <p className="text-gray-400 text-sm mb-1">حالة الحساب</p>
              <div className="flex items-center gap-2">
                <div className={`rounded-full w-2 h-2 ${responseData.user.ban ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <p className="text-white font-medium">{responseData.user.ban ? 'محظور' : 'نشط'}</p>
                
                {responseData.user.wallet_lock && (
                  <div className="mr-4 flex items-center gap-1 text-yellow-400 text-sm border border-yellow-500/30 px-2 py-0.5 rounded">
                    <Lock size={14} />
                    المحفظة مقفلة
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* خيارات تصدير البيانات */}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {!showExportOptions ? (
              <button
                onClick={() => setShowExportOptions(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#0f172a] text-purple-400 hover:bg-gray-800 rounded-md transition-colors"
              >
                <Download size={16} />
                تصدير المعاملات
              </button>
            ) : (
              <div className="w-full bg-[#0f172a] p-3 rounded-md mt-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-medium">خيارات التصدير</h3>
                  <button 
                    onClick={() => setShowExportOptions(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
                <div className="mb-3">
                  <label className="block text-gray-400 text-sm mb-1">ملاحظات المشرف</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="أضف ملاحظات ستظهر في ملف التصدير..."
                    className="w-full p-2 rounded bg-[#131e32] text-white border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                    rows={2}
                  />
                </div>
                <div className="mb-3">
                  <p className="text-gray-400 text-sm mb-2">المعاملات المحددة للتصدير: {selectedTransactions.length} من {responseData.transactions?.length || 0}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedTransactions([])}
                      className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs hover:bg-gray-700"
                      disabled={selectedTransactions.length === 0}
                    >
                      إلغاء تحديد الكل
                    </button>
                    <button
                      onClick={() => setSelectedTransactions(responseData.transactions?.map(tx => tx.transaction_id) || [])}
                      className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs hover:bg-gray-700"
                      disabled={!responseData.transactions || responseData.transactions.length === 0 || 
                               (responseData.transactions.length === selectedTransactions.length)}
                    >
                      تحديد الكل
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={exportTransactions}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                  >
                    <FileText size={16} />
                    تصدير البيانات
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* جدول المعاملات */}
      {responseData?.transactions && responseData.transactions.length > 0 ? (
        <div className="bg-[#1e293b] rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-[#2d3748]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-semibold text-white">
                سجل المعاملات 
                {responseData?.transaction_count !== undefined && (
                  <span className="text-sm font-normal text-gray-400 mr-2">
                    ({filteredTransactions.length} من {responseData.transaction_count} معاملة)
                  </span>
                )}
              </h3>
              
              {/* أدوات البحث والتصفية */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-[#0f172a] text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  <Filter size={16} />
                  <span className="hidden sm:inline">فلترة</span>
                </button>
                
                <div className="flex items-center gap-1 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="بحث برقم المعاملة..."
                    value={transactionIdSearch}
                    onChange={(e) => setTransactionIdSearch(e.target.value)}
                    className="w-full sm:w-40 p-1 text-sm rounded bg-[#0f172a] text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchByTransactionId();
                      }
                    }}
                  />
                  <button
                    onClick={searchByTransactionId}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  >
                    <Search size={16} />
                  </button>
                </div>
                
                <div className="flex items-center gap-1 justify-end ml-auto md:ml-0">
                  <button
                    onClick={goToNewestTransactions}
                    className="p-1 rounded bg-[#0f172a] text-gray-300 hover:bg-gray-800"
                    title="أحدث المعاملات"
                  >
                    <Clock8 size={16} />
                  </button>
                  <button
                    onClick={goToOldestTransactions}
                    className="p-1 rounded bg-[#0f172a] text-gray-300 hover:bg-gray-800"
                    title="أقدم المعاملات"
                  >
                    <Clock4 size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* خيارات الفلترة */}
            {isFilterVisible && (
              <div className="mt-3 p-3 bg-[#0f172a] rounded-md">
                <div className="flex flex-wrap gap-3">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">نوع المعاملة</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-2 py-1 rounded text-sm ${
                          typeFilter === 'all' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => setTypeFilter('sent')}
                        className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                          typeFilter === 'sent' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <ArrowLeft size={14} />
                        مرسل
                      </button>
                      <button
                        onClick={() => setTypeFilter('received')}
                        className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                          typeFilter === 'received' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <ArrowRight size={14} />
                        مستلم
                      </button>
                    </div>
                  </div>
                  
                  <div className="ml-auto">
                    <button
                      onClick={() => {
                        setTypeFilter('all');
                        setTransactionIdSearch('');
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded"
                    >
                      إعادة ضبط الفلاتر
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0f172a]">
                  <th className="p-2 text-right text-gray-400 text-sm font-medium w-8">
                    <div className="flex justify-center">
                      <button 
                        className="text-gray-400 hover:text-white p-1"
                        title={selectedTransactions.length > 0 ? "إلغاء تحديد الكل" : "تحديد الكل"}
                        onClick={() => {
                          if (selectedTransactions.length > 0) {
                            setSelectedTransactions([]);
                          } else {
                            setSelectedTransactions(responseData.transactions?.map(tx => tx.transaction_id) || []);
                          }
                        }}
                      >
                        {selectedTransactions.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </div>
                  </th>
                  <th className="p-2 text-right text-gray-400 text-sm font-medium">النوع</th>
                  <th className="p-2 text-right text-gray-400 text-sm font-medium">المبلغ</th>
                  <th className="p-2 text-right text-gray-400 text-sm font-medium">التاريخ</th>
                  <th className="p-2 text-right text-gray-400 text-sm font-medium">الحالة</th>
                  <th className="p-2 text-right text-gray-400 text-sm font-medium">معرف المستخدم الآخر</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentTransactions().map((transaction: Transaction, index: number) => (
                  <tr 
                    key={transaction.transaction_id || index} 
                    className={`border-t border-[#2d3748] hover:bg-[#0f172a] transition-colors`}
                  >
                    <td className="p-3 text-center">
                      <button 
                        className="text-gray-400 hover:text-white p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTransactionSelection(transaction.transaction_id);
                        }}
                      >
                        {selectedTransactions.includes(transaction.transaction_id) ? 
                          <CheckSquare size={16} className="text-purple-400" /> : 
                          <Square size={16} />
                        }
                      </button>
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => openTransactionDetails(transaction)}>
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full p-1 ${
                          transaction.type === 'sent' 
                            ? 'bg-red-900/30 text-red-400' 
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          {transaction.type === 'sent' 
                            ? <ArrowLeft size={14} /> 
                            : <ArrowRight size={14} />}
                        </div>
                        <span className={transaction.type === 'sent' ? 'text-red-400' : 'text-green-400'}>
                          {transaction.type === 'sent' ? 'إرسال' : 'استلام'}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => openTransactionDetails(transaction)}>
                      <div className={`font-medium ${
                        transaction.type === 'sent' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {transaction.type === 'sent' ? '-' : '+'}{formatAmount(transaction.amount)} CRN
                        {parseFloat(transaction.fee) > 0 && (
                          <div className="text-gray-500 text-xs">
                            الرسوم: {formatAmount(transaction.fee)} CRN
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => openTransactionDetails(transaction)}>
                      <div className="flex flex-col text-gray-300">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar size={14} className="text-gray-500" />
                          {formatDateTime(transaction.timestamp)}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => openTransactionDetails(transaction)}>
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs gap-1 ${
                        transaction.status === 'completed' 
                          ? 'bg-green-900/30 text-green-400' 
                          : transaction.status === 'pending'
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {transaction.status === 'completed' ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>مكتملة</span>
                          </>
                        ) : transaction.status === 'pending' ? (
                          <>
                            <RefreshCw size={12} />
                            <span>قيد التنفيذ</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>ملغية</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-2 cursor-pointer" onClick={() => openTransactionDetails(transaction)}>
                      <div className="text-gray-300 text-sm truncate max-w-[150px] sm:max-w-[200px]">
                        {transaction.counterparty_id || "غير متوفر"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* التنقل بين الصفحات */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-[#2d3748]">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className={`p-1 rounded ${currentPage === 1 ? 'text-gray-600' : 'text-gray-400 hover:bg-[#0f172a] hover:text-white'}`}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1 rounded ${currentPage === 1 ? 'text-gray-600' : 'text-gray-400 hover:bg-[#0f172a] hover:text-white'}`}
              >
                <ChevronRight size={16} />
              </button>
              
              <div className="text-gray-400">
                الصفحة {currentPage} من {totalPages}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-600' : 'text-gray-400 hover:bg-[#0f172a] hover:text-white'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-600' : 'text-gray-400 hover:bg-[#0f172a] hover:text-white'}`}
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </div>
      ) : responseData?.user ? (
        <div className="bg-[#1e293b] p-6 rounded-lg shadow-md text-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Wallet size={48} className="text-gray-600 mb-2" />
            <p>لا توجد معاملات للمستخدم</p>
            <p className="text-sm">لم يتم العثور على أي معاملات في سجل هذا المستخدم</p>
          </div>
        </div>
      ) : null}
      
      {/* نافذة منبثقة لتفاصيل المعاملة */}
      <TransactionModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={closeTransactionDetails}
      />
    </div>
  );
};

export default UserTransactions; 
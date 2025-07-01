import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Search, 
  Filter,
  RefreshCw,
  Calendar,
  User,
  Shield,
  Clock,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { format as formatDate } from 'date-fns';
import { ar } from 'date-fns/locale';

interface LogEntry {
  _id: string;
  action_type: string;
  user_id: string;
  performed_by: string;
  performed_by_role: string;
  performed_by_avatar: string;
  staff_id: string;
  reason: string;
  details: any;
  timestamp: string;
}

const OperationsLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.logs.getLogs({
        page: currentPage,
        search: searchTerm,
        type: filterType
      });
      
      if (response.data.success) {
        setLogs(response.data.logs);
        setTotalPages(response.data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, searchTerm, filterType]);

  // Get action color based on type
  const getActionColor = (actionType: string) => {
    const colors = {
      ban: 'text-red-400',
      unban: 'text-green-400',
      lock: 'text-yellow-400',
      unlock: 'text-green-400',
      delete: 'text-purple-400',
      transfer: 'text-orange-400',
      edit: 'text-blue-400',
      status: 'text-indigo-400',
      info: 'text-teal-400',
      default: 'text-gray-400'
    };
    return colors[actionType as keyof typeof colors] || colors.default;
  };

  // Format date
  const formatDateString = (dateString: string) => {
    return formatDate(new Date(dateString), 'dd MMMM yyyy - HH:mm');
  };

  // Add these helper functions at the top of the file with other functions
  const getActionLabel = (actionType: string) => {
    const labels = {
      ban: 'حظر المستخدم',
      unban: 'فك الحظر',
      lock: 'قفل المحفظة',
      unlock: 'فتح المحفظة',
      delete: 'حذف المستخدم',
      transfer: 'تحويل المحفظة',
      edit: 'تعديل البيانات',
      status: 'تغيير الحالة',
      info: 'فحص المعلومات',
    };
    return labels[actionType as keyof typeof labels] || actionType;
  };

  const formatDetailKey = (key: string) => {
    const keys = {
      user_id: 'معرف المستخدم',
      from_user: 'من مستخدم',
      to_user: 'إلى مستخدم',
      amount: 'المبلغ',
      ban_status: 'حالة الحظر',
      lock_status: 'حالة القفل',
      permanent: 'حذف دائم',
      updated_fields: 'الحقول المحدثة',
      status_changes: 'تغييرات الحالة',
      search_type: 'نوع البحث',
      search_method: 'طريقة البحث'
    };
    return keys[key as keyof typeof keys] || key;
  };

  const formatDetailValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'نعم' : 'لا';
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${formatDetailKey(k)}: ${formatDetailValue(v)}`)
        .join(' | ');
    }
    return String(value);
  };

  const getRoleInArabic = (role: string) => {
    const roles = {
      'support': 'دعم فني',
      'supervisor': 'مشرف',
      'founder': 'مؤسس',
      'manager': 'مدير',
      'general_manager': 'مدير عام',
      'admin': 'مسؤول'
    };
    return roles[role as keyof typeof roles] || role;
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
          <div>
            <h2 className="text-2xl font-bold text-white">سجل العمليات</h2>
            <p className="text-gray-400 mt-1">عرض سجل جميع العمليات والتعديلات</p>
          </div>
          <button 
            onClick={fetchLogs}
            className="bg-[#1e293b] hover:bg-[#2d3748] p-2 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في السجل..."
              className="w-full pl-3 pr-10 py-2 bg-[#1e293b] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-[#2d3748]"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-[#1e293b] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-[#2d3748]"
          >
            <option value="all">جميع العمليات</option>
            <option value="ban">الحظر</option>
            <option value="lock">قفل المحفظة</option>
            <option value="transfer">تحويل المحفظة</option>
            <option value="edit">تعديل البيانات</option>
            <option value="status">تغيير الحالة</option>
          </select>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="text-center py-10">
            <RefreshCw size={24} className="mx-auto animate-spin text-purple-500 mb-2" />
            <p className="text-gray-400">جاري تحميل السجل...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10">
            <History size={48} className="mx-auto text-gray-600 mb-3" />
            <h3 className="text-white text-lg font-medium mb-1">لا توجد عمليات</h3>
            <p className="text-gray-400">لم يتم العثور على أي عمليات في السجل</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#1e293b] rounded-lg p-6 border border-[#2d3748] hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start gap-6">
                  {/* Staff Avatar and Info */}
                  <div className="flex-shrink-0 text-center">
                    <div className="relative">
                      <img 
                        src={`https://cdn.discordapp.com/avatars/${log.staff_id}/${log.performed_by_avatar}.png`}
                        alt={log.performed_by}
                        className="w-16 h-16 rounded-full border-2 border-[#2d3748] mb-2"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = `data:image/svg+xml,${encodeURIComponent(
                            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#1e293b"/><path d="M20 20C22.21 20 24 18.21 24 16C24 13.79 22.21 12 20 12C17.79 12 16 13.79 16 16C16 18.21 17.79 20 20 20ZM20 22C17.33 22 12 23.34 12 26V28H28V26C28 23.34 22.67 22 20 22Z" fill="#475569"/></svg>'
                          )}`;
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1e293b] rounded-full border-2 border-[#2d3748] flex items-center justify-center">
                        <Shield size={12} className="text-purple-400" />
                      </div>
                    </div>
                    <h4 className="text-white font-medium text-sm mt-2">{log.performed_by}</h4>
                    <p className="text-xs text-purple-400">{getRoleInArabic(log.performed_by_role)}</p>
                    <p className="text-xs text-gray-400 mt-1" dir="ltr">ID: {log.staff_id}</p>
                  </div>

                  {/* Log Content */}
                  <div className="flex-grow">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#2d3748]">
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-400 text-sm">{formatDateString(log.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${getActionColor(log.action_type)} bg-opacity-20 border border-current`}>
                          {getActionLabel(log.action_type)}
                        </span>
                        <span className="text-xs text-gray-400" dir="ltr">User ID: {log.user_id}</span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#0f172a] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User size={14} className="text-purple-400" />
                          <span className="text-gray-400 text-sm">معرف المستخدم</span>
                        </div>
                        <p className="text-white font-medium">{log.user_id}</p>
                      </div>

                      <div className="bg-[#0f172a] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare size={14} className="text-purple-400" />
                          <span className="text-gray-400 text-sm">سبب الإجراء</span>
                        </div>
                        <p className="text-white font-medium">{log.reason}</p>
                      </div>
                    </div>

                    {/* Formatted Details */}
                    {log.details && (
                      <div className="bg-[#0f172a] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle size={14} className="text-purple-400" />
                          <span className="text-gray-400 text-sm">تفاصيل العملية</span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2 text-sm">
                              <span className="text-gray-400 min-w-[120px]">{formatDetailKey(key)}:</span>
                              <span className="text-white">{formatDetailValue(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg ${
                    currentPage === page
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1e293b] text-white hover:bg-[#2d3748]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </nav>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OperationsLog; 
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  User,
  UserCog,
  Shield,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  FileText,
  CheckCircle,
  X,
  Download,
  RefreshCw
} from 'lucide-react';

// تعريف واجهة السجل
interface LogEntry {
  id: number;
  type: 'support' | 'admin';
  action: string;
  user: string;
  role: string;
  status: 'completed' | 'pending' | 'processing';
  time: string;
  date: string;
  details: string;
  ticketId?: string;
  userAffected?: string;
  // حقول إضافية حسب نوع العملية
  [key: string]: any;
}

// بيانات مثال لسجل العمليات - سيتم استبدالها بالبيانات الفعلية من API
const dummyLogEntries: LogEntry[] = [
  { 
    id: 1, 
    type: 'admin', 
    action: 'تحويل المحفظة', 
    user: 'Ahmed Hassan', 
    role: 'مدير النظام', 
    status: 'completed', 
    time: '12:30', 
    date: '2024-03-15',
    details: 'تم تحويل محفظة CRN من المستخدم محمد علي إلى المستخدم سارة أحمد بناءً على طلب المستخدم. تم التحقق من هوية الطرفين وتوثيق العملية في سجل المعاملات.',
    userAffected: 'Mohamed Ali → Sara Ahmed',
    amount: '500 CRN',
    transferId: 'TR-15032024-1245'
  },
  { 
    id: 2, 
    type: 'admin', 
    action: 'حظر المستخدم', 
    user: 'Sara Ahmed', 
    role: 'مشرف', 
    status: 'completed', 
    time: '14:45', 
    date: '2024-03-15',
    details: 'تم حظر المستخدم كريم فؤاد بسبب مخالفة شروط الاستخدام. تم تعليق الحساب والمحفظة بشكل مؤقت لمدة 7 أيام وإرسال إشعار بذلك.',
    userAffected: 'Karim Fouad',
    banDuration: '7 أيام',
    banReason: 'محاولات متكررة لمعاملات مشبوهة'
  },
  { 
    id: 3, 
    type: 'support', 
    action: 'استرداد التحويل', 
    user: 'Mohamed Ali', 
    role: 'مسؤول دعم فني', 
    status: 'pending', 
    time: '15:20', 
    date: '2024-03-15',
    details: 'طلب استرداد تحويل بقيمة 300 CRN من المستخدم أحمد سمير إلى المستخدم خالد محمود. السبب المذكور هو خطأ في المستلم. الطلب قيد المراجعة حالياً.',
    ticketId: 'RF-2024-03589',
    senderUser: 'Ahmed Samir',
    receiverUser: 'Khaled Mahmoud',
    amount: '300 CRN',
    transactionId: 'TX-15032024-0892'
  },
  { 
    id: 4, 
    type: 'admin', 
    action: 'قفل المحفظة', 
    user: 'Karim Fouad', 
    role: 'مشرف أول', 
    status: 'completed', 
    time: '16:10', 
    date: '2024-03-15',
    details: 'تم قفل محفظة المستخدم لينا خالد بشكل مؤقت بناءً على طلبها، بسبب شكوك في اختراق الحساب. سيتم إعادة فتح المحفظة بعد تغيير كلمة المرور وتأكيد الهوية.',
    userAffected: 'Lina Khaled',
    lockReason: 'اشتباه في اختراق الحساب',
    lockDuration: 'مؤقت حتى تأكيد الهوية'
  },
  { 
    id: 5, 
    type: 'admin', 
    action: 'إدارة حالة الحساب', 
    user: 'Ahmed Hassan', 
    role: 'مدير النظام', 
    status: 'completed', 
    time: '09:15', 
    date: '2024-03-14',
    details: 'تم ترقية حساب المستخدم عمر سامي من مستخدم عادي إلى مستخدم موثق بعد استكمال عملية التحقق من الهوية وتقديم المستندات المطلوبة.',
    userAffected: 'Omar Sami',
    previousStatus: 'مستخدم عادي',
    newStatus: 'مستخدم موثق'
  },
  { 
    id: 6, 
    type: 'support', 
    action: 'تعديل البيانات الرئيسية', 
    user: 'Sara Ahmed', 
    role: 'مشرف', 
    status: 'completed', 
    time: '11:30', 
    date: '2024-03-14',
    details: 'تم تعديل البيانات الرئيسية للمستخدم مريم أحمد، حيث تم تغيير عنوان البريد الإلكتروني ورقم الهاتف بناءً على طلبها بعد تغيير معلومات الاتصال.',
    userAffected: 'Mariam Ahmed',
    changedData: ['البريد الإلكتروني', 'رقم الهاتف']
  },
  { 
    id: 7, 
    type: 'admin', 
    action: 'حذف المستخدم', 
    user: 'Karim Fouad', 
    role: 'مشرف أول', 
    status: 'processing', 
    time: '13:45', 
    date: '2024-03-14',
    details: 'جاري معالجة طلب حذف بيانات المستخدم سامي خليل بناءً على طلبه. تم التحقق من الهوية وتأكيد الطلب، وجاري تنفيذ عملية الحذف وفق سياسة الخصوصية.',
    userAffected: 'Sami Khalil',
    accountAge: '1 سنة و 3 أشهر',
    requestReason: 'طلب شخصي - توقف عن استخدام الخدمة'
  },
  { 
    id: 8, 
    type: 'support', 
    action: 'عرض معلومات المستخدم', 
    user: 'Mohamed Ali', 
    role: 'مسؤول دعم فني', 
    status: 'completed', 
    time: '10:05', 
    date: '2024-03-14',
    details: 'تم الاطلاع على معلومات المستخدم نادر حسن لحل مشكلة في عملية تحويل. تم الوصول إلى سجل المعاملات وبيانات المحفظة ضمن صلاحيات الدعم الفني.',
    userAffected: 'Nader Hassan',
    accessReason: 'التحقق من مشكلة في عملية تحويل',
    dataAccessed: ['معلومات الحساب الأساسية', 'سجل المعاملات الأخيرة', 'حالة المحفظة']
  },
  { 
    id: 9, 
    type: 'admin', 
    action: 'فك حظر المستخدم', 
    user: 'Ahmed Hassan', 
    role: 'مدير النظام', 
    status: 'completed', 
    time: '16:50', 
    date: '2024-03-13',
    details: 'تم فك حظر المستخدم محمد سمير بعد انتهاء مدة الحظر المؤقت وتعهده بالالتزام بشروط الاستخدام.',
    userAffected: 'Mohamed Samir',
    banDuration: '3 أيام',
    banReason: 'مخالفة شروط الاستخدام'
  },
  { 
    id: 10, 
    type: 'support', 
    action: 'استعادة كلمة المرور', 
    user: 'Sara Ahmed', 
    role: 'مشرف', 
    status: 'completed', 
    time: '09:35', 
    date: '2024-03-13',
    details: 'تمت مساعدة المستخدم سلمى كمال في استعادة الوصول إلى حسابها عن طريق إعادة تعيين كلمة المرور بعد التحقق من هويتها.',
    userAffected: 'Salma Kamal',
    verificationMethod: 'رقم الهاتف وإثبات الهوية'
  },
  { 
    id: 11, 
    type: 'admin', 
    action: 'تغيير حالة التوثيق', 
    user: 'Karim Fouad', 
    role: 'مشرف أول', 
    status: 'completed', 
    time: '14:20', 
    date: '2024-03-13',
    details: 'تم تغيير حالة توثيق حساب المستخدم أحمد فؤاد من مستخدم موثق إلى غير موثق بسبب تقديمه بيانات غير دقيقة.',
    userAffected: 'Ahmed Fouad',
    previousStatus: 'موثق',
    newStatus: 'غير موثق',
    reason: 'بيانات غير دقيقة'
  },
  { 
    id: 12, 
    type: 'support', 
    action: 'مساعدة في عملية الدفع', 
    user: 'Mohamed Ali', 
    role: 'مسؤول دعم فني', 
    status: 'completed', 
    time: '11:15', 
    date: '2024-03-13',
    details: 'تمت مساعدة المستخدم ليلى حسن في إتمام عملية الدفع التي كانت تواجه مشكلة فنية. تم توجيهها خلال العملية حتى اكتملت بنجاح.',
    userAffected: 'Laila Hassan',
    paymentAmount: '750 CRN',
    paymentMethod: 'بطاقة ائتمان'
  }
];

// مكون سجل العمليات
const TransactionLog: React.FC = () => {
  const [entries, setEntries] = useState<LogEntry[]>(dummyLogEntries);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [filter, setFilter] = useState<string>('all'); // all, admin, support
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // عدد السجلات في كل صفحة
  const entriesPerPage = 8;
  
  // فلترة السجلات حسب البحث والفلتر
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.action.includes(searchTerm) || 
      entry.user.includes(searchTerm) || 
      (entry.userAffected && entry.userAffected.includes(searchTerm)) ||
      entry.details.includes(searchTerm);
    
    const matchesTypeFilter = filter === 'all' || entry.type === filter;
    const matchesDateFilter = !dateFilter || entry.date === dateFilter;
    
    return matchesSearch && matchesTypeFilter && matchesDateFilter;
  });
  
  // الصفحات
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const currentEntries = filteredEntries.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  
  // التنقل بين الصفحات
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // عرض تفاصيل السجل
  const viewEntryDetails = (entry: LogEntry) => {
    setSelectedEntry(entry);
    setShowEntryDetails(true);
  };
  
  // إغلاق التفاصيل
  const closeEntryDetails = () => {
    setShowEntryDetails(false);
  };
  
  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setSearchTerm('');
    setFilter('all');
    setDateFilter('');
  };
  
  // استخراج تواريخ فريدة للفلترة
  const uniqueDates = Array.from(new Set(entries.map(entry => entry.date))).sort().reverse();

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#2d3748]"
      >
        <h1 className="text-2xl font-bold text-white mb-6 text-right">سجل العمليات</h1>
        
        {/* أدوات البحث والفلترة */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="ابحث عن عملية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0f172a] text-white px-4 py-2 rounded-lg border border-[#2d3748] pl-10 focus:outline-none focus:border-purple-500"
                dir="rtl"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#0f172a] text-white p-2 rounded-lg border border-[#2d3748] hover:bg-[#1a2234]"
              onClick={resetFilters}
              title="إعادة تعيين الفلاتر"
            >
              <RefreshCw size={18} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#0f172a] text-white p-2 rounded-lg border border-[#2d3748] hover:bg-[#1a2234]"
              title="تحميل السجل"
            >
              <Download size={18} />
            </motion.button>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#0f172a] text-white px-3 py-2 rounded-lg border border-[#2d3748] focus:outline-none focus:border-purple-500"
              dir="rtl"
            >
              <option value="all">كل الأنواع</option>
              <option value="admin">الإدارة</option>
              <option value="support">الدعم الفني</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-[#0f172a] text-white px-3 py-2 rounded-lg border border-[#2d3748] focus:outline-none focus:border-purple-500"
              dir="rtl"
            >
              <option value="">كل التواريخ</option>
              {uniqueDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* جدول السجلات */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#0f172a] rounded-xl border border-[#2d3748] overflow-hidden">
            <thead>
              <tr className="bg-[#1e293b] text-right border-b border-[#2d3748]">
                <th className="px-4 py-3 text-gray-400 font-medium text-sm">النوع</th>
                <th className="px-4 py-3 text-gray-400 font-medium text-sm">العملية</th>
                <th className="px-4 py-3 text-gray-400 font-medium text-sm">المسؤول</th>
                <th className="px-4 py-3 text-gray-400 font-medium text-sm">المستخدم المتأثر</th>
                <th className="px-4 py-3 text-gray-400 font-medium text-sm">التاريخ والوقت</th>
                <th className="px-4 py-3 text-gray-400 font-medium text-sm">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map(entry => (
                <motion.tr 
                  key={entry.id} 
                  className="border-b border-[#2d3748] hover:bg-[#1a2234] cursor-pointer"
                  whileHover={{ backgroundColor: '#1a2234' }}
                  onClick={() => viewEntryDetails(entry)}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      entry.type === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {entry.type === 'admin' ? 'إدارة' : 'دعم فني'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{entry.action}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="text-gray-300">{entry.user}</span>
                      <span className="mx-2 text-gray-600">•</span>
                      <span className="text-sm text-gray-400">{entry.role}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{entry.userAffected || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{entry.time} - {entry.date}</td>
                  <td className="px-4 py-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 bg-[#1e293b] rounded-lg text-purple-400 hover:bg-purple-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewEntryDetails(entry);
                      }}
                    >
                      <FileText size={16} />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
              
              {currentEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    لا توجد عمليات مطابقة لمعايير البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* ترقيم الصفحات */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 bg-[#1e293b] rounded-lg text-purple-400 hover:bg-purple-500/20 disabled:opacity-30 disabled:hover:bg-[#1e293b]"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronRight size={18} />
            </motion.button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-8 h-8 rounded-lg text-sm ${
                    currentPage === page 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#1e293b] text-gray-400 hover:bg-[#2d3748]'
                  }`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </motion.button>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 bg-[#1e293b] rounded-lg text-purple-400 hover:bg-purple-500/20 disabled:opacity-30 disabled:hover:bg-[#1e293b]"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronLeft size={18} />
            </motion.button>
          </div>
        )}
      </motion.div>
      
      {/* نافذة تفاصيل العملية */}
      {showEntryDetails && selectedEntry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeEntryDetails}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#1e293b] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-[#2d3748]"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ml-3 ${
                  selectedEntry.type === 'support' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {selectedEntry.type === 'support' ? <User size={24} /> : <UserCog size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedEntry.action}</h2>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className={`text-sm font-medium ${
                      selectedEntry.type === 'support' ? 'text-blue-400' : 'text-purple-400'
                    }`}>
                      {selectedEntry.type === 'support' ? 'دعم فني' : 'إدارة'}
                    </span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span>{selectedEntry.user}</span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-purple-300">{selectedEntry.role}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={closeEntryDetails}
                className="p-2 hover:bg-[#0f172a] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 p-4 bg-[#0f172a] rounded-xl border border-[#2d3748]/50">
              <h3 className="font-semibold text-white mb-2">تفاصيل النشاط</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{selectedEntry.details}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="p-4 bg-[#0f172a] rounded-xl border border-[#2d3748]/50">
                <h4 className="font-medium text-gray-300 mb-2 flex items-center">
                  <Clock className="text-purple-400 ml-2" size={16} />
                  الوقت والتاريخ
                </h4>
                <div className="text-sm text-white">
                  <p>{selectedEntry.time} - {selectedEntry.date}</p>
                  {selectedEntry.timeSpent && <p className="mt-1 text-gray-400">المدة: {selectedEntry.timeSpent}</p>}
                </div>
              </div>
              
              <div className="p-4 bg-[#0f172a] rounded-xl border border-[#2d3748]/50">
                <h4 className="font-medium text-gray-300 mb-2 flex items-center">
                  <User className="text-purple-400 ml-2" size={16} />
                  المستخدم المتأثر
                </h4>
                <div className="text-sm text-white">
                  <p>{selectedEntry.userAffected || 'غير محدد'}</p>
                </div>
              </div>
            </div>

            {/* معلومات إضافية حسب نوع العملية */}
            <div className="grid grid-cols-1 gap-4 mb-5">
              {/* تحويل المحفظة */}
              {selectedEntry.action === 'تحويل المحفظة' && (
                <div className="p-4 bg-[#0f172a] rounded-xl border border-[#2d3748]/50">
                  <h3 className="font-semibold text-white mb-3">معلومات التحويل</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-400 text-xs">المبلغ</p>
                      <p className="text-white text-sm">{selectedEntry.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">رقم التحويل</p>
                      <p className="text-white text-sm">{selectedEntry.transferId}</p>
                    </div>
                    {selectedEntry.verificationMethod && (
                      <div>
                        <p className="text-gray-400 text-xs">طريقة التحقق</p>
                        <p className="text-white text-sm">{selectedEntry.verificationMethod}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* حظر المستخدم */}
              {(selectedEntry.action === 'حظر المستخدم' || selectedEntry.action === 'فك حظر المستخدم') && (
                <div className="p-4 bg-[#0f172a] rounded-xl border border-[#2d3748]/50">
                  <h3 className="font-semibold text-white mb-3">معلومات الحظر</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-400 text-xs">سبب الحظر</p>
                      <p className="text-white text-sm">{selectedEntry.banReason}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">مدة الحظر</p>
                      <p className="text-white text-sm">{selectedEntry.banDuration}</p>
                    </div>
                    {selectedEntry.appealProcess && (
                      <div>
                        <p className="text-gray-400 text-xs">عملية الاستئناف</p>
                        <p className="text-white text-sm">{selectedEntry.appealProcess}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* استرداد التحويل */}
              {selectedEntry.action === 'استرداد التحويل' && (
                <div className="p-4 bg-[#0f172a] rounded-xl border border-[#2d3748]/50">
                  <h3 className="font-semibold text-white mb-3">معلومات الاسترداد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-400 text-xs">المرسل</p>
                      <p className="text-white text-sm">{selectedEntry.senderUser}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">المستلم</p>
                      <p className="text-white text-sm">{selectedEntry.receiverUser}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">المبلغ</p>
                      <p className="text-white text-sm">{selectedEntry.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">رقم المعاملة</p>
                      <p className="text-white text-sm">{selectedEntry.transactionId}</p>
                    </div>
                    {selectedEntry.ticketId && (
                      <div>
                        <p className="text-gray-400 text-xs">رقم التذكرة</p>
                        <p className="text-white text-sm">{selectedEntry.ticketId}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* إضافة المزيد من أنواع العمليات حسب الحاجة */}
            </div>

            <div className="flex justify-end mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={closeEntryDetails}
              >
                إغلاق
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TransactionLog; 
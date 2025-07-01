import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  XCircle,
  X,
  Copy,
  Calendar
} from 'lucide-react';

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

interface TransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

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
    
    // استخدام تنسيق أكثر وضوحًا للتاريخ والوقت
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'UTC'
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

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, isOpen, onClose }) => {
  // نسخ النص إلى الحافظة
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // يمكن إضافة تنبيه هنا إذا كنت ترغب في إشعار المستخدم
  };

  return (
    <AnimatePresence>
      {isOpen && transaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="absolute inset-0" onClick={onClose}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="bg-[#1e293b] rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative z-10"
          >
            {/* رأس النافذة */}
            <div className="p-4 border-b border-[#2d3748] flex justify-between items-center sticky top-0 bg-[#1e293b] z-10">
              <h3 className="text-xl font-semibold text-white">
                تفاصيل المعاملة
              </h3>
              <button 
                className="p-2 rounded-full hover:bg-[#0f172a] text-gray-400 hover:text-white transition-colors"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* محتوى النافذة */}
            <div className="p-4">
              {/* بطاقة نوع المعاملة والمبلغ */}
              <div className="bg-[#0f172a] p-4 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`rounded-full p-2 ${
                        transaction.type === 'sent' 
                          ? 'bg-red-900/30 text-red-400' 
                          : 'bg-green-900/30 text-green-400'
                      }`}>
                        {transaction.type === 'sent' 
                          ? <ArrowLeft size={18} /> 
                          : <ArrowRight size={18} />
                        }
                      </div>
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'sent' 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}>
                        {transaction.type === 'sent' 
                          ? 'إرسال مبلغ' 
                          : 'استلام مبلغ'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <div className={`text-2xl font-bold ${
                        transaction.type === 'sent' 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}>
                        {transaction.type === 'sent' ? '-' : '+'}{formatAmount(transaction.amount)}
                      </div>
                      <span className="text-lg font-semibold text-white mr-1">CRN</span>
                    </div>
                    {parseFloat(transaction.fee) > 0 && (
                      <p className="text-sm text-gray-400 mt-1">
                        الرسوم: {formatAmount(transaction.fee)} CRN
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* تفاصيل المعاملة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0f172a] p-3 rounded-md">
                  <div className="flex justify-between">
                    <p className="text-gray-400 text-sm mb-1">رقم المعاملة</p>
                    <button 
                      className="text-purple-400 hover:text-purple-300 transition-colors p-1" 
                      onClick={() => copyToClipboard(transaction.transaction_id)}
                      title="نسخ إلى الحافظة"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-white font-medium text-sm break-all">{transaction.transaction_id}</p>
                </div>
                
                <div className="bg-[#0f172a] p-3 rounded-md">
                  <div className="flex justify-between">
                    <p className="text-gray-400 text-sm mb-1">تاريخ ووقت المعاملة</p>
                    <Calendar size={14} className="text-gray-400" />
                  </div>
                  <p className="text-white font-medium">
                    {formatDateTime(transaction.timestamp)}
                  </p>
                </div>
                
                <div className="bg-[#0f172a] p-3 rounded-md">
                  <p className="text-gray-400 text-sm mb-1">حالة المعاملة</p>
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-sm gap-1 ${
                      transaction.status === 'completed' 
                        ? 'bg-green-900/30 text-green-400' 
                        : transaction.status === 'pending'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {transaction.status === 'completed' ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>مكتملة</span>
                        </>
                      ) : transaction.status === 'pending' ? (
                        <>
                          <RefreshCw size={14} />
                          <span>قيد التنفيذ</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          <span>ملغية</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#0f172a] p-3 rounded-md">
                  <div className="flex justify-between">
                    <p className="text-gray-400 text-sm mb-1">معرف المستخدم الآخر</p>
                    <button 
                      className="text-purple-400 hover:text-purple-300 transition-colors p-1" 
                      onClick={() => copyToClipboard(transaction.counterparty_id)}
                      title="نسخ إلى الحافظة"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-white font-medium text-sm break-all">{transaction.counterparty_id}</p>
                </div>
                
                <div className="bg-[#0f172a] p-3 rounded-md">
                  <div className="flex justify-between">
                    <p className="text-gray-400 text-sm mb-1">عنوان المستخدم الآخر</p>
                    <button 
                      className="text-purple-400 hover:text-purple-300 transition-colors p-1" 
                      onClick={() => copyToClipboard(transaction.counterparty_address)}
                      title="نسخ إلى الحافظة"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-white font-medium text-sm break-all">{transaction.counterparty_address}</p>
                </div>
                
                <div className="bg-[#0f172a] p-3 rounded-md">
                  <p className="text-gray-400 text-sm mb-1">المبلغ الإجمالي</p>
                  <p className="text-white font-medium">
                    {formatAmount(transaction.amount)} CRN
                  </p>
                </div>
                
                <div className="bg-[#0f172a] p-3 rounded-md">
                  <p className="text-gray-400 text-sm mb-1">رسوم المعاملة</p>
                  <p className="text-white font-medium">
                    {formatAmount(transaction.fee)} CRN
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransactionModal; 
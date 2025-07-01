import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  ArrowDownUp,
  BadgePercent,
  AlertOctagon,
  Star,
  Settings,
  X,
  Crown
} from 'lucide-react';
import axios from 'axios';

// Define the type for our settings
interface TransferSettings {
  _id: string;
  maintenance_mode: boolean;
  freeze_amount: number;
  daily_quota: number;
  require_2fa: boolean;
  max_transfers_per_hour: number;
  cooldown_minutes: number;
  tax_rate: number;
  tax_enabled: boolean;
  min_amount: string | number;
  max_amount: string | number;
  freeze_duration_hours: number;
  freeze_enabled: boolean;
  premium_enabled: boolean;
  premium_settings: PremiumSettings;
}

// Premium Settings interface
interface PremiumSettings {
  tax_exempt: boolean;
  tax_exempt_enabled: boolean;
  daily_quota_boost: number;
  daily_quota_boost_enabled: boolean;
  cooldown_reduction: number;
  cooldown_reduction_enabled: boolean;
}

// Add CSS to remove number input spinners
const hideNumberInputStyles = `
  /* Remove number input spinners */
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

// Initial settings based on the provided JSON
const initialSettings: TransferSettings = {
  _id: "transfer_settings",
  maintenance_mode: false,
  freeze_amount: 100,
  daily_quota: 200,
  require_2fa: true,
  max_transfers_per_hour: 3,
  cooldown_minutes: 30,
  tax_rate: 0.05,
  tax_enabled: true,
  min_amount: "0.00000001",
  max_amount: "10000",
  freeze_duration_hours: 24,
  freeze_enabled: true,
  premium_enabled: false,
  premium_settings: {
    tax_exempt: true,
    tax_exempt_enabled: true,
    daily_quota_boost: 50,
    daily_quota_boost_enabled: true,
    cooldown_reduction: 50,
    cooldown_reduction_enabled: true
  }
};

// Custom toggle switch component
const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => {
  return (
    <button
      type="button"
      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-purple-600' : 'bg-[#2d3748]'
      }`}
      onClick={onChange}
    >
      <span className="sr-only">Toggle Setting</span>
      <span
        className={`${
          enabled ? 'translate-x-9' : 'translate-x-1'
        } inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
      />
    </button>
  );
};

// Premium Settings Modal Component
const PremiumSettingsModal = ({ 
  isOpen, 
  onClose, 
  premiumSettings, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  premiumSettings: PremiumSettings;
  onSave: (settings: PremiumSettings) => void; 
}) => {
  const [localSettings, setLocalSettings] = useState<PremiumSettings>(premiumSettings);
  const [localLoading, setLocalLoading] = useState(false);
  
  useEffect(() => {
    setLocalSettings(premiumSettings);
  }, [premiumSettings, isOpen]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const name = target.name as keyof PremiumSettings;
    const value = target.type === 'checkbox' ? target.checked : 
                 target.type === 'number' || target.type === 'range' ? parseFloat(target.value) : 
                 target.value;
    
    setLocalSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleToggle = (name: keyof PremiumSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [name]: !prev[name as keyof PremiumSettings]
    }));
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSave(localSettings);
    setLocalLoading(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1e293b] rounded-xl border border-[#2d3748]/50 p-6 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
      >
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#2d3748]">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Crown className="text-yellow-400" size={20} />
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
              إعدادات بريميوم للتحويلات
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Tax Exemption */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="tax_exempt">
                  إعفاء ضريبي للبريميوم
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.tax_exempt_enabled} 
                    onChange={() => handleToggle('tax_exempt_enabled')} 
                  />
                  <span className="text-yellow-400 text-sm font-semibold">
                    {localSettings.tax_exempt ? "معفي" : "غير معفي"}
                  </span>
                </div>
              </div>
              <div className="relative mt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="tax_exempt"
                    id="tax_exempt"
                    checked={localSettings.tax_exempt}
                    onChange={(e) => setLocalSettings(prev => ({...prev, tax_exempt: e.target.checked}))}
                    className="h-5 w-5 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500"
                    disabled={!localSettings.tax_exempt_enabled}
                  />
                  <label htmlFor="tax_exempt" className="ml-2 text-sm text-white">
                    إعفاء من جميع الضرائب (0%)
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                إعفاء مستخدمي البريميوم من الضرائب على التحويلات
              </p>
            </div>
            
            {/* Daily Quota Boost */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="daily_quota_boost">
                  زيادة الحد اليومي
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.daily_quota_boost_enabled} 
                    onChange={() => handleToggle('daily_quota_boost_enabled')} 
                  />
                  <span className="text-yellow-400 text-sm font-semibold">
                    {localSettings.daily_quota_boost}
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  name="daily_quota_boost"
                  id="daily_quota_boost"
                  value={localSettings.daily_quota_boost}
                  onChange={handleChange}
                  className={`w-full h-2 ${localSettings.daily_quota_boost_enabled ? 'bg-[#2d3748]' : 'bg-[#1e293b] opacity-50'} rounded-lg appearance-none cursor-pointer`}
                  disabled={!localSettings.daily_quota_boost_enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                زيادة الحد الأقصى للتحويلات اليومية للمستخدمين المميزين
              </p>
            </div>
            
            {/* Cooldown Reduction */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="cooldown_reduction">
                  تخفيض وقت الانتظار
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.cooldown_reduction_enabled} 
                    onChange={() => handleToggle('cooldown_reduction_enabled')} 
                  />
                  <span className="text-yellow-400 text-sm font-semibold">
                    {localSettings.cooldown_reduction}
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  name="cooldown_reduction"
                  id="cooldown_reduction"
                  value={localSettings.cooldown_reduction}
                  onChange={handleChange}
                  className={`w-full h-2 ${localSettings.cooldown_reduction_enabled ? 'bg-[#2d3748]' : 'bg-[#1e293b] opacity-50'} rounded-lg appearance-none cursor-pointer`}
                  disabled={!localSettings.cooldown_reduction_enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                تخفيض وقت الانتظار بين التحويلات لمستخدمي البريميوم
              </p>
            </div>
          </div>
          
          <div className="flex justify-end mt-8 pt-4 border-t border-[#2d3748]">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 mr-2 rounded-lg border border-[#4a5568] text-gray-300 hover:bg-[#2d3748] transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={localLoading}
              className={`py-2 px-4 rounded-lg flex items-center space-x-2 rtl:space-x-reverse ${
                localLoading ? 'bg-yellow-700/50 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700'
              } transition-colors`}
            >
              {localLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin ml-2 rtl:mr-2" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save size={18} className="ml-2 rtl:mr-2" />
                  <span>حفظ إعدادات البريميوم</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const CurrencySettings = () => {
  const [settings, setSettings] = useState<TransferSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  useEffect(() => {
    // Add CSS to head to remove number input spinners
    const styleElement = document.createElement('style');
    styleElement.textContent = hideNumberInputStyles;
    document.head.appendChild(styleElement);

    // Fetch settings from backend
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings/transfer');
        if (res.data && res.data.success && res.data.settings) {
          // تحويل جميع القيم المستلمة إلى الصيغة الصحيحة
          const receivedSettings = res.data.settings;
          
          // إذا لم تكن إعدادات البريميوم موجودة، أضفها
          if (!receivedSettings.premium_settings) {
            receivedSettings.premium_settings = initialSettings.premium_settings;
            receivedSettings.premium_enabled = false;
          }
          
          // الحفاظ على قيم min_amount و max_amount كما هي (نص) إذا كانت قادمة من API
          setSettings(receivedSettings);
        }
      } catch (err) {
        // Ignore error, keep initial settings
      }
    };
    fetchSettings();

    return () => {
      // Clean up when component unmounts
      if (styleElement.parentNode) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'min_amount' || name === 'max_amount' ? value : // حفظ القيم كنصوص
              type === 'number' ? parseFloat(value) : 
              value
    }));
  };

  const handleToggle = (name: keyof TransferSettings) => {
    setSettings(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
    
    try {
      // Send settings to backend API
      const response = await axios.put('/api/settings/transfer', settings);
      
      if (response.data && response.data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(response.data?.message || "فشل تحديث الإعدادات");
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handlePremiumSettingsSave = (premiumSettings: PremiumSettings) => {
    // تحديث الإعدادات محليًا
    const updatedSettings = {
      ...settings,
      premium_settings: premiumSettings
    };
    
    setSettings(updatedSettings);
    setIsPremiumModalOpen(false);
    
    // إرسال الإعدادات المحدثة إلى الباك اند
    const saveSettings = async () => {
      setLoading(true);
      try {
        const response = await axios.put('/api/settings/transfer', updatedSettings);
        if (response.data && response.data.success) {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          throw new Error(response.data?.message || "فشل تحديث إعدادات البريميوم");
        }
      } catch (err: any) {
        console.error("Error saving premium settings:", err);
        setError(err.message || "حدث خطأ أثناء حفظ إعدادات البريميوم");
      } finally {
        setLoading(false);
      }
    };
    
    saveSettings();
  };

  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#2d3748]/50 p-6 shadow-lg">
      {/* Header with gradient text */}
      <div className="mb-8 border-b border-[#2d3748] pb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          إعدادات العملة والتحويلات
        </h2>
        <p className="text-gray-400 text-sm mt-1">ضبط تكوين وقيود التحويلات</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center text-red-300"
        >
          <AlertTriangle size={18} className="mr-2" />
          <span>{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-center text-green-300"
        >
          <CheckCircle size={18} className="mr-2" />
          <span>تم حفظ الإعدادات بنجاح</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Toggle Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Maintenance Mode Toggle */}
          <div className={`p-5 rounded-xl border ${settings.maintenance_mode ? 'bg-red-900/20 border-red-500/30' : 'bg-[#0f172a] border-[#2d3748]'} transition-colors duration-300`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <AlertOctagon size={24} className={settings.maintenance_mode ? "text-red-400" : "text-gray-500"} />
                <ToggleSwitch enabled={settings.maintenance_mode} onChange={() => handleToggle('maintenance_mode')} />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">وضع الصيانة</h3>
              <p className="text-gray-400 text-xs">تعطيل جميع التحويلات مؤقتًا</p>
              {settings.maintenance_mode && (
                <div className="mt-3 text-red-300 text-xs py-1 px-2 bg-red-900/20 rounded-md">
                  تحذير: هذا سيمنع جميع المستخدمين من إجراء عمليات التحويل
                </div>
              )}
            </div>
          </div>

          {/* 2FA Requirement Toggle */}
          <div className={`p-5 rounded-xl border ${settings.require_2fa ? 'bg-blue-900/20 border-blue-500/30' : 'bg-[#0f172a] border-[#2d3748]'} transition-colors duration-300`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <ShieldAlert size={24} className={settings.require_2fa ? "text-blue-400" : "text-gray-500"} />
                <ToggleSwitch enabled={settings.require_2fa} onChange={() => handleToggle('require_2fa')} />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">توثيق بخطوتين</h3>
              <p className="text-gray-400 text-xs">طلب توثيق إضافي للتحويلات</p>
              {settings.require_2fa && (
                <div className="mt-3 text-blue-300 text-xs py-1 px-2 bg-blue-900/20 rounded-md">
                  تعزيز الأمان: يحمي من عمليات الاحتيال
                </div>
              )}
            </div>
          </div>

          {/* Tax Enabled Toggle */}
          <div className={`p-5 rounded-xl border ${settings.tax_enabled ? 'bg-green-900/20 border-green-500/30' : 'bg-[#0f172a] border-[#2d3748]'} transition-colors duration-300`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <BadgePercent size={24} className={settings.tax_enabled ? "text-green-400" : "text-gray-500"} />
                <ToggleSwitch enabled={settings.tax_enabled} onChange={() => handleToggle('tax_enabled')} />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">تفعيل الضريبة</h3>
              <p className="text-gray-400 text-xs">تطبيق نسبة ضريبة على التحويلات</p>
              {settings.tax_enabled && (
                <div className="mt-3 text-green-300 text-xs py-1 px-2 bg-green-900/20 rounded-md">
                  نسبة الضريبة الحالية: {(settings.tax_rate * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Freeze Enabled Toggle */}
          <div className={`p-5 rounded-xl border ${settings.freeze_enabled ? 'bg-purple-900/20 border-purple-500/30' : 'bg-[#0f172a] border-[#2d3748]'} transition-colors duration-300`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <Clock size={24} className={settings.freeze_enabled ? "text-purple-400" : "text-gray-500"} />
                <ToggleSwitch enabled={settings.freeze_enabled} onChange={() => handleToggle('freeze_enabled')} />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">تفعيل تجميد التحويلات</h3>
              <p className="text-gray-400 text-xs">تجميد المبالغ المحولة لفترة زمنية قبل الإتمام</p>
              {settings.freeze_enabled && (
                <div className="mt-3 text-purple-300 text-xs py-1 px-2 bg-purple-900/20 rounded-md">
                  مدة التجميد الحالية: {settings.freeze_duration_hours} ساعة
                </div>
              )}
            </div>
          </div>

          {/* Premium Mode Toggle */}
          <div className={`p-5 rounded-xl border ${settings.premium_enabled ? 'bg-amber-900/20 border-amber-500/30' : 'bg-[#0f172a] border-[#2d3748]'} transition-colors duration-300`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <Star size={24} className={settings.premium_enabled ? "text-yellow-400" : "text-gray-500"} />
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="mr-2 p-1.5 rounded-md bg-[#2d3748] hover:bg-yellow-900/30 text-yellow-400 transition-colors"
                    aria-label="إعدادات البريميوم"
                    title="إعدادات البريميوم"
                  >
                    <Settings size={16} />
                  </button>
                  <ToggleSwitch enabled={settings.premium_enabled} onChange={() => handleToggle('premium_enabled')} />
                </div>
              </div>
              <h3 className="text-white font-medium text-lg mb-1">مميزات البريميوم</h3>
              <p className="text-gray-400 text-xs">تفعيل مزايا إضافية للمستخدمين المميزين</p>
              {settings.premium_enabled && settings.premium_settings.tax_exempt_enabled && settings.premium_settings.tax_exempt && (
                <div className="mt-3 text-yellow-300 text-xs py-1 px-2 bg-yellow-900/20 rounded-md">
                  نشط: الإعفاء الضريبي للبريميوم (0%)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transfer Limits Section */}
        <div className="bg-[#0f172a] p-6 rounded-xl border border-[#2d3748]">
          <h3 className="text-xl font-medium text-white mb-6 border-b border-[#2d3748]/50 pb-3 flex items-center">
            <ArrowDownUp size={20} className="text-purple-400 mr-2" />
            حدود التحويلات
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              {/* Freeze Amount */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium" htmlFor="freeze_amount">
                    مبلغ التجميد
                  </label>
                  <span className="text-purple-400 text-sm font-semibold">
                    {settings.freeze_amount}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    id="freeze_amount"
                    name="freeze_amount"
                    value={settings.freeze_amount}
                    onChange={handleChange}
                    className="w-full h-2 bg-[#2d3748] rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
                <p className="text-gray-500 text-xs">
                  مبلغ التحويل الذي سيتم تجميده بشكل مؤقت للتحقق
                </p>
              </div>

              {/* Daily Quota */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium" htmlFor="daily_quota">
                    الحد اليومي
                  </label>
                  <span className="text-purple-400 text-sm font-semibold">
                    {settings.daily_quota}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    id="daily_quota"
                    name="daily_quota"
                    value={settings.daily_quota}
                    onChange={handleChange}
                    className="w-full h-2 bg-[#2d3748] rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
                <p className="text-gray-500 text-xs">
                  الحد الأقصى للتحويلات اليومية لكل مستخدم
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Cooldown Minutes */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium" htmlFor="cooldown_minutes">
                    مدة الانتظار (دقائق)
                  </label>
                  <span className="text-purple-400 text-sm font-semibold">
                    {settings.cooldown_minutes} دقيقة
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="1"
                    id="cooldown_minutes"
                    name="cooldown_minutes"
                    value={settings.cooldown_minutes}
                    onChange={handleChange}
                    className="w-full h-2 bg-[#2d3748] rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
                <p className="text-gray-500 text-xs">
                  مدة الانتظار المطلوبة بين التحويلات المتتالية
                </p>
              </div>

              {/* Tax Rate */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium" htmlFor="tax_rate">
                    نسبة الضريبة
                  </label>
                  <span className="text-purple-400 text-sm font-semibold">
                    {(settings.tax_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="0.2"
                    step="0.005"
                    id="tax_rate"
                    name="tax_rate"
                    value={settings.tax_rate}
                    onChange={handleChange}
                    className="w-full h-2 bg-[#2d3748] rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
                <p className="text-gray-500 text-xs">
                  النسبة المئوية المطبقة كضريبة على كل تحويل
                </p>
              </div>

              {/* Freeze Duration */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium" htmlFor="freeze_duration_hours">
                    مدة التجميد (ساعات)
                  </label>
                  <span className="text-purple-400 text-sm font-semibold">
                    {settings.freeze_duration_hours} ساعة
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="72"
                    id="freeze_duration_hours"
                    name="freeze_duration_hours"
                    value={settings.freeze_duration_hours}
                    onChange={handleChange}
                    className="w-full h-2 bg-[#2d3748] rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
                <p className="text-gray-500 text-xs">
                  المدة التي سيظل فيها المبلغ مجمدًا قبل إتمام التحويل
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Limits Section */}
        <div className="bg-[#0f172a] p-6 rounded-xl border border-[#2d3748]">
          <h3 className="text-xl font-medium text-white mb-6 border-b border-[#2d3748]/50 pb-3 flex items-center">
            <DollarSign size={20} className="text-purple-400 mr-2" />
            حدود المبالغ
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Min Amount */}
            <div className="space-y-2">
              <label className="text-white font-medium" htmlFor="min_amount">
                الحد الأدنى للتحويل
              </label>
              <div className="flex">
                <span className="bg-[#2d3748] flex items-center px-3 rounded-r-none rounded-l-md border-r-0 border border-[#3e4c63]">
                  <DollarSign size={16} className="text-gray-400" />
                </span>
                <input
                  type="text"
                  id="min_amount"
                  name="min_amount"
                  value={settings.min_amount.toString()}
                  onChange={handleChange}
                  className="w-full bg-[#1e293b] border border-[#3e4c63] rounded-l-md rounded-r-none px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-gray-500 text-xs">
                أقل مبلغ مسموح بتحويله في العملية الواحدة
              </p>
            </div>

            {/* Max Amount */}
            <div className="space-y-2">
              <label className="text-white font-medium" htmlFor="max_amount">
                الحد الأقصى للتحويل
              </label>
              <div className="flex">
                <span className="bg-[#2d3748] flex items-center px-3 rounded-r-none rounded-l-md border-r-0 border border-[#3e4c63]">
                  <DollarSign size={16} className="text-gray-400" />
                </span>
                <input
                  type="text"
                  id="max_amount"
                  name="max_amount"
                  value={settings.max_amount.toString()}
                  onChange={handleChange}
                  className="w-full bg-[#1e293b] border border-[#3e4c63] rounded-l-md rounded-r-none px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-gray-500 text-xs">
                أعلى مبلغ مسموح بتحويله في العملية الواحدة (مثال: 1.00000000 = عملة واحدة)
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 rtl:space-x-reverse">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="px-4 py-2 bg-[#2d3748] text-gray-300 rounded-lg hover:bg-[#3e4c63] transition-colors flex items-center"
            onClick={() => setSettings(initialSettings)}
          >
            <RefreshCw size={16} className="ml-2" />
            إعادة ضبط
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors flex items-center"
          >
            {loading ? <RefreshCw size={16} className="ml-2 animate-spin" /> : <Save size={16} className="ml-2" />}
            حفظ الإعدادات
          </motion.button>
        </div>
      </form>
      
      {/* Premium Settings Modal */}
      <PremiumSettingsModal 
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        premiumSettings={settings.premium_settings}
        onSave={handlePremiumSettingsSave}
      />
    </div>
  );
};

export default CurrencySettings; 
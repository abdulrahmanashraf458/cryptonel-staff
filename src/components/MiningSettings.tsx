import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Cpu,
  Users,
  Gauge,
  AlertOctagon,
  Pickaxe,
  Timer,
  Wrench,
  Star,
  BarChart,
  Zap,
  Clock,
  Settings,
  X,
  TrendingUp,
  Crown,
  Gem,
  Award,
  Shield
} from 'lucide-react';
import axios from 'axios';

// Define the type for our settings
interface MiningSettings {
  _id: string;
  maintenance_mode: boolean;
  difficulty_level: number;
  daily_mining_rate: number;
  auto_mining_enabled: boolean;
  mining_session_hours: number;
  boosted_mining: boolean;
  premium_bonus_enabled: boolean;
  mining_reward_type: string;
  premium_settings: PremiumSettings;
  anti_fraud_protection: boolean;
  fraud_protection_settings: FraudProtectionSettings;
}

// Premium Settings interface
interface PremiumSettings {
  bonus_multiplier: number;
  bonus_multiplier_enabled: boolean;
  daily_limit_boost: number;
  daily_limit_boost_enabled: boolean;
  reduced_difficulty: number;
  reduced_difficulty_enabled: boolean;
  mining_interval_hours: number;
  mining_interval_hours_enabled: boolean;
  mining_reward_type: string;
  auto_mining_premium: boolean;
}

// Fraud Protection Settings interface
interface FraudProtectionSettings {
  accounts_per_ip: number;
  accounts_per_device: number;
  accounts_per_ip_enabled: boolean;
  accounts_per_device_enabled: boolean;
  penalty_type: 'permanent_ban' | 'warning_then_ban' | 'mining_suspension' | 'mining_block';
  penalty_enabled: boolean;
  protection_level: 'low' | 'medium' | 'high';
  protection_level_enabled: boolean;
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

// Initial settings
const initialSettings: MiningSettings = {
  _id: "mining_settings",
  maintenance_mode: false,
  difficulty_level: 50,
  daily_mining_rate: 100,
  auto_mining_enabled: true,
  mining_session_hours: 6,
  boosted_mining: false,
  premium_bonus_enabled: true,
  mining_reward_type: "points",
  premium_settings: {
    bonus_multiplier: 2,
    daily_limit_boost: 50,
    auto_mining_premium: true,
    reduced_difficulty: 25,
    mining_interval_hours: 3,
    bonus_multiplier_enabled: true,
    daily_limit_boost_enabled: true,
    reduced_difficulty_enabled: true,
    mining_interval_hours_enabled: true,
    mining_reward_type: 'عملة CRN فقط',
  },
  anti_fraud_protection: true,
  fraud_protection_settings: {
    accounts_per_ip: 1,
    accounts_per_device: 1,
    accounts_per_ip_enabled: true,
    accounts_per_device_enabled: true,
    penalty_type: 'warning_then_ban',
    penalty_enabled: true,
    protection_level: 'medium',
    protection_level_enabled: true
  }
};

// Custom toggle switch component
const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => {
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-700'}`}
      onClick={onChange}
    >
      <span
        className={`${
          enabled ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
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
              إعدادات بريميوم للتعدين
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
            {/* Bonus Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="bonus_multiplier">
                  مضاعف مكافأة بريميوم (x)
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.bonus_multiplier_enabled} 
                    onChange={() => handleToggle('bonus_multiplier_enabled')} 
                  />
                <span className="text-yellow-400 text-sm font-semibold">
                    x{localSettings.bonus_multiplier}
                </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="1.1"
                  max="5"
                  step="0.1"
                  name="bonus_multiplier"
                  id="bonus_multiplier"
                  value={localSettings.bonus_multiplier}
                  onChange={handleChange}
                  className={`w-full h-2 ${localSettings.bonus_multiplier_enabled ? 'bg-[#2d3748]' : 'bg-[#1e293b] opacity-50'} rounded-lg appearance-none cursor-pointer`}
                  disabled={!localSettings.bonus_multiplier_enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1x</span>
                  <span>2x</span>
                  <span>3x</span>
                  <span>5x</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                مضاعفة مكافآت التعدين لمستخدمي بريميوم (x ضعف المعدل العادي)
              </p>
            </div>
            
            {/* Daily Limit Boost */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="daily_limit_boost">
                  زيادة الحد اليومي (%)
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.daily_limit_boost_enabled} 
                    onChange={() => handleToggle('daily_limit_boost_enabled')} 
                  />
                <span className="text-yellow-400 text-sm font-semibold">
                  +{localSettings.daily_limit_boost}%
                </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  name="daily_limit_boost"
                  id="daily_limit_boost"
                  value={localSettings.daily_limit_boost}
                  onChange={handleChange}
                  className={`w-full h-2 ${localSettings.daily_limit_boost_enabled ? 'bg-[#2d3748]' : 'bg-[#1e293b] opacity-50'} rounded-lg appearance-none cursor-pointer`}
                  disabled={!localSettings.daily_limit_boost_enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                زيادة الحد الأقصى للتعدين اليومي (بالنسبة المئوية)
              </p>
            </div>
            
            {/* Reduced Difficulty */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="reduced_difficulty">
                  تخفيض الصعوبة (%)
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.reduced_difficulty_enabled} 
                    onChange={() => handleToggle('reduced_difficulty_enabled')} 
                  />
                <span className="text-yellow-400 text-sm font-semibold">
                  -{localSettings.reduced_difficulty}%
                </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="75"
                  step="5"
                  name="reduced_difficulty"
                  id="reduced_difficulty"
                  value={localSettings.reduced_difficulty}
                  onChange={handleChange}
                  className={`w-full h-2 ${localSettings.reduced_difficulty_enabled ? 'bg-[#2d3748]' : 'bg-[#1e293b] opacity-50'} rounded-lg appearance-none cursor-pointer`}
                  disabled={!localSettings.reduced_difficulty_enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                تخفيض مستوى الصعوبة لأعضاء بريميوم (بالنسبة المئوية)
              </p>
            </div>
            
            {/* Mining Interval Hours - NEW */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="mining_interval_hours">
                  فترة التعدين المتكرر (ساعات)
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.mining_interval_hours_enabled} 
                    onChange={() => handleToggle('mining_interval_hours_enabled')} 
                  />
                <span className="text-yellow-400 text-sm font-semibold">
                  كل {localSettings.mining_interval_hours} ساعة
                </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="1"
                  name="mining_interval_hours"
                  id="mining_interval_hours"
                  value={localSettings.mining_interval_hours}
                  onChange={handleChange}
                  className={`w-full h-2 ${localSettings.mining_interval_hours_enabled ? 'bg-[#2d3748]' : 'bg-[#1e293b] opacity-50'} rounded-lg appearance-none cursor-pointer`}
                  disabled={!localSettings.mining_interval_hours_enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>كل ساعة</span>
                  <span>6 ساعات</span>
                  <span>12 ساعة</span>
                  <span>24 ساعة</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                الفترة الزمنية بين جلسات التعدين لمستخدمي بريميوم (العاديين 6-12 ساعة)
              </p>
            </div>
            
            {/* Auto Mining Premium - REPLACEMENT FOR FEATURE TOGGLES */}
            <div className="p-4 bg-[#2d3748]/70 border border-purple-500/30 rounded-lg mt-5">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <Cpu size={20} className="text-yellow-400 mr-2" />
                  <span className="text-md font-medium text-white">التعدين التلقائي للبريميوم</span>
                </div>
                <ToggleSwitch 
                  enabled={localSettings.auto_mining_premium} 
                  onChange={() => handleToggle('auto_mining_premium')} 
                />
              </div>
              <p className="text-xs text-gray-400">
                تمكين التعدين التلقائي المستمر لأعضاء بريميوم بدون الحاجة للتواجد على الموقع
              </p>
              {localSettings.auto_mining_premium && (
                <div className="mt-3 text-yellow-300 text-xs py-1 px-2 bg-yellow-900/20 rounded-md">
                  ميزة حصرية: يستطيع أعضاء بريميوم التعدين تلقائياً 24/7
                </div>
              )}
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

// Fraud Protection Modal Component
const FraudProtectionModal = ({ 
  isOpen, 
  onClose, 
  fraudSettings, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  fraudSettings: FraudProtectionSettings;
  onSave: (settings: FraudProtectionSettings) => void; 
}) => {
  const [localSettings, setLocalSettings] = useState<FraudProtectionSettings>(fraudSettings);
  const [localLoading, setLocalLoading] = useState(false);
  
  useEffect(() => {
    setLocalSettings(fraudSettings);
  }, [fraudSettings, isOpen]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name as keyof FraudProtectionSettings;
    const value = target.type === 'select-one' 
      ? target.value 
      : target.type === 'number' || target.type === 'range' 
        ? parseFloat(target.value) 
        : target.value;
    
    setLocalSettings(prev => ({
      ...prev,
      [name]: value
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
            <Shield className="text-indigo-400" size={20} />
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
              إعدادات حماية ضد الاحتيال للتعدين
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
            {/* Accounts Per IP */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="accounts_per_ip">
                  عدد الحسابات المسموح بها لكل IP
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.accounts_per_ip_enabled} 
                    onChange={() => {
                      setLocalSettings(prev => ({
                        ...prev,
                        accounts_per_ip_enabled: !prev.accounts_per_ip_enabled
                      }));
                    }}
                  />
                  <span className="text-indigo-400 text-sm font-semibold">
                    {localSettings.accounts_per_ip}
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  name="accounts_per_ip"
                  id="accounts_per_ip"
                  value={localSettings.accounts_per_ip}
                  onChange={handleChange}
                  className={`w-full h-10 bg-[#2d3748] border border-[#4a5568] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    !localSettings.accounts_per_ip_enabled ? 'opacity-50' : ''
                  }`}
                  disabled={!localSettings.accounts_per_ip_enabled}
                />
              </div>
              <p className="text-xs text-gray-400">
                تمنع وجود أكثر من حساب بيعدّن من نفس الشبكة المنزلية أو الراوتر
              </p>
              <p className="text-xs text-indigo-300">
                أدخل أي رقم (1 أو أكثر) لتحديد عدد الحسابات المسموح بها من نفس عنوان IP
              </p>
            </div>
            
            {/* Accounts Per Device */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="accounts_per_device">
                  عدد الحسابات المسموح بها لكل جهاز
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.accounts_per_device_enabled} 
                    onChange={() => {
                      setLocalSettings(prev => ({
                        ...prev,
                        accounts_per_device_enabled: !prev.accounts_per_device_enabled
                      }));
                    }}
                  />
                  <span className="text-indigo-400 text-sm font-semibold">
                    {localSettings.accounts_per_device}
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  name="accounts_per_device"
                  id="accounts_per_device"
                  value={localSettings.accounts_per_device}
                  onChange={handleChange}
                  className={`w-full h-10 bg-[#2d3748] border border-[#4a5568] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    !localSettings.accounts_per_device_enabled ? 'opacity-50' : ''
                  }`}
                  disabled={!localSettings.accounts_per_device_enabled}
                />
              </div>
              <p className="text-xs text-gray-400">
                تعتمد على Device ID أو بصمة الجهاز (Fingerprint) - مفيدة لو في ناس بيستخدموا VPN أو IP متغير
              </p>
              <p className="text-xs text-indigo-300">
                أدخل أي رقم (1 أو أكثر) لتحديد عدد الحسابات المسموح بها من نفس الجهاز
              </p>
            </div>
            
            {/* Penalty Type */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="penalty_type">
                  نوع العقوبة عند تجاوز الحد
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.penalty_enabled} 
                    onChange={() => {
                      setLocalSettings(prev => ({
                        ...prev,
                        penalty_enabled: !prev.penalty_enabled
                      }));
                    }}
                  />
                </div>
              </div>
              <div className="relative">
                <select
                  name="penalty_type"
                  id="penalty_type"
                  value={localSettings.penalty_type}
                  onChange={handleChange}
                  className={`w-full bg-[#2d3748] border border-[#4a5568] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    !localSettings.penalty_enabled ? 'opacity-50' : ''
                  }`}
                  disabled={!localSettings.penalty_enabled}
                >
                  <option value="permanent_ban">🔨 باند دائم</option>
                  <option value="warning_then_ban">⚠️ تحذير فقط أول مرة، ثم تصعيد العقوبة الي باند دائم</option>
                  <option value="mining_suspension">⏳ حظر التعدين فقط بدون باند</option>
                  <option value="mining_block">🛑 منع التعدين فقط بدون باند او حظر التعدين</option>
                </select>
              </div>
              <p className="text-xs text-gray-400">
                تحديد نوع العقوبة التي ستطبق على المستخدمين الذين يتجاوزون الحد المسموح به
              </p>
            </div>
            
            {/* Protection Level */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-medium" htmlFor="protection_level">
                  مستوى الحماية
                </label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ToggleSwitch 
                    enabled={localSettings.protection_level_enabled} 
                    onChange={() => {
                      setLocalSettings(prev => ({
                        ...prev,
                        protection_level_enabled: !prev.protection_level_enabled
                      }));
                    }}
                  />
                </div>
              </div>
              <div className="relative">
                <select
                  name="protection_level"
                  id="protection_level"
                  value={localSettings.protection_level}
                  onChange={handleChange}
                  className={`w-full bg-[#2d3748] border border-[#4a5568] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    !localSettings.protection_level_enabled ? 'opacity-50' : ''
                  }`}
                  disabled={!localSettings.protection_level_enabled}
                >
                  <option value="low">🟢 منخفض: يسمح بـ 2 أجهزة/IP</option>
                  <option value="medium">🟡 متوسط: جهاز واحد و2 حساب بحد أقصى</option>
                  <option value="high">🔴 عالي: جهاز واحد – حساب واحد – باند مباشر عند المخالفة</option>
                </select>
              </div>
              <p className="text-xs text-gray-400">
                اختر مستوى الحماية المناسب حسب مدى صرامة الإجراءات المطلوبة
              </p>
            </div>
            
            {/* Protection Info */}
            <div className="p-4 bg-[#2d3748]/70 border border-indigo-500/30 rounded-lg mt-5">
              <div className="flex items-center mb-3">
                <Shield size={20} className="text-indigo-400 mr-2" />
                <span className="text-md font-medium text-white">معلومات الحماية</span>
              </div>
              <p className="text-xs text-gray-400">
                يساعد نظام الحماية في منع الاستغلال وتعدين متعدد الحسابات من نفس الأجهزة أو IP
              </p>
              <div className="mt-3 text-indigo-300 text-xs py-1 px-2 bg-indigo-900/20 rounded-md space-y-1">
                <div>نصيحة: اختر الإعدادات حسب طبيعة المستخدمين والتوازن المطلوب بين الأمان وسهولة الاستخدام</div>
                <div>فعّل أو عطّل أي من الإعدادات حسب احتياجاتك وسياسة منصتك</div>
              </div>
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
                localLoading ? 'bg-indigo-700/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
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
                  <span>حفظ إعدادات الحماية</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const MiningSettings = () => {
  // Use memo to prevent unnecessary re-renders
  const [settings, setSettings] = useState<MiningSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isFraudProtectionModalOpen, setIsFraudProtectionModalOpen] = useState(false);
  
  useEffect(() => {
    // Add CSS to head to remove number input spinners
    const styleElement = document.createElement('style');
    styleElement.textContent = hideNumberInputStyles;
    document.head.appendChild(styleElement);

    // Fetch settings from backend
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/settings/mining');
        if (response.data && response.data.success && response.data.settings) {
          // Get received settings
          const receivedSettings = { ...response.data.settings };

          // Ensure premium_settings exists
          if (!receivedSettings.premium_settings) {
            // Use default premium settings
            receivedSettings.premium_settings = { ...initialSettings.premium_settings };
          }

          // If the settings don't include fraud protection settings, add them
          if (!receivedSettings.fraud_protection_settings) {
            receivedSettings.fraud_protection_settings = { ...initialSettings.fraud_protection_settings };
          }

          // Make sure premium_settings has all required properties
          if (receivedSettings.premium_settings) {
            // Add enabled fields if missing
            if (receivedSettings.premium_settings.bonus_multiplier_enabled === undefined) {
              receivedSettings.premium_settings.bonus_multiplier_enabled = !!receivedSettings.premium_settings.bonus_multiplier;
            }
            if (receivedSettings.premium_settings.daily_limit_boost_enabled === undefined) {
              receivedSettings.premium_settings.daily_limit_boost_enabled = !!receivedSettings.premium_settings.daily_limit_boost;
            }
            if (receivedSettings.premium_settings.reduced_difficulty_enabled === undefined) {
              receivedSettings.premium_settings.reduced_difficulty_enabled = !!receivedSettings.premium_settings.reduced_difficulty;
            }
            if (receivedSettings.premium_settings.mining_interval_hours_enabled === undefined) {
              receivedSettings.premium_settings.mining_interval_hours_enabled = !!receivedSettings.premium_settings.mining_interval_hours;
            }
            // Use default value for mining_reward_type if missing
            if (!receivedSettings.premium_settings.mining_reward_type) {
              receivedSettings.premium_settings.mining_reward_type = initialSettings.premium_settings.mining_reward_type;
            }
          }

          setSettings(receivedSettings);
        }
      } catch (err) {
        console.error("Error fetching mining settings:", err);
        // Keep initial settings if there's an error
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

  // Fixed handle change function to safely handle different input types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    
    try {
      if (target instanceof HTMLInputElement && target.type === 'checkbox') {
        setSettings(prev => ({
          ...prev,
          [name]: target.checked
        }));
      } else if (target instanceof HTMLInputElement && target.type === 'range') {
        const value = parseFloat(target.value);
        if (!isNaN(value)) {
          setSettings(prev => ({
            ...prev,
            [name]: value
          }));
        }
      } else if (target instanceof HTMLInputElement && target.type === 'number') {
        const value = parseFloat(target.value);
        if (!isNaN(value)) {
          setSettings(prev => ({
            ...prev,
            [name]: value
          }));
        }
      } else {
        setSettings(prev => ({
          ...prev,
          [name]: target.value
        }));
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      // Continue without updating if there's an error
    }
  };

  // Improved toggle handler with better type safety
  const handleToggle = (name: keyof MiningSettings) => {
    try {
      setSettings(prev => ({
        ...prev,
        [name]: !prev[name]
      }));
    } catch (err) {
      console.error("Error toggling setting:", err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
    
    try {
      // Send settings to backend API
      const response = await axios.put('/api/settings/mining', settings);
      
      if (response.data && response.data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(response.data?.message || "فشل تحديث إعدادات التعدين");
      }
    } catch (err: any) {
      console.error("Error saving mining settings:", err);
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
        const response = await axios.put('/api/settings/mining', updatedSettings);
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

  const handleFraudProtectionSettingsSave = (fraudSettings: FraudProtectionSettings) => {
    // تحديث الإعدادات محليًا
    const updatedSettings = {
      ...settings,
      fraud_protection_settings: fraudSettings
    };
    
    setSettings(updatedSettings);
    setIsFraudProtectionModalOpen(false);
    
    // إرسال الإعدادات المحدثة إلى الباك اند
    const saveSettings = async () => {
      setLoading(true);
      try {
        const response = await axios.put('/api/settings/mining', updatedSettings);
        if (response.data && response.data.success) {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
        } else {
          throw new Error(response.data?.message || "فشل تحديث إعدادات الحماية");
        }
      } catch (err: any) {
        console.error("Error saving fraud protection settings:", err);
        setError(err.message || "حدث خطأ أثناء حفظ إعدادات الحماية");
      } finally {
        setLoading(false);
      }
    };
    
    saveSettings();
  };

  // Prevent the component from rendering at all if settings is null or undefined
  if (!settings) return null;

  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#2d3748]/50 p-6 shadow-lg">
      {/* Header with gradient text */}
      <div className="mb-8 border-b border-[#2d3748] pb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          إعدادات التعدين
        </h2>
        <p className="text-gray-400 text-sm mt-1">ضبط معلمات وخصائص تعدين العملاء</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Maintenance Mode Toggle */}
          <div className={`p-5 rounded-xl border ${settings.maintenance_mode ? 'bg-red-900/20 border-red-500/30' : 'bg-[#0f172a] border-[#2d3748]'} transition-colors duration-300`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <Wrench size={24} className={settings.maintenance_mode ? "text-red-400" : "text-gray-500"} />
                <ToggleSwitch enabled={settings.maintenance_mode} onChange={() => handleToggle('maintenance_mode')} />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">وضع الصيانة</h3>
              <p className="text-gray-400 text-xs">تعطيل التعدين مؤقتًا لأعمال الصيانة</p>
              {settings.maintenance_mode && (
                <div className="mt-3 text-red-300 text-xs py-1 px-2 bg-red-900/20 rounded-md">
                  تحذير: هذا سيوقف عمليات التعدين لجميع المستخدمين
                </div>
              )}
            </div>
          </div>

          {/* Anti-Fraud Protection Toggle - NEW */}
          <div className={`p-5 rounded-xl border ${settings.anti_fraud_protection ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-[#0f172a] border-[#2d3748]'} transition-colors duration-300`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <Shield size={24} className={settings.anti_fraud_protection ? "text-indigo-400" : "text-gray-500"} />
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsFraudProtectionModalOpen(true)}
                    className="mr-2 p-1.5 rounded-md bg-[#2d3748] hover:bg-indigo-900/30 text-indigo-400 transition-colors"
                    aria-label="إعدادات الحماية"
                    title="إعدادات الحماية"
                  >
                    <Settings size={16} />
                  </button>
                <ToggleSwitch enabled={settings.anti_fraud_protection} onChange={() => handleToggle('anti_fraud_protection')} />
                </div>
              </div>
              <h3 className="text-white font-medium text-lg mb-1">حماية ضد الاحتيال</h3>
              <p className="text-gray-400 text-xs">منع التعدين المتكرر من نفس الجهاز أو IP</p>
              {settings.anti_fraud_protection && (
                <div className="mt-3 text-indigo-300 text-xs py-1 px-2 bg-indigo-900/20 rounded-md space-y-1">
                  <div>نشط: الحماية ضد الاستغلال مفعلة</div>
                  {settings.fraud_protection_settings?.accounts_per_ip_enabled && (
                    <div>
                      • حسابات لكل IP: {settings.fraud_protection_settings.accounts_per_ip}
                </div>
              )}
                  {settings.fraud_protection_settings?.accounts_per_device_enabled && (
                    <div>
                      • حسابات لكل جهاز: {settings.fraud_protection_settings.accounts_per_device}
                    </div>
                  )}
                  {settings.fraud_protection_settings?.penalty_enabled && (
                    <div>
                      • العقوبة: {
                        settings.fraud_protection_settings.penalty_type === 'permanent_ban' ? 'باند دائم' :
                        settings.fraud_protection_settings.penalty_type === 'warning_then_ban' ? 'تحذير ثم باند' :
                        settings.fraud_protection_settings.penalty_type === 'mining_suspension' ? 'حظر التعدين' :
                        'منع التعدين'
                      }
                    </div>
                  )}
                  {settings.fraud_protection_settings?.protection_level_enabled && (
                    <div>
                      • مستوى الحماية: {
                        settings.fraud_protection_settings.protection_level === 'low' ? 'منخفض' :
                        settings.fraud_protection_settings.protection_level === 'medium' ? 'متوسط' :
                        'عالي'
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Auto Mining Toggle */}
          <div className={`p-5 rounded-xl border ${settings.auto_mining_enabled ? 'bg-blue-900/20 border-blue-500/30' : 'bg-[#0f172a] border-[#2d3748]'} transition-colors duration-300`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <Cpu size={24} className={settings.auto_mining_enabled ? "text-blue-400" : "text-gray-500"} />
                <ToggleSwitch enabled={settings.auto_mining_enabled} onChange={() => handleToggle('auto_mining_enabled')} />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">التعدين التلقائي</h3>
              <p className="text-gray-400 text-xs">تمكين التعدين التلقائي للمستخدمين</p>
              {settings.auto_mining_enabled && (
                <div className="mt-3 text-blue-300 text-xs py-1 px-2 bg-blue-900/20 rounded-md">
                  نشط: التعدين التلقائي يعمل
                </div>
              )}
            </div>
          </div>

          {/* Premium Bonus Toggle with Settings Button */}
          <div className={`p-5 rounded-xl border ${settings.premium_bonus_enabled ? 'bg-green-900/20 border-green-500/30' : 'bg-[#0f172a] border-[#2d3748]'} transition-colors duration-300 relative`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <Star size={24} className={settings.premium_bonus_enabled ? "text-yellow-400" : "text-gray-500"} />
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="mr-2 p-1.5 rounded-md bg-[#2d3748] hover:bg-yellow-900/30 text-yellow-400 transition-colors"
                    aria-label="إعدادات بريميوم"
                    title="إعدادات بريميوم"
                  >
                    <Settings size={16} />
                  </button>
                  <ToggleSwitch enabled={!!settings.premium_bonus_enabled} onChange={() => handleToggle('premium_bonus_enabled')} />
                </div>
              </div>
              <h3 className="text-white font-medium text-lg mb-1">مكافآت بريميوم</h3>
              <p className="text-gray-400 text-xs">تمكين مكافآت خاصة للمستخدمين المميزين (بريميوم)</p>
              {settings.premium_bonus_enabled && settings.premium_settings && (
                <div className="mt-3 text-yellow-300 text-xs py-1 px-2 bg-yellow-900/20 rounded-md">
                  نشط: مكافآت بريميوم مفعلة (×{settings.premium_settings.bonus_multiplier})
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mining Rate Section */}
        <div className="bg-[#0f172a] p-6 rounded-xl border border-[#2d3748]">
          <h3 className="text-xl font-medium text-white mb-6 border-b border-[#2d3748]/50 pb-3 flex items-center">
            <BarChart size={20} className="text-purple-400 mr-2" />
            معدلات التعدين
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              {/* Daily Mining Rate */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium" htmlFor="daily_mining_rate">
                    معدل التعدين اليومي
                  </label>
                  <span className="text-purple-400 text-sm font-semibold">
                    {settings.daily_mining_rate} CRN
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    name="daily_mining_rate"
                    id="daily_mining_rate"
                    value={settings.daily_mining_rate}
                    onChange={handleChange}
                    className="w-full h-10 bg-[#2d3748] border border-[#4a5568] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    كمية العملات المسموح بتعدينها يوميًا (CRN)
                  </p>
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium" htmlFor="difficulty_level">
                    مستوى الصعوبة
                  </label>
                  <span className="text-purple-400 text-sm font-semibold">
                    {settings.difficulty_level}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    name="difficulty_level"
                    id="difficulty_level"
                    value={settings.difficulty_level}
                    onChange={handleChange}
                    className="w-full h-2 bg-[#2d3748] rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>سهل (1%)</span>
                    <span>متوسط (50%)</span>
                    <span>صعب (100%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Mining Session Hours */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium" htmlFor="mining_session_hours">
                    مدة جلسة التعدين (ساعات)
                  </label>
                  <span className="text-purple-400 text-sm font-semibold">
                    {settings.mining_session_hours} ساعة
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="72"
                    step="1"
                    name="mining_session_hours"
                    id="mining_session_hours"
                    value={settings.mining_session_hours}
                    onChange={handleChange}
                    className="w-full h-2 bg-[#2d3748] rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 ساعة</span>
                    <span>24 ساعة</span>
                    <span>72 ساعة (3 أيام)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  المدة التي يجب على المستخدم البقاء نشطًا فيها للحصول على المكافأة
                </p>
              </div>

              {/* Boosted Mining Toggle */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium">تعدين معزز لعطلة نهاية الأسبوع</label>
                  <ToggleSwitch 
                    enabled={settings.boosted_mining} 
                    onChange={() => handleToggle('boosted_mining')} 
                  />
                </div>
                <p className="text-xs text-gray-400">
                  مضاعفة معدل التعدين خلال عطلة نهاية الأسبوع (+100%)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Engagement Settings */}
        <div className="bg-[#0f172a] p-6 rounded-xl border border-[#2d3748]">
          <h3 className="text-xl font-medium text-white mb-6 border-b border-[#2d3748]/50 pb-3 flex items-center">
            <Users size={20} className="text-purple-400 mr-2" />
            إعدادات تفاعل المستخدمين
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              {/* Mining Reward Type */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-white font-medium" htmlFor="mining_reward_type">
                    نوع مكافأة التعدين
                  </label>
                </div>
                <select
                  name="mining_reward_type"
                  id="mining_reward_type"
                  value={settings.mining_reward_type}
                  onChange={handleChange}
                  className="w-full bg-[#2d3748] border border-[#4a5568] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="currency">عملة CRN فقط</option>
                  <option value="mixed">مختلط (نقاط + عملة)</option>
                </select>
                <p className="text-xs text-gray-400">
                  نوع المكافأة التي يحصل عليها المستخدمون من التعدين
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Empty space where the mining stats were */}
              <div className="p-3"></div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`py-2 px-4 rounded-lg flex items-center space-x-2 rtl:space-x-reverse ${
              loading ? 'bg-purple-700/50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors`}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin ml-2 rtl:mr-2" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save size={18} className="ml-2 rtl:mr-2" />
                <span>حفظ الإعدادات</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Premium Settings Modal */}
      <PremiumSettingsModal 
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        premiumSettings={settings.premium_settings}
        onSave={handlePremiumSettingsSave}
      />

      {/* Fraud Protection Modal */}
      <FraudProtectionModal 
        isOpen={isFraudProtectionModalOpen}
        onClose={() => setIsFraudProtectionModalOpen(false)}
        fraudSettings={settings.fraud_protection_settings}
        onSave={handleFraudProtectionSettingsSave}
      />
    </div>
  );
};

export default MiningSettings; 
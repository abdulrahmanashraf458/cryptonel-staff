import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Ban,
  UserCog,
  Trash2,
  RefreshCcw,
  Lock,
  Settings,
  KeyRound,
  Hash,
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  Mail,
  MapPin,
  AlertCircle,
  Loader,
  History,
  Cpu,
  ArrowLeftRight,
  Shield,
  Clock,
  Globe,
  Wifi,
  Star,
  Award,
  Users
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  // States
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [discordId, setDiscordId] = useState('');
  const [targetDiscordId, setTargetDiscordId] = useState('');
  const [reason, setReason] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [banAction, setBanAction] = useState<string | null>(null); // null means no option selected
  const [lockAction, setLockAction] = useState<string | null>(null); // null means no option selected
  const [blockTransfersAction, setBlockTransfersAction] = useState<string | null>(null); // null means no option selected
  const [blockMiningAction, setBlockMiningAction] = useState<string | null>(null); // null means no option selected
  const [accountType, setAccountType] = useState('');
  const [membershipType, setMembershipType] = useState<string | null>(null); // premium or standard
  const [isVerified, setIsVerified] = useState<string | null>(null); // verified or not
  const [isVIP, setIsVIP] = useState<string | null>(null); // yes or no
  const [email, setEmail] = useState(''); // for email editing
  const [privateAddress, setPrivateAddress] = useState(''); // for private address editing
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [searchBy, setSearchBy] = useState<'discord' | 'wallet'>('discord'); // Add this state
  const [walletId, setWalletId] = useState(''); // Add this state for wallet ID search
  
  // Add new state variables for security settings
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [geoLockEnabled, setGeoLockEnabled] = useState(false);
  const [timeBasedAccessEnabled, setTimeBasedAccessEnabled] = useState(false);
  
  // Add new state variables for partner and staff status
  const [isPartner, setIsPartner] = useState<string | null>(null); // 'yes' or 'no'
  const [isStaff, setIsStaff] = useState<string | null>(null); // 'yes' or 'no'
  
  // Reset form data
  const resetForm = () => {
    setDiscordId('');
    setTargetDiscordId('');
    setReason('');
    setTransactionId('');
    setBanAction(null);
    setLockAction(null);
    setBlockTransfersAction(null);
    setBlockMiningAction(null);
    setAccountType('');
    setMembershipType(null);
    setIsVerified(null);
    setIsVIP(null);
    setEmail('');
    setPrivateAddress('');
    setUserData(null);
    setWalletId(''); // Reset wallet ID
    setSearchBy('discord'); // Reset search type
  };
  
  // Go back to actions grid
  const goBack = () => {
    setActiveAction(null);
    resetForm();
  };

  // Get user info
  const fetchUserInfo = async (id: string, type: 'discord' | 'wallet' = 'discord') => {
    if (!id) return;
    
    setIsLoading(true);
    setTargetDiscordId(id);
    
    try {
      const response = await (type === 'discord' 
        ? api.user.getUserInfo(id)
        : api.user.getUserInfoByWalletId(id)
      );
      
      console.log('API Response:', response); // إضافة سجل للتصحيح
      
      if (response.data && response.data.success && response.data.user) {
        const userData = response.data.user;
        setUserData(userData);
        
        // Set security settings states based on user data
        if (userData.ip_whitelist) {
          setIpWhitelistEnabled(userData.ip_whitelist.enabled || false);
        }
        
        if (userData.geo_lock) {
          setGeoLockEnabled(userData.geo_lock.enabled || false);
        }
        
        if (userData.time_based_access) {
          setTimeBasedAccessEnabled(userData.time_based_access.enabled || false);
        }

        // تعيين حالات المستخدم وفقًا للبيانات المستلمة
        setIsVerified(userData.verified ? 'verified' : 'not_verified');
        setMembershipType(userData.premium ? 'premium' : 'standard');
        setIsVIP(userData.vip ? 'yes' : 'no');
        setIsPartner(userData.partner ? 'yes' : 'no');
        setIsStaff(userData.staff ? 'yes' : 'no');
        
        if (userData?.account_type) {
          setAccountType(userData.account_type);
        }
        
        // إذا كان لديه محفظة، أظهر معلوماتها
        if (userData?.wallet_id) {
          const discordId = userData.user_id;
          setDiscordId(discordId);
          // لا نغير الإجراء النشط هنا، بل نبقى على الإجراء الذي اختاره المستخدم
        } else {
          setUserData(null);
          toast.error('المستخدم ليس لديه محفظة');
        }
      } else {
        setUserData(null);
        toast.error('هذا المستخدم غير موجود في قاعدة البيانات');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      toast.error('هذا المستخدم غير موجود في قاعدة البيانات');
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // New function to handle search button click
  const handleUserSearch = () => {
    if (!reason) {
      toast.error('يجب إدخال سبب الإجراء');
      return;
    }
    
    if (searchBy === 'discord' && discordId) {
      fetchUserInfo(discordId, 'discord');
    } else if (searchBy === 'wallet' && walletId) {
      fetchUserInfo(walletId, 'wallet');
    } else {
      toast.error('الرجاء إدخال ' + (searchBy === 'discord' ? 'معرف ديسكورد' : 'معرف المحفظة'));
    }
  };

  // إضافة تسجيل العملية في السجل
  const logOperation = async (actionType: string, details: any) => {
    try {
      const timestamp = new Date().toISOString();
      const logData = {
        action_type: actionType,
        user_id: discordId || walletId,
        performed_by: user?.username || 'Unknown',
        performed_by_role: user?.role || 'Unknown',
        performed_by_avatar: user?.avatar || '',
        staff_id: user?.discord_id || '',
        reason: reason,
        details: details,
        timestamp: timestamp
      };

      console.log('Logging operation:', logData); // For debugging
      
      const response = await api.logs.addLog(logData);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to log operation');
      }
      
      // Refresh logs if we're on the logs page
      if (activeAction === 'logs') {
        // Trigger logs refresh
        const logsResponse = await api.logs.getLogs({
          page: 1,
          search: '',
          type: 'all'
        });
        // Update logs state if needed
      }
      
    } catch (error) {
      console.error('Error logging operation:', error);
      toast.error('تم تنفيذ العملية ولكن حدث خطأ في تسجيلها');
      throw error; // Re-throw to handle in the calling function
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error('يجب إدخال سبب الإجراء');
      return;
    }

    setIsLoading(true);
    
    try {
      let response;

      switch (activeAction) {
        case 'info':
          await logOperation('info', {
            user_id: discordId || walletId,
            search_type: searchBy,
            search_method: searchBy === 'discord' ? 'discord_id' : 'wallet_id'
          });
          toast.success('تم تسجيل عملية الفحص بنجاح');
          break;
        
        case 'disable2FA':
          if (!discordId) {
            toast.error('يجب إدخال معرف ديسكورد');
            return;
          }
          
          if (!userData) {
            toast.error('يجب البحث عن المستخدم أولاً والتأكد من وجوده');
            return;
          }
          
          if (!userData['2fa_activated']) {
            toast.error('المستخدم غير مفعل للتحقق الثنائي بالفعل');
            return;
          }
          
          response = await api.user.disable2FA(discordId);
          await logOperation('disable2FA', {
            user_id: discordId,
            previous_2fa_status: true,
            new_2fa_status: false
          });
          break;
          
        case 'transfer':
          if (!discordId || !targetDiscordId) {
            toast.error('يجب إدخال معرفات ديسكورد');
            return;
          }
          response = await api.wallet.transferFunds(discordId, targetDiscordId, 0);
          await logOperation('transfer', {
            from_user: discordId,
            to_user: targetDiscordId,
            amount: 0,
            status: 'completed'
          });
          break;
          
        case 'ban':
          if (!discordId || !banAction) {
            toast.error('يجب إدخال معرف ديسكورد ونوع الإجراء');
            return;
          }
          response = await api.user.banUser(discordId, banAction === 'ban');
          await logOperation(banAction, {
            user_id: discordId,
            ban_status: banAction === 'ban'
          });
          break;
          
        case 'delete':
          if (!discordId) {
            toast.error('يجب إدخال معرف ديسكورد');
            return;
          }
          response = await api.user.deleteUser(discordId);
          await logOperation('delete', {
            user_id: discordId,
            permanent: true
          });
          break;
          
        case 'lock':
          if (!discordId || !lockAction) {
            toast.error('يجب إدخال معرف ديسكورد ونوع الإجراء');
            return;
          }
          response = await api.wallet.toggleWalletLock(discordId, lockAction === 'lock');
          await logOperation(lockAction, {
            user_id: discordId,
            lock_status: lockAction === 'lock'
          });
          break;
          
        case 'blockTransfers':
          if (!discordId || !blockTransfersAction) {
            toast.error('يجب إدخال معرف ديسكورد ونوع الإجراء');
            return;
          }
          // استخدام API الجديدة
          response = await api.wallet.toggleTransfersBlock(discordId, blockTransfersAction === 'block');
          await logOperation(blockTransfersAction, {
            user_id: discordId,
            feature: 'transfers',
            block_status: blockTransfersAction === 'block'
          });
          break;
          
        case 'blockMining':
          if (!discordId || !blockMiningAction) {
            toast.error('يجب إدخال معرف ديسكورد ونوع الإجراء');
            return;
          }
          // استخدام API الجديدة
          response = await api.wallet.toggleMiningBlock(discordId, blockMiningAction === 'block');
          await logOperation(blockMiningAction, {
            user_id: discordId,
            feature: 'mining',
            block_status: blockMiningAction === 'block'
          });
          break;
          
        case 'edit':
          if (!discordId) {
            toast.error('يجب إدخال معرف ديسكورد');
            return;
          }
          if (!email && !privateAddress) {
            toast.error('يجب إدخال البريد الإلكتروني أو العنوان الخاص الجديد');
            return;
          }
          response = await api.user.updateMainData(discordId, email, privateAddress);
          await logOperation('edit', {
            user_id: discordId,
            updated_fields: {
              email: email || undefined,
              private_address: privateAddress || undefined
            }
          });
          break;
          
        case 'status':
          if (!discordId) {
            toast.error('يجب إدخال معرف ديسكورد');
            return;
          }
          
          const statusData: any = {};
          if (isVerified) statusData.verified = isVerified === 'verified';
          if (isVIP) statusData.vip = isVIP === 'yes';
          if (membershipType) {
            statusData.premium = membershipType === 'premium';
            statusData.membership = membershipType === 'premium' ? 'Premium' : 'Standard';
          }
          if (accountType) statusData.account_type = accountType;
          if (isPartner) statusData.partner = isPartner === 'yes';
          if (isStaff) statusData.staff = isStaff === 'yes';
          
          response = await api.user.updateAccountStatus(discordId, statusData);
          await logOperation('status', {
            user_id: discordId,
            status_changes: statusData
          });
          break;

        case 'refund':
          if (!discordId || !targetDiscordId) {
            toast.error('يجب إدخال معرفات ديسكورد');
            return;
          }
          response = await api.wallet.transferFunds(discordId, targetDiscordId, 0);
          await logOperation('refund', {
            from_user: discordId,
            to_user: targetDiscordId,
            amount: 0
          });
          break;

        case 'securitySettings':
          // Security settings are handled directly by their specific buttons
          // No need for a general submit action
          setIsLoading(false);
          return;

        default:
          toast.error('إجراء غير معروف');
          setIsLoading(false);
          return;
      }
      
      toast.success(response?.data?.message || 'تم تنفيذ العملية بنجاح');
      goBack();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء تنفيذ العملية');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effect to fetch user info when ID is changed and action is info, edit or status
  useEffect(() => {
    // فقط إذا كان الإجراء بحاجة لمعلومات المستخدم، نقوم بجلبها
    if (discordId && (
      activeAction === 'edit' || 
      activeAction === 'status' || 
      activeAction === 'disable2FA'
    )) {
      // نستعلم عن بيانات المستخدم بدون تغيير الإجراء النشط
      const fetchData = async () => {
        try {
          const response = await api.user.getUserInfo(discordId);
          if (response.data?.success && response.data?.user) {
            setUserData(response.data.user);
          }
        } catch (error) {
          console.error('Error fetching user info in useEffect:', error);
        }
      };
      
      fetchData();
    }
  }, [discordId, activeAction]);

  // Effect to show current status when userData is loaded for status action
  useEffect(() => {
    if (activeAction === 'status' && userData) {
      // Show current status in a toast
      toast.success(
        `حالة المستخدم الحالية: ${userData.premium ? 'بريميوم' : 'غير بريميوم'} | العضوية: ${userData.membership}`,
        { duration: 5000 }
      );
    }
  }, [userData, activeAction]);

  // Action cards data
  const walletActions = {
    support: [
      { 
        id: 'ban', 
        title: 'حظر/فك حظر المستخدم', 
        description: 'حظر أو فك حظر مستخدم',
        icon: Ban, 
        color: 'bg-red-500', 
        textColor: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20'
      },
      { 
        id: 'lock', 
        title: 'قفل/فتح المحفظة', 
        description: 'قفل أو فتح محفظة المستخدم',
        icon: Lock, 
        color: 'bg-yellow-500', 
        textColor: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20'
      },
      { 
        id: 'info', 
        title: 'فحص معلومات المستخدم', 
        description: 'بحث وعرض بيانات المستخدم',
        icon: UserCog, 
        color: 'bg-blue-500', 
        textColor: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20'
      },
      { 
        id: 'disable2FA', 
        title: 'إلغاء التحقق الثنائي', 
        description: 'إلغاء تفعيل خاصية التحقق الثنائي للمستخدم',
        icon: Shield, 
        color: 'bg-emerald-500', 
        textColor: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20'
      },
      { 
        id: 'blockTransfers', 
        title: 'حظر/فك حظر التحويلات', 
        description: 'منع أو السماح بعمليات التحويل للمستخدم',
        icon: ArrowLeftRight, 
        color: 'bg-purple-500', 
        textColor: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20'
      },
      { 
        id: 'blockMining', 
        title: 'حظر/فك حظر التعدين', 
        description: 'منع أو السماح بعمليات التعدين للمستخدم',
        icon: Cpu, 
        color: 'bg-teal-500', 
        textColor: 'text-teal-500',
        bgColor: 'bg-teal-500/10',
        borderColor: 'border-teal-500/20'
      },
      { 
        id: 'securitySettings', 
        title: 'إدارة إعدادات الأمان', 
        description: 'إلغاء تفعيل ميزات الأمان المتقدمة',
        icon: Shield, 
        color: 'bg-indigo-500', 
        textColor: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20'
      }
    ],
    moderator: [
      { 
        id: 'refund', 
        title: 'استرداد التحويل', 
        description: 'استرداد عملية تحويل',
        icon: RefreshCcw, 
        color: 'bg-green-500', 
        textColor: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20'
      },
      { 
        id: 'delete', 
        title: 'حذف المستخدم', 
        description: 'حذف بيانات المستخدم',
        icon: Trash2, 
        color: 'bg-purple-500', 
        textColor: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20'
      },
      { 
        id: 'transfer', 
        title: 'تحويل المحفظة', 
        description: 'نقل محفظة من مستخدم إلى آخر',
        icon: Wallet, 
        color: 'bg-orange-500', 
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20'
      }
    ],
    admin: [
      { 
        id: 'edit', 
        title: 'تعديل البيانات الرئيسية', 
        description: 'تغيير البيانات الرئيسية للمستخدم',
        icon: KeyRound, 
        color: 'bg-teal-500', 
        textColor: 'text-teal-500',
        bgColor: 'bg-teal-500/10',
        borderColor: 'border-teal-500/20'
      },
      { 
        id: 'status', 
        title: 'إدارة حالة الحساب', 
        description: 'تعديل نوع الحساب والصلاحية وحالة التوثيق',
        icon: Settings, 
        color: 'bg-indigo-500', 
        textColor: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20'
      }
    ]
  };

  // Get current action data
  const getActionById = (id: string) => {
    const allActions = [
      ...walletActions.support,
      ...walletActions.moderator,
      ...walletActions.admin
    ];
    return allActions.find(action => action.id === id);
  };

  const currentAction = getActionById(activeAction || '');

  // Check user permissions
  const hasPermission = (section: 'support' | 'moderator' | 'admin') => {
    if (!user || !user.role) return false;
    
    // Founder has access to everything
    if (user.role === 'founder') {
      return true;
    }
    
    // Support role can only access the support section
    if (user.role === 'support') {
      return section === 'support';
    }
    
    // Supervisor role can access support and moderator sections but not admin
    if (user.role === 'supervisor') {
      return section === 'support' || section === 'moderator';
    }
    
    // General manager and manager can access all sections
    if (user.role === 'general_manager' || user.role === 'manager') {
      return true;
    }
    
    // Default for other roles - no access
    return false;
  };

  // Render the action form based on active action
  const renderActionForm = () => {
    const actionTitle = currentAction?.title || '';
    const actionDescription = currentAction?.description || '';
    const actionIcon = currentAction?.icon || Wallet;
    const actionColor = currentAction?.textColor || '';
    const IconComponent = actionIcon;

    // Common form field styles
    const inputGroupClass = "mb-5";
    const labelClass = "block text-white text-right mb-2";
    const inputWrapperClass = "flex items-center bg-[#1e293b] rounded-lg p-3 border border-[#2d3748]";
    const inputClass = "bg-transparent text-right w-full outline-none text-white";
    
    // Security Settings action form
    if (activeAction === 'securitySettings') {
      return (
        <div>
          {/* Search Options */}
          <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#3e4c6a] mb-6">
            <h3 className="text-xl font-bold text-white mb-6 text-right">إدارة إعدادات الأمان المتقدمة</h3>
            
            <div className="mb-6">
              <div className="flex justify-between border-b border-gray-700 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <label 
                    className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${searchBy === 'discord' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                    onClick={() => setSearchBy('discord')}
                  >
                    <input 
                      type="radio" 
                      className="hidden" 
                      name="searchType" 
                      checked={searchBy === 'discord'} 
                      onChange={() => setSearchBy('discord')}
                    />
                    بحث بمعرف ديسكورد
                  </label>
                  
                  <label 
                    className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${searchBy === 'wallet' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                    onClick={() => setSearchBy('wallet')}
                  >
                    <input 
                      type="radio" 
                      className="hidden" 
                      name="searchType" 
                      checked={searchBy === 'wallet'} 
                      onChange={() => setSearchBy('wallet')}
                    />
                    بحث بمعرف المحفظة
                  </label>
                </div>
              </div>
            
              {searchBy === 'discord' ? (
                <div>
                  <label className="text-white text-lg font-medium block text-right mb-3">أدخل معرف ديسكورد:</label>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUserSearch}
                      disabled={isLoading || !discordId || !reason}
                      className={`px-6 py-3 rounded-lg font-bold text-white flex-shrink-0 flex items-center justify-center ${isLoading || !discordId || !reason ? 'bg-gray-700 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}
                    >
                      <UserCog className="ml-2" size={20} />
                      بحث
                    </button>
                    <div className="flex-1 bg-[#111827] rounded-lg border border-gray-700 overflow-hidden">
                      <input
                        type="text"
                        value={discordId}
                        onChange={(e) => setDiscordId(e.target.value)}
                        placeholder="أدخل معرف ديسكورد هنا..."
                        className="w-full h-full px-4 py-3 bg-transparent text-white text-right outline-none"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-white text-lg font-medium block text-right mb-3">أدخل معرف المحفظة:</label>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUserSearch}
                      disabled={isLoading || !walletId || !reason}
                      className={`px-6 py-3 rounded-lg font-bold text-white flex-shrink-0 flex items-center justify-center ${isLoading || !walletId || !reason ? 'bg-gray-700 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}
                    >
                      <Wallet className="ml-2" size={20} />
                      بحث
                    </button>
                    <div className="flex-1 bg-[#111827] rounded-lg border border-gray-700 overflow-hidden">
                      <input
                        type="text"
                        value={walletId}
                        onChange={(e) => setWalletId(e.target.value)}
                        placeholder="أدخل معرف المحفظة هنا..."
                        className="w-full h-full px-4 py-3 bg-transparent text-white text-right outline-none"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* حقل سبب الإجراء - إجباري */}
              <div className="mt-4">
                <label className="text-white text-lg font-medium block text-right mb-3">سبب الإجراء:</label>
                <div className="bg-[#111827] rounded-lg border border-gray-700 overflow-hidden">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="أدخل سبب الإجراء هنا..."
                    className="w-full px-4 py-3 bg-transparent text-white text-right outline-none"
                    disabled={isLoading}
                    required
                  />
                </div>
                {!reason && (
                  <p className="text-red-500 text-sm mt-2 text-right">* سبب الإجراء مطلوب</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Security Settings Display */}
          {userData ? (
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#3e4c6a]">
              <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium`}>
                    إعدادات الأمان
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">إعدادات الأمان المتقدمة</h3>
              </div>
              
              <div className="space-y-6">
                {/* IP Whitelist */}
                <div className="bg-[#111827] p-5 rounded-xl border border-[#2d3748]">
                  <div className="flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => handleSecuritySettingUpdate('ip_whitelist', false)}
                        disabled={!ipWhitelistEnabled || isLoading}
                        className={`px-4 py-2 rounded-lg font-medium ${!ipWhitelistEnabled || isLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                      >
                        {isLoading ? (
                          <Loader size={16} className="animate-spin"/>
                        ) : (
                          'إلغاء التفعيل'
                        )}
                      </button>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-3 text-right">
                        <h4 className="font-bold text-lg text-white">قائمة IP المسموح بها</h4>
                        <p className="text-gray-400 text-sm">تقييد الوصول إلى المحفظة بعناوين IP محددة فقط</p>
                      </div>
                      <div className={`p-3 rounded-lg ${ipWhitelistEnabled ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
                        <Wifi className={ipWhitelistEnabled ? 'text-green-400' : 'text-gray-400'} size={24} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-end border p-2 px-4 rounded-lg border-gray-700">
                      <span className="font-medium text-white">الحالة:</span>
                      <span className={`mr-2 py-1 px-3 rounded-lg text-sm ${ipWhitelistEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {ipWhitelistEnabled ? 'مفعل' : 'غير مفعل'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Geo Lock */}
                <div className="bg-[#111827] p-5 rounded-xl border border-[#2d3748]">
                  <div className="flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => handleSecuritySettingUpdate('geo_lock', false)}
                        disabled={!geoLockEnabled || isLoading}
                        className={`px-4 py-2 rounded-lg font-medium ${!geoLockEnabled || isLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                      >
                        {isLoading ? (
                          <Loader size={16} className="animate-spin"/>
                        ) : (
                          'إلغاء التفعيل'
                        )}
                      </button>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-3 text-right">
                        <h4 className="font-bold text-lg text-white">قفل الموقع الجغرافي</h4>
                        <p className="text-gray-400 text-sm">تقييد الوصول إلى المحفظة من بلدان محددة فقط</p>
                      </div>
                      <div className={`p-3 rounded-lg ${geoLockEnabled ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
                        <Globe className={geoLockEnabled ? 'text-green-400' : 'text-gray-400'} size={24} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-end border p-2 px-4 rounded-lg border-gray-700">
                      <span className="font-medium text-white">الحالة:</span>
                      <span className={`mr-2 py-1 px-3 rounded-lg text-sm ${geoLockEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {geoLockEnabled ? 'مفعل' : 'غير مفعل'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Time-based Access */}
                <div className="bg-[#111827] p-5 rounded-xl border border-[#2d3748]">
                  <div className="flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => handleSecuritySettingUpdate('time_based_access', false)}
                        disabled={!timeBasedAccessEnabled || isLoading}
                        className={`px-4 py-2 rounded-lg font-medium ${!timeBasedAccessEnabled || isLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                      >
                        {isLoading ? (
                          <Loader size={16} className="animate-spin"/>
                        ) : (
                          'إلغاء التفعيل'
                        )}
                      </button>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-3 text-right">
                        <h4 className="font-bold text-lg text-white">قيود الوصول الزمنية</h4>
                        <p className="text-gray-400 text-sm">تقييد الوصول إلى المحفظة خلال فترات زمنية محددة</p>
                      </div>
                      <div className={`p-3 rounded-lg ${timeBasedAccessEnabled ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
                        <Clock className={timeBasedAccessEnabled ? 'text-green-400' : 'text-gray-400'} size={24} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-end border p-2 px-4 rounded-lg border-gray-700">
                      <span className="font-medium text-white">الحالة:</span>
                      <span className={`mr-2 py-1 px-3 rounded-lg text-sm ${timeBasedAccessEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {timeBasedAccessEnabled ? 'مفعل' : 'غير مفعل'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* User Info Summary */}
                <div className="bg-[#111827] p-4 rounded-lg mt-6">
                  <div className="flex justify-between items-center">
                    <p className="text-white font-bold">{userData.username || 'غير متوفر'}</p>
                    <p className="text-gray-400 text-sm">اسم المستخدم</p>
                  </div>
                </div>
                
                <div className="bg-[#111827] p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-white font-bold" dir="ltr">{userData.user_id || 'غير متوفر'}</p>
                    <p className="text-gray-400 text-sm">معرف ديسكورد</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="bg-[#1e293b] rounded-xl p-6 border border-[#3e4c6a] text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <Shield size={60} className="text-gray-500 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد بيانات للعرض</h3>
                  <p className="text-gray-400">قم بإدخال معرف للبحث عن إعدادات أمان المستخدم</p>
                </div>
              </div>
            )
          )}
          
          {/* Submit button - for any bulk actions that might be added later */}
          <div className="flex justify-end mt-8">
            <button 
              type="button" 
              onClick={goBack} 
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2.5 rounded-lg text-white font-medium mr-3 transition-colors"
              disabled={isLoading}
            >
              عودة
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="py-6 px-4">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button 
              onClick={goBack}
              className="flex items-center text-gray-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold">{actionTitle}</h1>
              <p className="text-gray-400">{actionDescription}</p>
            </div>
            <div className={`w-10 h-10 rounded-full ${currentAction?.bgColor} flex items-center justify-center`}>
              <IconComponent className={actionColor} size={20} />
            </div>
          </div>
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center my-6">
              <div className="flex items-center space-x-2">
                <Loader size={24} className="animate-spin text-blue-500" />
                <span className="text-white">جارٍ التحميل...</span>
              </div>
            </div>
          )}
          
          {/* Info action form */}
          {activeAction === 'info' && (
            <div>
              {/* Search Options */}
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#3e4c6a] mb-6">
                <h3 className="text-xl font-bold text-white mb-6 text-right">البحث عن معلومات المستخدم</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between border-b border-gray-700 pb-4 mb-5">
                    <div className="flex items-center gap-2">
                      <label 
                        className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${searchBy === 'discord' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                        onClick={() => setSearchBy('discord')}
                      >
                        <input 
                          type="radio" 
                          className="hidden" 
                          name="searchType" 
                          checked={searchBy === 'discord'} 
                          onChange={() => setSearchBy('discord')}
                        />
                        بحث بمعرف ديسكورد
                      </label>
                      
                      <label 
                        className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${searchBy === 'wallet' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                        onClick={() => setSearchBy('wallet')}
                      >
                        <input 
                          type="radio" 
                          className="hidden" 
                          name="searchType" 
                          checked={searchBy === 'wallet'} 
                          onChange={() => setSearchBy('wallet')}
                        />
                        بحث بمعرف المحفظة
                      </label>
                    </div>
                  </div>
                
                  {searchBy === 'discord' ? (
                    <div>
                      <label className="text-white text-lg font-medium block text-right mb-3">أدخل معرف ديسكورد:</label>
                      <div className="flex gap-3">
                        <button
                          onClick={handleUserSearch}
                          disabled={isLoading || !discordId || !reason}
                          className={`px-6 py-3 rounded-lg font-bold text-white flex-shrink-0 flex items-center justify-center ${isLoading || !discordId || !reason ? 'bg-gray-700 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}
                        >
                          <UserCog className="ml-2" size={20} />
                          بحث
                        </button>
                        <div className="flex-1 bg-[#111827] rounded-lg border border-gray-700 overflow-hidden">
                          <input
                            type="text"
                            value={discordId}
                            onChange={(e) => setDiscordId(e.target.value)}
                            placeholder="أدخل معرف ديسكورد هنا..."
                            className="w-full h-full px-4 py-3 bg-transparent text-white text-right outline-none"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-white text-lg font-medium block text-right mb-3">أدخل معرف المحفظة:</label>
                      <div className="flex gap-3">
                        <button
                          onClick={handleUserSearch}
                          disabled={isLoading || !walletId || !reason}
                          className={`px-6 py-3 rounded-lg font-bold text-white flex-shrink-0 flex items-center justify-center ${isLoading || !walletId || !reason ? 'bg-gray-700 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}
                        >
                          <Wallet className="ml-2" size={20} />
                          بحث
                        </button>
                        <div className="flex-1 bg-[#111827] rounded-lg border border-gray-700 overflow-hidden">
                          <input
                            type="text"
                            value={walletId}
                            onChange={(e) => setWalletId(e.target.value)}
                            placeholder="أدخل معرف المحفظة هنا..."
                            className="w-full h-full px-4 py-3 bg-transparent text-white text-right outline-none"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* حقل سبب الإجراء - إجباري */}
                  <div className="mt-4">
                    <label className="text-white text-lg font-medium block text-right mb-3">سبب الإجراء:</label>
                    <div className="bg-[#111827] rounded-lg border border-gray-700 overflow-hidden">
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="أدخل سبب الإجراء هنا..."
                        className="w-full px-4 py-3 bg-transparent text-white text-right outline-none"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    {!reason && (
                      <p className="text-red-500 text-sm mt-2 text-right">* سبب الإجراء مطلوب</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Results Display */}
              {userData ? (
                <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#3e4c6a]">
                  <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full ${userData.membership === 'Premium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'} text-sm font-medium`}>
                        {userData.membership}
                      </span>
                      {userData.profile_hidden && (
                        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                          الملف الشخصي مخفي
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white">معلومات المستخدم</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Basic Info */}
                    <div className="space-y-4">
                      <div className="bg-[#111827] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-bold text-lg truncate" dir="ltr">{userData.user_id || 'غير متوفر'}</p>
                          <p className="text-gray-400 text-sm">معرف ديسكورد</p>
                        </div>
                      </div>
                      
                      <div className="bg-[#111827] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-bold text-lg truncate">{userData.username || 'غير متوفر'}</p>
                          <p className="text-gray-400 text-sm">اسم المستخدم</p>
                        </div>
                      </div>
                      
                      <div className="bg-[#111827] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-bold text-lg truncate">{userData.email || 'غير متوفر'}</p>
                          <p className="text-gray-400 text-sm">البريد الإلكتروني</p>
                        </div>
                      </div>
                      
                      {!userData.profile_hidden ? (
                        <div className="bg-[#111827] p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-bold text-lg truncate">{userData.balance || '0'}</p>
                            <p className="text-gray-400 text-sm">الرصيد</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#111827] p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-red-400 font-bold text-lg">الرصيد مخفي</p>
                            <p className="text-gray-400 text-sm">الرصيد</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-[#111827] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-bold text-lg truncate">{userData.created_at || 'غير متوفر'}</p>
                          <p className="text-gray-400 text-sm">تاريخ الإنشاء</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Wallet Info */}
                    <div className="space-y-4">
                      <div className="bg-[#111827] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-bold text-lg break-all" dir="ltr">{userData.wallet_id || 'غير متوفر'}</p>
                          <p className="text-gray-400 text-sm">معرف المحفظة</p>
                        </div>
                      </div>
                      
                      {!userData.profile_hidden ? (
                        <>
                          <div className="bg-[#111827] p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-white font-bold text-lg break-all" dir="ltr">{userData.public_address || 'غير متوفر'}</p>
                              <p className="text-gray-400 text-sm">العنوان العام</p>
                            </div>
                          </div>
                          
                          <div className="bg-[#111827] p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-white font-bold text-lg break-all" dir="ltr">{userData.private_address || 'غير متوفر'}</p>
                              <p className="text-gray-400 text-sm">العنوان الخاص</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-[#111827] p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-red-400 font-bold text-lg">العنوان مخفي</p>
                              <p className="text-gray-400 text-sm">العنوان العام</p>
                            </div>
                          </div>
                          
                          <div className="bg-[#111827] p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-red-400 font-bold text-lg">العنوان مخفي</p>
                              <p className="text-gray-400 text-sm">العنوان الخاص</p>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Status Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#111827] p-4 rounded-lg text-center">
                          <p className="text-gray-400 text-sm mb-1">التحقق الثنائي</p>
                          <p className={`font-bold text-lg ${userData['2fa_activated'] ? 'text-green-400' : 'text-red-400'}`}>
                            {userData['2fa_activated'] ? 'مفعل' : 'غير مفعل'}
                          </p>
                        </div>
                        
                        <div className="bg-[#111827] p-4 rounded-lg text-center">
                          <p className="text-gray-400 text-sm mb-1">حالة التوثيق</p>
                          <p className={`font-bold text-lg ${userData.verified ? 'text-green-400' : 'text-red-400'}`}>
                            {userData.verified ? 'موثق' : 'غير موثق'}
                          </p>
                        </div>
                        
                        <div className="bg-[#111827] p-4 rounded-lg text-center">
                          <p className="text-gray-400 text-sm mb-1">VIP</p>
                          <p className={`font-bold text-lg ${userData.vip ? 'text-green-400' : 'text-red-400'}`}>
                            {userData.vip ? 'نعم' : 'لا'}
                          </p>
                        </div>
                        
                        <div className="bg-[#111827] p-4 rounded-lg text-center">
                          <p className="text-gray-400 text-sm mb-1">حالة الحظر</p>
                          <p className={`font-bold text-lg ${userData.ban ? 'text-red-400' : 'text-green-400'}`}>
                            {userData.ban ? 'محظور' : 'غير محظور'}
                          </p>
                        </div>
                        
                        <div className="bg-[#111827] p-4 rounded-lg text-center">
                          <p className="text-gray-400 text-sm mb-1">نوع الحساب</p>
                          <p className="text-white font-bold text-lg">{userData.account_type || 'غير محدد'}</p>
                        </div>
                        
                        <div className="bg-[#111827] p-4 rounded-lg text-center">
                          <p className="text-gray-400 text-sm mb-1">حالة المحفظة</p>
                          <p className={`font-bold text-lg ${userData.wallet_lock ? 'text-red-400' : 'text-green-400'}`}>
                            {userData.wallet_lock ? 'مقفلة' : 'مفتوحة'}
                          </p>
                        </div>
                        
                        <div className="bg-[#111827] p-4 rounded-lg text-center">
                          <p className="text-gray-400 text-sm mb-1">حالة التحويلات</p>
                          <p className={`font-bold text-lg ${userData.transfers_block ? 'text-red-400' : 'text-green-400'}`}>
                            {userData.transfers_block ? 'محظورة' : 'مسموحة'}
                          </p>
                        </div>
                        
                        <div className="bg-[#111827] p-4 rounded-lg text-center">
                          <p className="text-gray-400 text-sm mb-1">حالة التعدين</p>
                          <p className={`font-bold text-lg ${userData.mining_block ? 'text-red-400' : 'text-green-400'}`}>
                            {userData.mining_block ? 'محظور' : 'مسموح'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                !isLoading && (
                  <div className="bg-[#1e293b] rounded-xl p-6 border border-[#3e4c6a] text-center">
                    <div className="flex flex-col items-center justify-center py-6">
                      <UserCog size={60} className="text-gray-500 mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">لا توجد بيانات للعرض</h3>
                      <p className="text-gray-400">قم بإدخال معرف للبحث عن معلومات المستخدم</p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
          
          {/* Form for other actions */}
          {activeAction !== 'info' && (
            <form onSubmit={handleSubmit} dir="rtl">
              {activeAction === 'transfer' && (
                <>
                  <p className="text-gray-400 mb-4 text-right">هذه الصفحة تستخدم لتبديل محفظة قديمة بمحفظة جديدة لنفس الشخص</p>
                  <div className={inputGroupClass}>
                    <label className={labelClass}>id الحساب القديم</label>
                    <div className={inputWrapperClass}>
                      <Hash size={20} className="text-gray-400 ml-2" />
                      <input
                        type="text"
                        value={discordId}
                        onChange={(e) => setDiscordId(e.target.value)}
                        placeholder="أدخل معرف ديسكورد"
                        className={inputClass}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className={inputGroupClass}>
                    <label className={labelClass}>id الحساب الجديد</label>
                    <div className={inputWrapperClass}>
                      <Hash size={20} className="text-gray-400 ml-2" />
                      <input
                        type="text"
                        value={targetDiscordId}
                        onChange={(e) => setTargetDiscordId(e.target.value)}
                        placeholder="أدخل معرف ديسكورد"
                        className={inputClass}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className={inputGroupClass}>
                    <label className={labelClass}>سبب التحويل</label>
                    <div className={inputWrapperClass}>
                      <MessageSquare size={20} className="text-gray-400 ml-2" />
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="أدخل سبب التحويل"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </>
              )}

              {(activeAction === 'ban' || activeAction === 'delete' || 
                activeAction === 'lock' || activeAction === 'status' || 
                activeAction === 'edit' || activeAction === 'blockTransfers' || 
                activeAction === 'blockMining' || activeAction === 'disable2FA') && (
                <>
                  {activeAction === 'ban' && (
                    <>
                      <p className="text-gray-400 mb-4 text-right">هذه الصفحة تستخدم لحظر مستخدم أو إلغاء الحظر عنه</p>
                      <div className={inputGroupClass}>
                        <label className={labelClass}>نوع الإجراء</label>
                        <div className="flex flex-col gap-3 mb-2 mt-2">
                          <div className="flex items-center justify-end">
                            <span className="text-white mr-3">حظر المستخدم</span>
                            <div 
                              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${banAction === 'ban' ? 'bg-amber-500' : 'bg-gray-700'}`}
                              onClick={() => setBanAction(banAction === 'ban' ? null : 'ban')}
                            >
                              <div 
                                className={`absolute top-1 ${banAction === 'ban' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end">
                            <span className="text-white mr-3">إلغاء حظر المستخدم</span>
                            <div 
                              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${banAction === 'unban' ? 'bg-amber-500' : 'bg-gray-700'}`}
                              onClick={() => setBanAction(banAction === 'unban' ? null : 'unban')}
                            >
                              <div 
                                className={`absolute top-1 ${banAction === 'unban' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeAction === 'lock' && (
                    <>
                      <p className="text-gray-400 mb-4 text-right">هذه الصفحة تستخدم لقفل محفظة المستخدم أو فتحها</p>
                      <div className={inputGroupClass}>
                        <label className={labelClass}>نوع الإجراء</label>
                        <div className="flex flex-col gap-3 mb-2 mt-2">
                          <div className="flex items-center justify-end">
                            <span className="text-white mr-3">قفل المحفظة</span>
                            <div 
                              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${lockAction === 'lock' ? 'bg-amber-500' : 'bg-gray-700'}`}
                              onClick={() => setLockAction(lockAction === 'lock' ? null : 'lock')}
                            >
                              <div 
                                className={`absolute top-1 ${lockAction === 'lock' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end">
                            <span className="text-white mr-3">فتح المحفظة</span>
                            <div 
                              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${lockAction === 'unlock' ? 'bg-amber-500' : 'bg-gray-700'}`}
                              onClick={() => setLockAction(lockAction === 'unlock' ? null : 'unlock')}
                            >
                              <div 
                                className={`absolute top-1 ${lockAction === 'unlock' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {activeAction === 'blockTransfers' && (
                    <>
                      <p className="text-gray-400 mb-4 text-right">هذه الصفحة تستخدم لحظر أو فك حظر التحويلات للمستخدم</p>
                      <div className={inputGroupClass}>
                        <label className={labelClass}>نوع الإجراء</label>
                        <div className="flex flex-col gap-3 mb-2 mt-2">
                          <div className="flex items-center justify-end">
                            <span className="text-white mr-3">حظر التحويلات</span>
                            <div 
                              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${blockTransfersAction === 'block' ? 'bg-amber-500' : 'bg-gray-700'}`}
                              onClick={() => setBlockTransfersAction(blockTransfersAction === 'block' ? null : 'block')}
                            >
                              <div 
                                className={`absolute top-1 ${blockTransfersAction === 'block' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end">
                            <span className="text-white mr-3">فك حظر التحويلات</span>
                            <div 
                              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${blockTransfersAction === 'unblock' ? 'bg-amber-500' : 'bg-gray-700'}`}
                              onClick={() => setBlockTransfersAction(blockTransfersAction === 'unblock' ? null : 'unblock')}
                            >
                              <div 
                                className={`absolute top-1 ${blockTransfersAction === 'unblock' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {activeAction === 'blockMining' && (
                    <>
                      <p className="text-gray-400 mb-4 text-right">هذه الصفحة تستخدم لحظر أو فك حظر التعدين للمستخدم</p>
                      <div className={inputGroupClass}>
                        <label className={labelClass}>نوع الإجراء</label>
                        <div className="flex flex-col gap-3 mb-2 mt-2">
                          <div className="flex items-center justify-end">
                            <span className="text-white mr-3">حظر التعدين</span>
                            <div 
                              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${blockMiningAction === 'block' ? 'bg-amber-500' : 'bg-gray-700'}`}
                              onClick={() => setBlockMiningAction(blockMiningAction === 'block' ? null : 'block')}
                            >
                              <div 
                                className={`absolute top-1 ${blockMiningAction === 'block' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end">
                            <span className="text-white mr-3">فك حظر التعدين</span>
                            <div 
                              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${blockMiningAction === 'unblock' ? 'bg-amber-500' : 'bg-gray-700'}`}
                              onClick={() => setBlockMiningAction(blockMiningAction === 'unblock' ? null : 'unblock')}
                            >
                              <div 
                                className={`absolute top-1 ${blockMiningAction === 'unblock' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeAction === 'disable2FA' && (
                    <>
                      <p className="text-gray-400 mb-4 text-right">هذه الصفحة تستخدم لإلغاء تفعيل التحقق الثنائي للمستخدم</p>
                      <div className="bg-[#1e293b] rounded-xl p-5 mb-6 border border-[#2d3748]">
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-2">🛡️</span>
                          <h3 className="text-white text-xl font-bold">إلغاء التحقق الثنائي</h3>
                        </div>
                        
                        {userData ? (
                          <div className="mb-6">
                            <div className="flex justify-between items-center bg-[#111827] p-4 rounded-lg mb-4">
                              <p className="text-white font-bold text-lg">{userData.username || 'غير متوفر'}</p>
                              <p className="text-gray-400 text-sm">اسم المستخدم</p>
                            </div>
                            
                            <div className="flex justify-between items-center bg-[#111827] p-4 rounded-lg mb-4">
                              <p className={`font-bold text-lg ${userData['2fa_activated'] ? 'text-green-400' : 'text-red-400'}`}>
                                {userData['2fa_activated'] ? 'مفعل' : 'غير مفعل'}
                              </p>
                              <p className="text-gray-400 text-sm">حالة التحقق الثنائي</p>
                            </div>
                            
                            {userData['2fa_activated'] ? (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                                <p className="text-amber-400 font-medium text-right">
                                  سيتم إلغاء تفعيل خاصية التحقق الثنائي لهذا المستخدم. سيحتاج المستخدم إلى إعادة تفعيلها في حال رغب بذلك.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 mb-4">
                                <p className="text-gray-400 font-medium text-right">
                                  المستخدم غير مفعل لخاصية التحقق الثنائي.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <p className="text-gray-400 mb-2">قم بإدخال معرف المستخدم والبحث أولاً</p>
                            <button
                              type="button"
                              onClick={() => fetchUserInfo(discordId, 'discord')}
                              disabled={!discordId || isLoading}
                              className={`mt-2 px-4 py-2 rounded-lg ${!discordId || isLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                            >
                              {isLoading ? 'جارٍ البحث...' : 'بحث'}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className={inputGroupClass}>
                    <label className={labelClass}>معرف ديسكورد للمستخدم</label>
                    <div className={inputWrapperClass}>
                      <Hash size={20} className="text-gray-400 ml-2" />
                      <input
                        type="text"
                        value={discordId}
                        onChange={(e) => setDiscordId(e.target.value)}
                        placeholder="أدخل معرف ديسكورد"
                        className={inputClass}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className={inputGroupClass}>
                    <label className={labelClass}>سبب الإجراء</label>
                    <div className={inputWrapperClass}>
                      <MessageSquare size={20} className="text-gray-400 ml-2" />
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="أدخل سبب الإجراء"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeAction === 'edit' && (
                <>
                  <p className="text-gray-400 mb-6 text-right">هذه الصفحة تستخدم لتعديل البيانات الرئيسية للمستخدم</p>
                  
                  {/* Edit Fields */}
                  <div className="bg-[#1e293b] rounded-xl p-5 mb-6 border border-[#2d3748]">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">✉️</span>
                      <h3 className="text-white text-xl font-bold">تغيير حساب الإيميل</h3>
                    </div>
                    <div className={inputWrapperClass}>
                      <Mail size={20} className="text-gray-400 ml-2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="أدخل البريد الإلكتروني الجديد"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-[#1e293b] rounded-xl p-5 mb-6 border border-[#2d3748]">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">📍</span>
                      <h3 className="text-white text-xl font-bold">تغيير البرايفت أدرس</h3>
                    </div>
                    <div className={inputWrapperClass}>
                      <MapPin size={20} className="text-gray-400 ml-2" />
                      <input
                        type="text"
                        value={privateAddress}
                        onChange={(e) => setPrivateAddress(e.target.value)}
                        placeholder="أدخل العنوان الخاص الجديد"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeAction === 'status' && (
                <>
                  <p className="text-gray-400 mb-6 text-right">هذه الصفحة تستخدم لتعديل حالة الحساب والصلاحيات</p>
                  
                  {/* Account Type */}
                  <div className="bg-[#1e293b] rounded-xl p-5 mb-6 border border-[#2d3748]">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">👤</span>
                      <h3 className="text-white text-xl font-bold">نوع الحساب</h3>
                    </div>
                    {/* Show current account type from userData */}
                    {userData && userData.account_type && (
                      <div className="mb-4">
                        <span className="text-gray-300">نوع الحساب الحالي: </span>
                        <span className="text-white font-bold">{userData.account_type}</span>
                      </div>
                    )}
                    {/* Text input to change account type */}
                    <div className="flex flex-col gap-3">
                      <label className="text-white mb-2 text-right">تغيير نوع الحساب (اكتب القيمة):</label>
                      <input
                        type="text"
                        className="bg-[#111827] text-white rounded-lg p-3 border border-[#2d3748] outline-none"
                        value={accountType}
                        onChange={e => setAccountType(e.target.value)}
                        placeholder={userData && userData.account_type ? userData.account_type : 'اكتب نوع الحساب هنا'}
                      />
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="bg-[#1e293b] rounded-xl p-5 mb-6 border border-[#2d3748]">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">✅</span>
                      <h3 className="text-white text-xl font-bold">حالة التوثيق</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">موثق</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${isVerified === 'verified' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setIsVerified('verified')}
                        >
                          <div 
                            className={`absolute top-1 ${isVerified === 'verified' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">غير موثق</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${isVerified === 'not_verified' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setIsVerified('not_verified')}
                        >
                          <div 
                            className={`absolute top-1 ${isVerified === 'not_verified' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      {/* Status indicator showing current verification status */}
                      {userData && (
                        <div className="mt-2 bg-[#111827] p-2 rounded-lg flex items-center justify-end">
                          <span className={`px-2 py-1 rounded-lg text-sm ${userData.verified ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {userData.verified ? 'موثق' : 'غير موثق'}
                          </span>
                          <span className="text-gray-400 ml-2">الحالة الحالية:</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Membership Status */}
                  <div className="bg-[#1e293b] rounded-xl p-5 mb-6 border border-[#2d3748]">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">👑</span>
                      <h3 className="text-white text-xl font-bold">حالة العضوية</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">بريميوم</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${membershipType === 'premium' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setMembershipType('premium')}
                        >
                          <div 
                            className={`absolute top-1 ${membershipType === 'premium' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">عادي</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${membershipType === 'standard' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setMembershipType('standard')}
                        >
                          <div 
                            className={`absolute top-1 ${membershipType === 'standard' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      {/* Status indicator showing current membership status */}
                      {userData && (
                        <div className="mt-2 bg-[#111827] p-2 rounded-lg flex items-center justify-end">
                          <span className={`px-2 py-1 rounded-lg text-sm ${userData.premium ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {userData.premium ? 'بريميوم' : 'عادي'}
                          </span>
                          <span className="text-gray-400 ml-2">الحالة الحالية:</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VIP Status */}
                  <div className="bg-[#1e293b] rounded-xl p-5 mb-6 border border-[#2d3748]">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">⭐</span>
                      <h3 className="text-white text-xl font-bold">حالة VIP</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">VIP</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${isVIP === 'yes' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setIsVIP('yes')}
                        >
                          <div 
                            className={`absolute top-1 ${isVIP === 'yes' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">عادي</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${isVIP === 'no' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setIsVIP('no')}
                        >
                          <div 
                            className={`absolute top-1 ${isVIP === 'no' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      {/* Status indicator showing current VIP status */}
                      {userData && (
                        <div className="mt-2 bg-[#111827] p-2 rounded-lg flex items-center justify-end">
                          <span className={`px-2 py-1 rounded-lg text-sm ${userData.vip ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {userData.vip ? 'VIP' : 'عادي'}
                          </span>
                          <span className="text-gray-400 ml-2">الحالة الحالية:</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NEW: Partner Status */}
                  <div className="bg-[#1e293b] rounded-xl p-5 mb-6 border border-[#2d3748]">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">🤝</span>
                      <h3 className="text-white text-xl font-bold">حالة البارتنر</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">بارتنر</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${isPartner === 'yes' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setIsPartner('yes')}
                        >
                          <div 
                            className={`absolute top-1 ${isPartner === 'yes' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">غير بارتنر</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${isPartner === 'no' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setIsPartner('no')}
                        >
                          <div 
                            className={`absolute top-1 ${isPartner === 'no' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      {/* Status indicator showing current partner status */}
                      {userData && (
                        <div className="mt-2 bg-[#111827] p-2 rounded-lg flex items-center justify-end">
                          <span className={`px-2 py-1 rounded-lg text-sm ${userData.partner ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {userData.partner ? 'بارتنر' : 'غير بارتنر'}
                          </span>
                          <span className="text-gray-400 ml-2">الحالة الحالية:</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NEW: Staff Status */}
                  <div className="bg-[#1e293b] rounded-xl p-5 mb-6 border border-[#2d3748]">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">👨‍💼</span>
                      <h3 className="text-white text-xl font-bold">حالة الفريق (Staff)</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">عضو فريق</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${isStaff === 'yes' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setIsStaff('yes')}
                        >
                          <div 
                            className={`absolute top-1 ${isStaff === 'yes' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-white mr-3">ليس عضو فريق</span>
                        <div 
                          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${isStaff === 'no' ? 'bg-amber-500' : 'bg-gray-700'}`}
                          onClick={() => setIsStaff('no')}
                        >
                          <div 
                            className={`absolute top-1 ${isStaff === 'no' ? 'right-1' : 'right-8'} w-5 h-5 bg-white rounded-full transition-transform`}
                          />
                        </div>
                      </div>
                      {/* Status indicator showing current staff status */}
                      {userData && (
                        <div className="mt-2 bg-[#111827] p-2 rounded-lg flex items-center justify-end">
                          <span className={`px-2 py-1 rounded-lg text-sm ${userData.staff ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {userData.staff ? 'عضو فريق' : 'ليس عضو فريق'}
                          </span>
                          <span className="text-gray-400 ml-2">الحالة الحالية:</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Submit button */}
              <div className="flex justify-end mt-8">
                <button 
                  type="button" 
                  onClick={goBack} 
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-2.5 rounded-lg text-white font-medium mr-3 transition-colors"
                  disabled={isLoading}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className={`flex items-center ${currentAction?.bgColor} hover:opacity-90 px-6 py-2.5 rounded-lg text-white font-medium transition-opacity ${isLoading || (activeAction === 'disable2FA' && (!userData || !userData['2fa_activated'])) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isLoading || (activeAction === 'disable2FA' && (!userData || !userData['2fa_activated']))}
                >
                  {isLoading ? (
                    <>
                      <Loader size={18} className="animate-spin ml-2" />
                      جارٍ التنفيذ...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} className="ml-2" />
                      تنفيذ
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // Add a function to handle security setting updates
  const handleSecuritySettingUpdate = async (settingType: string, enabled: boolean) => {
    if (!discordId || !reason) {
      toast.error('يجب إدخال معرف ديسكورد وسبب الإجراء');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let response;
      
      switch (settingType) {
        case 'ip_whitelist':
          response = await api.user.updateSecuritySetting(discordId, {
            type: 'ip_whitelist',
            enabled: false
          });
          setIpWhitelistEnabled(false);
          break;
          
        case 'geo_lock':
          response = await api.user.updateSecuritySetting(discordId, {
            type: 'geo_lock',
            enabled: false
          });
          setGeoLockEnabled(false);
          break;
          
        case 'time_based_access':
          response = await api.user.updateSecuritySetting(discordId, {
            type: 'time_based_access',
            enabled: false
          });
          setTimeBasedAccessEnabled(false);
          break;
      }
      
      await logOperation('securityUpdate', {
        user_id: discordId,
        setting_type: settingType,
        action: 'disable'
      });
      
      toast.success(`تم إلغاء تفعيل ${
        settingType === 'ip_whitelist' ? 'قائمة IP المسموح بها' :
        settingType === 'geo_lock' ? 'قفل الموقع الجغرافي' :
        'قيود الوصول الزمنية'
      } بنجاح`);
      
    } catch (error: any) {
      console.error('Error updating security setting:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء تحديث إعدادات الأمان');
    } finally {
      setIsLoading(false);
    }
  };

  // Main page content
  return (
    <div className="flex-1 bg-[#0f172a] min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Page header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2 text-white">محفظة CRN</h1>
          <p className="text-gray-400">إدارة محافظ المستخدمين وعمليات التحويل</p>
        </div>

        {activeAction ? (
          // Action form view
          renderActionForm()
        ) : (
          // Action cards grid view
          <div className="space-y-10">
            {/* Support Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-5 text-center bg-[#1e293b] py-3 rounded-lg">قسم الدعم الفني</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {walletActions.support.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.id}
                      onClick={() => setActiveAction(action.id)}
                      className={`bg-[#1e293b] rounded-xl p-5 cursor-pointer border ${action.borderColor} transition-all duration-200 hover:transform hover:scale-105 shadow-lg`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-full ${action.bgColor} flex items-center justify-center mb-4`}>
                          <Icon className={action.textColor} size={28} />
                        </div>
                        <h3 className="font-bold text-lg text-white mb-2">{action.title}</h3>
                        <p className="text-gray-400 text-sm">{action.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Moderator Section - only show if user has permission */}
            {hasPermission('moderator') && (
              <div>
                <h2 className="text-xl font-bold text-white mb-5 text-center bg-[#1e293b] py-3 rounded-lg">قسم المشرفين</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {walletActions.moderator.map((action) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={action.id}
                        onClick={() => setActiveAction(action.id)}
                        className={`bg-[#1e293b] rounded-xl p-5 cursor-pointer border ${action.borderColor} transition-all duration-200 hover:transform hover:scale-105 shadow-lg`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-16 h-16 rounded-full ${action.bgColor} flex items-center justify-center mb-4`}>
                            <Icon className={action.textColor} size={28} />
                          </div>
                          <h3 className="font-bold text-lg text-white mb-2">{action.title}</h3>
                          <p className="text-gray-400 text-sm">{action.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admin Section - only show if user has permission */}
            {hasPermission('admin') && (
              <div>
                <h2 className="text-xl font-bold text-white mb-5 text-center bg-[#1e293b] py-3 rounded-lg">قسم المسؤولين</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {walletActions.admin.map((action) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={action.id}
                        onClick={() => setActiveAction(action.id)}
                        className={`bg-[#1e293b] rounded-xl p-5 cursor-pointer border ${action.borderColor} transition-all duration-200 hover:transform hover:scale-105 shadow-lg`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-16 h-16 rounded-full ${action.bgColor} flex items-center justify-center mb-4`}>
                            <Icon className={action.textColor} size={28} />
                          </div>
                          <h3 className="font-bold text-lg text-white mb-2">{action.title}</h3>
                          <p className="text-gray-400 text-sm">{action.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage; 
import { useState, useEffect } from 'react';
// Force component reload - mining stats should show real data
import { 
  Users, Wallet, History, ArrowUpRight, 
  ArrowDownRight, Coins, TrendingUp, AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

interface UserTransaction {
  user_id: string;
  username?: string;
  avatar?: string;
  balance?: string;
  transactions: {
    transaction_id: string;
    amount: string;
    fee: string;
    timestamp: string;
    status: string;
    type: string;
  }[];
  total_transactions?: number;
}

interface MiningViolation {
  user_id: string;
  discord_id?: string;
  reason: string;
  timestamp: string;
  browser_fingerprint: string;
  ip_address: string;
  previous_user_id?: string;
  user_agent?: string;
}

const DashboardPage = () => {
  // Statistics states
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    banned: 0,
    locked: 0
  });
  
  const [walletStats, setWalletStats] = useState({
    totalBalance: '0',
    totalTransactions: 0,
    dailyTransactions: 0,
    avgTransactionAmount: '0'
  });
  
  const [miningStats, setMiningStats] = useState({
    totalMiners: 0,
    minersToday: 0,
    totalMinedCRN: '0',
    dailyMiningRate: '6',
    lastUpdated: ''
  });
  
  const [topUsers, setTopUsers] = useState<UserTransaction[]>([]);
  const [topTransactors, setTopTransactors] = useState<UserTransaction[]>([]);
  const [recentViolations, setRecentViolations] = useState<MiningViolation[]>([]);
  
  // Function to get a fallback avatar URL if Discord avatar isn't available
  const getAvatarUrl = (user: UserTransaction, index: number = 0) => {
    if (user.avatar) {
      // If the avatar URL is already formatted as a Discord URL, return it as is
      if (user.avatar.startsWith('http')) {
        return user.avatar;
      }
      // Otherwise, if the user has a Discord avatar hash but not the full URL
      if (user.user_id && user.avatar) {
        return `https://cdn.discordapp.com/avatars/${user.user_id}/${user.avatar}.webp`;
      }
    }
    // Fallback to placeholder
    return `https://i.pravatar.cc/100?img=${index + 1}`;
  };
  
  // Debug: Log mining stats when they change
  useEffect(() => {
    console.log('Mining stats updated:', miningStats);
  }, [miningStats]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user statistics
        const userStatsResponse = await api.user.getUsersStats();
        setUserStats(userStatsResponse.data.stats);
        
        // Fetch wallet statistics
        const walletStatsResponse = await api.dashboard.getWalletStats();
        setWalletStats(walletStatsResponse.data.stats);
        
        // Fetch mining statistics
        try {
          console.log('Fetching mining stats from API...');
          const miningStatsResponse = await api.dashboard.getMiningStats();
          console.log('Mining stats API response:', miningStatsResponse.data);
          setMiningStats(miningStatsResponse.data.stats);
        } catch (error) {
          console.error('Error fetching mining stats:', error);
          // Keep default mining stats
        }
        
        // Fetch top users with most CRN - limit=5 to get 5 users
        const topUsersResponse = await api.dashboard.getTopUsersByBalance(5);
        if (topUsersResponse.data.users && topUsersResponse.data.users.length > 0) {
          setTopUsers(topUsersResponse.data.users.slice(0, 5));
        } else {
          console.error('No top users returned from API');
          // Fallback to mock data with 5 users
          setTopUsers([
            {
              user_id: '1338591758493417503',
              username: 'Mohammed',
              avatar: 'https://i.pravatar.cc/100?img=1',
              balance: '99.6000000000',
              transactions: [],
              total_transactions: 8
            },
            {
              user_id: '964005304943661106',
              username: 'silent',
              avatar: 'https://i.pravatar.cc/100?img=2',
              balance: '73.7500000000',
              transactions: [],
              total_transactions: 2
            },
            {
              user_id: '821264537323962379',
              username: 'Enderman',
              avatar: 'https://i.pravatar.cc/100?img=3',
              balance: '66.0000000000',
              transactions: [],
              total_transactions: 0
            },
            {
              user_id: '757689423687923478',
              username: 'ZFLT',
              avatar: 'https://i.pravatar.cc/100?img=4',
              balance: '60.0000000000',
              transactions: [],
              total_transactions: 0
            },
            {
              user_id: '123378889479789367',
              username: 'Dnell',
              avatar: 'https://i.pravatar.cc/100?img=5',
              balance: '59.1305000895',
              transactions: [],
              total_transactions: 12
            }
          ]);
        }
        
        // Fetch top transactors - limit=5 to get 5 users
        const topTransactorsResponse = await api.dashboard.getTopTransactors(5);
        if (topTransactorsResponse.data.users && topTransactorsResponse.data.users.length > 0) {
          setTopTransactors(topTransactorsResponse.data.users.slice(0, 5));
        } else {
          console.error('No top transactors returned from API');
          // Fallback to mock data with 5 users
          setTopTransactors([
            {
              user_id: '123378889479789367',
              username: 'Dnell',
              avatar: 'https://i.pravatar.cc/100?img=6',
              transactions: [],
              total_transactions: 12
            },
            {
              user_id: '127617902653630065',
              username: 'destr09x',
              avatar: 'https://i.pravatar.cc/100?img=7',
              transactions: [],
              total_transactions: 12
            },
            {
              user_id: '236632309456044033',
              username: 'Mohammed',
              avatar: 'https://i.pravatar.cc/100?img=8',
              transactions: [],
              total_transactions: 8
            },
            {
              user_id: '964005304943661106',
              username: 'Abdulrahman',
              avatar: 'https://i.pravatar.cc/100?img=9',
              transactions: [],
              total_transactions: 6
            },
            {
              user_id: '933768652283592775',
              username: 'na',
              avatar: 'https://i.pravatar.cc/100?img=10',
              transactions: [],
              total_transactions: 6
            }
          ]);
        }
        
        // Fetch recent mining violations
        try {
          console.log('Fetching mining violations from API...');
          const violationsResponse = await api.dashboard.getMiningViolations();
          console.log('Mining violations API response:', violationsResponse.data);
          
          if (violationsResponse.data.violations && violationsResponse.data.violations.length > 0) {
            // حفظ آخر مخالفتين فقط
            const lastTwoViolations = violationsResponse.data.violations.slice(0, 2);
            setRecentViolations(lastTwoViolations);
            console.log('Set last two violations:', lastTwoViolations);
          } else {
            console.warn('No violations found or empty array returned');
            // Fallback to direct MongoDB data for testing (remove in production)
            setRecentViolations([
              {
                user_id: '1235204830155374665',
                discord_id: '',
                browser_fingerprint: 'af15a615dbdb47ae913d4bf26bb83a4a',
                ip_address: '176.29.251.129',
                user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                previous_user_id: '1248710146553675836',
                timestamp: new Date().toISOString(),
                reason: 'Multiple accounts mining from same device/IP'
              },
              {
                user_id: '1358425219517251735',
                discord_id: '1358425219517251735',
                browser_fingerprint: 'ea4a301f9d543a5e924b71ca8d3c7216',
                ip_address: '156.210.171.126',
                user_agent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                previous_user_id: '1358423023677608009',
                timestamp: new Date().toISOString(),
                reason: 'Multiple accounts mining from same device/IP'
              }
            ]);
          }
        } catch (error) {
          console.error('Error fetching mining violations:', error);
          // Fallback to data similar to what's in MongoDB
          setRecentViolations([
            {
              user_id: '1235204830155374665',
              discord_id: '',
              browser_fingerprint: 'af15a615dbdb47ae913d4bf26bb83a4a',
              ip_address: '176.29.251.129',
              user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
              previous_user_id: '1248710146553675836',
              timestamp: new Date().toISOString(),
              reason: 'Multiple accounts mining from same device/IP'
            },
            {
              user_id: '1358425219517251735',
              discord_id: '1358425219517251735',
              browser_fingerprint: 'ea4a301f9d543a5e924b71ca8d3c7216',
              ip_address: '156.210.171.126',
              user_agent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
              previous_user_id: '1358423023677608009',
              timestamp: new Date().toISOString(),
              reason: 'Multiple accounts mining from same device/IP'
            }
          ]);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Stats Grid - General statistics */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
      >
        {[
          { 
            title: 'إجمالي المحافظ', 
            value: userStats.total.toString(), 
            change: '+12%', 
            icon: Wallet, 
            positive: true 
          },
          { 
            title: 'المستخدمين النشطين', 
            value: userStats.active.toString(), 
            change: `${(userStats.active/userStats.total*100).toFixed(1)}%`, 
            icon: Users, 
            positive: true 
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02, translateY: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="bg-[#1e293b] p-4 rounded-xl shadow-md border border-[#2d3748] overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-3xl"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-xs font-medium">{stat.title}</p>
                  <h3 className="text-xl font-bold mt-1 text-white">{stat.value}</h3>
                </div>
                <div className="bg-[#2d3748] p-2 rounded-lg shadow-inner">
                  <Icon className="text-purple-400" size={18} />
                </div>
              </div>
              <div className={`flex items-center mt-2 text-xs ${
                stat.positive ? 'text-green-400' : 'text-red-400'
              }`}>
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span className="mr-1 font-medium">{stat.change}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Users with CRN */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-[#1e293b] rounded-xl p-4 shadow-md border border-[#2d3748]"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-base text-white">أعلى 5 مستخدمين</h2>
            <div className="text-purple-400 text-xs px-2 py-1 rounded-lg bg-purple-500/10">
              الرصيد
            </div>
          </div>
          <div className="space-y-3">
            {topUsers.slice(0, 5).map((user, index) => (
              <motion.div 
                key={user.user_id} 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#0f172a] transition-colors border border-[#2d3748]/30"
                whileHover={{ scale: 1.01, translateX: 2 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img src={getAvatarUrl(user, index)} alt={user.username} className="w-10 h-10 rounded-full border-2 border-purple-500/30" />
                    <span className="absolute top-0 left-0 bg-[#1e293b] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border border-purple-500">
                      {index + 1}
                    </span>
                  </div>
                  <div className="mr-2">
                    <h3 className="font-medium text-white text-sm">{user.username}</h3>
                    <div className="flex items-center text-xs text-gray-400">
                      <span>معاملات: {user.total_transactions}</span>
                    </div>
                  </div>
                </div>
                <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-full text-xs font-medium">
                  {user.balance} CRN
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Transactors */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#1e293b] rounded-xl p-4 shadow-md border border-[#2d3748]"
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-base text-white">أكثر المستخدمين نشاطًا</h2>
            <div className="text-purple-400 text-xs px-2 py-1 rounded-lg bg-purple-500/10">
              المعاملات
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mb-3 text-right">
            <p>أكثر مستخدمين قاموا بتنفيذ معاملات خلال الشهر الحالي</p>
          </div>
          
          <div className="space-y-2">
            {topTransactors.slice(0, 5).map((user, index) => (
              <div key={user.user_id} className="p-2 rounded-lg bg-[#0f172a] border border-[#2d3748]/30">
                <div className="flex items-center">
                  <div className="relative">
                    <img 
                      src={getAvatarUrl(user, index + 4)} 
                      alt={user.username} 
                      className="w-10 h-10 rounded-full border-2 border-purple-500 mr-2" 
                    />
                    <span className="absolute top-0 left-0 bg-[#1e293b] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border border-purple-500">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 mr-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-sm">{user.username}</h3>
                      <span className="text-sm font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">{user.total_transactions}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-400 truncate max-w-[120px]">{user.user_id}</span>
                      <div className="flex-1 mx-2">
                        <div className="w-full bg-[#2d3748] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" 
                            style={{ width: `${Math.min(100, (user.total_transactions || 0) * 2)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mining Violations */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-[#1e293b] rounded-xl p-4 shadow-md border border-[#2d3748]"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-base text-white">مخالفات التعدين الأخيرة</h2>
            <div className="text-red-400 text-xs px-2 py-1 rounded-lg bg-red-500/10 flex items-center">
              <AlertTriangle size={12} className="mr-1" />
              مخالفات
            </div>
          </div>

          {!recentViolations || recentViolations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              لا توجد مخالفات حتى الآن
            </div>
          ) : (
            <div className="space-y-3">
              {recentViolations.map((violation, index) => (
                <motion.div 
                  key={`${violation.user_id}-${index}`} 
                  className="p-3 rounded-lg bg-[#0f172a] border border-red-500/20 hover:bg-[#1a2234]"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center text-red-300 mr-2">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white block">
                          {violation.user_id}
                        </span>
                        <span className="text-xs text-gray-400 block">
                          {new Date(violation.timestamp).toLocaleString('ar', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pr-2 mr-10 mt-2">
                    <p className="text-sm text-red-400 mb-2 font-medium">{violation.reason}</p>
                    <div className="text-xs text-gray-500 flex flex-col space-y-1">
                      <div className="flex items-center">
                        <span className="w-16 inline-block text-gray-400">IP:</span> 
                        <span className="text-gray-300">{violation.ip_address}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-16 inline-block text-gray-400">Fingerprint:</span>
                        <span className="text-gray-300 font-mono text-xs">{violation.browser_fingerprint.substring(0, 10)}...</span>
                      </div>
                      {violation.previous_user_id && (
                        <div className="flex items-center">
                          <span className="w-16 inline-block text-gray-400">Previous ID:</span>
                          <span className="text-gray-300">{violation.previous_user_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Mining Statistics */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#1e293b] rounded-xl p-4 shadow-md border border-[#2d3748]"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-base text-white">إحصائيات التعدين</h2>
          <div className="text-blue-400 text-xs px-2 py-1 rounded-lg bg-blue-500/10 flex items-center">
            <TrendingUp size={12} className="mr-1" />
            التعدين
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المعدنين', value: miningStats.totalMiners.toString(), icon: Users, colorClass: 'text-blue-400 bg-blue-400/20' },
            { label: 'معدن اليوم', value: miningStats.minersToday.toString(), icon: Coins, colorClass: 'text-green-400 bg-green-400/20' },
            { label: 'إجمالي CRN المعدنة', value: miningStats.totalMinedCRN, icon: Wallet, colorClass: 'text-purple-400 bg-purple-400/20' },
            { label: 'معدل التعدين اليومي', value: miningStats.dailyMiningRate + ' CRN', icon: TrendingUp, colorClass: 'text-pink-400 bg-pink-400/20' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-[#0f172a] rounded-lg p-3 border border-[#2d3748]/30">
                <div className="flex items-center mb-2">
                  <div className={`p-2 rounded-lg ${stat.colorClass} mr-2`}>
                    <Icon size={16} />
                  </div>
                  <h3 className="text-sm text-gray-400">{stat.label}</h3>
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage; 
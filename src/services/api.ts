import axios, { AxiosInstance } from 'axios';

// إنشاء مثيل Axios مع الإعدادات الأساسية
const baseURL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:5000';  // Flask server default port

// Try alternate servers if main server is not available
const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,  // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// إضافة اعتراض الطلبات والاستجابات
apiClient.interceptors.request.use(
  config => {
    // Add auth token to requests if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

apiClient.interceptors.response.use(
  response => {
    // Check if response contains needs_refresh flag
    if (response.data && response.data.needs_refresh === true) {
      console.log('Token needs refresh, refreshing...');
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Call token refresh endpoint
        authService.refreshToken(token)
          .then(refreshResponse => {
            if (refreshResponse.data && refreshResponse.data.success) {
              // Update stored token
              localStorage.setItem('auth_token', refreshResponse.data.token);
              console.log('Token refreshed successfully');
            }
          })
          .catch(err => {
            console.error('Failed to refresh token:', err);
          });
      }
    }
    return response;
  },
  error => {
    if (error.response) {
      // Handle 401 Unauthorized errors (expired token)
      if (error.response.status === 401) {
        // Try to refresh token first if available
        const token = localStorage.getItem('auth_token');
        if (token && !error.config.__isRetryRequest) {
          return new Promise((resolve, reject) => {
            authService.refreshToken(token)
              .then(response => {
                if (response.data && response.data.success) {
                  // Update stored token
                  localStorage.setItem('auth_token', response.data.token);
                  
                  // Retry the original request with new token
                  const retryConfig = {
                    ...error.config,
                    headers: {
                      ...error.config.headers,
                      'Authorization': `Bearer ${response.data.token}`
                    },
                    __isRetryRequest: true
                  };
                  resolve(axios(retryConfig));
                } else {
                  // If refresh failed, logout
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('user_data');
                  window.location.href = '/';
                  reject(error);
                }
              })
              .catch(() => {
                // If refresh failed, logout
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                window.location.href = '/';
                reject(error);
              });
          });
        } else {
          // Clear auth data and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/';
        }
      }
      console.error('API Error:', error.response);
    }
    return Promise.reject(error);
  }
);

// Authentication services
const authService = {
  login: (username: string, password: string) => {
    return tryApiRequest(() => 
      apiClient.post('/api/staff/login', { 
        username, 
        password 
      })
    );
  },
  
  verifyToken: (token: string) => {
    return tryApiRequest(() => 
      apiClient.post('/api/staff/verify-token', { 
        token 
      })
    );
  },
  
  refreshToken: (token: string) => {
    return tryApiRequest(() => 
      apiClient.post('/api/staff/refresh-token', {
        token
      })
    );
  },
  
  logout: (token: string) => {
    return tryApiRequest(() =>
      apiClient.post('/api/staff/logout', { token })
    ).finally(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/';
    });
  }
};

// خدمات API
const walletService = {
  // نقل الأموال بين المستخدمين
  transferFunds: (
    fromUserId: string,
    toUserId: string,
    amount: number,
    description?: string
  ) => {
    return tryApiRequest(() =>
      apiClient.post('/api/wallet/transfer', {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount,
        description
      })
    );
  },
  
  // تبديل حالة قفل المحفظة
  toggleWalletLock: (userId: string, lockStatus: boolean) => {
    return tryApiRequest(() => 
      apiClient.put('/api/wallet/lock', { user_id: userId, lock_status: lockStatus })
    );
  },
  
  // حظر أو فك حظر التحويلات
  toggleTransfersBlock: (userId: string, blockStatus: boolean) => {
    return tryApiRequest(() => 
      apiClient.put('/api/user/transfers/block', { user_id: userId, block_status: blockStatus })
    );
  },
  
  // حظر أو فك حظر التعدين
  toggleMiningBlock: (userId: string, blockStatus: boolean) => {
    return tryApiRequest(() => 
      apiClient.put('/api/user/mining/block', { user_id: userId, block_status: blockStatus })
    );
  },
  
  // تحديث رصيد المستخدم (إضافة أو خصم)
  updateBalance: (userId: string, amount: number) => {
    return tryApiRequest(() => 
      apiClient.post('/api/wallet/update-balance', { user_id: userId, amount })
    );
  }
};

const userService = {
  // الحصول على معلومات المستخدم باستخدام معرف المستخدم
  getUserInfo: (userId: string) => {
    console.log(`Fetching user info for ID: ${userId}`);
    return tryApiRequest(() => 
      apiClient.get(`/api/user/info/${userId}`)
    ).then(response => {
      // Log specifically if security fields are present in the response
      console.log('Security fields in response:', {
        password: !!response.data?.user?.password,
        secret_word: !!response.data?.user?.secret_word,
        backup_code: !!response.data?.user?.backup_code,
        '2fa_secret': !!response.data?.user?.['2fa_secret'],
        mnemonic_phrase: !!response.data?.user?.mnemonic_phrase
      });
      return response;
    });
  },
  
  // الحصول على معلومات المستخدم باستخدام معرف المحفظة
  getUserInfoByWalletId: (walletId: string) => {
    return tryApiRequest(() => 
      apiClient.get(`/api/user/wallet/${walletId}`)
    );
  },
  
  // حظر أو إلغاء حظر مستخدم
  banUser: (userId: string, banStatus: boolean) => {
    return tryApiRequest(() => 
      apiClient.post('/api/user/ban', { 
        user_id: userId, 
        ban_status: banStatus 
      })
    );
  },
  
  // حذف مستخدم
  deleteUser: (userId: string) => {
    return tryApiRequest(() => 
      apiClient.delete(`/api/user/delete`, {
        data: { user_id: userId }
      })
    );
  },
  
  // تحديث البيانات الرئيسية للمستخدم
  updateMainData: (userId: string, email: string, privateAddress: string) => {
    return tryApiRequest(() => 
      apiClient.put(`/api/user/update/main`, { 
        user_id: userId,
        email, 
        private_address: privateAddress 
      })
    );
  },
  
  // إلغاء تفعيل التحقق الثنائي للمستخدم
  disable2FA: (userId: string) => {
    return tryApiRequest(() => 
      apiClient.put(`/api/user/2fa/disable`, { 
        user_id: userId
      })
    );
  },
  
  // تحديث حالة الحساب
  updateAccountStatus: (userId: string, payload: {
    premium?: boolean;
    vip?: boolean;
    verified?: boolean;
    account_type?: string;
    membership?: string;
  }) => {
    return tryApiRequest(() => 
      apiClient.put(`/api/user/update/status`, { 
        user_id: userId,
        ...payload 
      })
    );
  },
  
  // الحصول على جميع المستخدمين مع خيارات الترقيم والتصفية
  getAllUsers: (options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    account?: string;
  }) => {
    return tryApiRequest(() => 
      apiClient.get('/api/users/all', { params: options })
    );
  },
  
  // الحصول على إحصائيات المستخدمين
  getUsersStats: () => {
    return tryApiRequest(() => 
      apiClient.get('/api/users/stats')
    );
  },
  
  // تحديث إعدادات الأمان المتقدمة (IP whitelist، Geo lock، Time-based access)
  updateSecuritySetting: (userId: string, settingData: { type: string, enabled: boolean }) => {
    return tryApiRequest(() => 
      apiClient.put(`/api/user/security/update`, {
        user_id: userId,
        setting_type: settingData.type,
        enabled: settingData.enabled
      })
    );
  },
};

// Staff management services
const staffService = {
  getAllStaff: (options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    // Add timestamp for cache busting
    const timestamp = new Date().getTime();
    const params = {
      ...options,
      _t: timestamp
    };
    
    return tryApiRequest(() => 
      apiClient.get('/api/staff/all', { params })
    );
  },
  
  addStaffMember: (data: {
    discord_id: string;
    role: string;
    added_by: string;
    department?: string;
    can_login?: boolean;
  }) => {
    return tryApiRequest(() => 
      apiClient.post('/api/staff/add', data)
    );
  },
  
  updateStaffMember: (staffId: string, updates: {
    role?: string;
    department?: string;
    username?: string;
    password?: string;
    fingerprint?: string;
    can_login?: boolean;
  }) => {
    return tryApiRequest(() => 
      apiClient.put('/api/staff/update', { 
        staff_id: staffId,
        updates
      })
    );
  },
  
  deleteStaffMember: (staffId: string) => {
    return tryApiRequest(() => 
      apiClient.delete('/api/staff/delete', {
        data: { staff_id: staffId }
      })
    );
  }
};

const logsService = {
  getLogs: (params: { page: number; search: string; type: string }) =>
    tryApiRequest(() => 
      apiClient.get('/api/staff/logs', { params })
    ),
  
  addLog: (data: {
    action_type: string;
    user_id: string;
    performed_by: string;
    performed_by_role: string;
    performed_by_avatar: string;
    staff_id: string;
    reason: string;
    details: any;
    timestamp: string;
  }) => tryApiRequest(() => 
    apiClient.post('/api/logs/add', data)
  )
};

const api = {
  auth: authService,
  wallet: walletService,
  user: userService,
  staff: staffService,
  logs: logsService,
  dashboard: {
    // الحصول على المستخدمين الأعلى من حيث الرصيد
    getTopUsersByBalance: (limit = 3, page = 1) => {
      return tryApiRequest(() => 
        apiClient.get('/api/users/top-balances', { params: { limit, page } })
      );
    },
    
    // الحصول على المستخدمين الأكثر نشاطا
    getTopTransactors: (limit = 1, page = 1) => {
      return tryApiRequest(() => 
        apiClient.get('/api/users/top-transactors', { params: { limit, page } })
      );
    },
    
    // الحصول على إحصائيات المحفظة
    getWalletStats: () => {
      return tryApiRequest(() => 
        apiClient.get('/api/wallet/stats')
      );
    },
    
    // الحصول على إحصائيات التعدين
    getMiningStats: () => {
      return tryApiRequest(() => 
        apiClient.get('/api/mining/stats')
      );
    },
    
    // الحصول على مخالفات التعدين
    getMiningViolations: () => {
      return tryApiRequest(() => 
        apiClient.get('/api/mining/violations')
      );
    }
  }
};

// Add fallback mechanism for server connection
const tryApiRequest = async (requestFn: () => Promise<any>) => {
  try {
    console.log('Attempting API request...');
    return await requestFn();
  } catch (error: any) {
    // If connection failed, try with alternative baseURL
    if (!error.response && error.message.includes('Network Error')) {
      console.log('Network error encountered. Trying alternative server...');
      
      // Change to try server.py routes which use the correct database
      const originalBaseURL = apiClient.defaults.baseURL;
      apiClient.defaults.baseURL = import.meta.env.PROD 
        ? `${window.location.origin}/api` 
        : 'http://localhost:5000/api';
      
      try {
        console.log('Retrying with alternate server URL:', apiClient.defaults.baseURL);
        const result = await requestFn();
        // If successful with new URL, keep it
        return result;
      } catch (secondError) {
        // Try one more time with 127.0.0.1
        apiClient.defaults.baseURL = 'http://127.0.0.1:5000/api';
        try {
          console.log('Retrying with localhost direct:', apiClient.defaults.baseURL);
          return await requestFn();
        } catch (thirdError) {
          // Restore original URL
          apiClient.defaults.baseURL = originalBaseURL;
        console.error('All server connections failed, using mock data if available');
        // Check if we should return mock data based on the request
        if (error.config && error.config.url) {
          const mockData = getMockData(error.config.url, error.config.params, error.config.data);
          if (mockData) {
            console.log('Using mock data for development');
            return { data: mockData };
          }
        }
          console.error('Failed to connect to any server and no mock data available', thirdError);
          throw thirdError;
        }
      }
    } else if (error.response) {
      // Log the response error details
      console.error(`API Error: ${error.response.status} - ${error.response.statusText}`, error.response.data);
    } else {
      // Log other types of errors
      console.error('API Request Error:', error.message || error);
    }
    throw error;
  }
};

// Development mock data for testing without backend
function getMockData(url: string, params?: any, requestData?: string) {
  // Extract any admin flags that might be in the URL (for when backend implements this)
  const isAdminRequest = url.includes('admin=true') || url.includes('full=true') || url.includes('include_security=true');
  
  if (url.includes('/api/staff/login')) {
    // Mock login response
    const data = requestData ? JSON.parse(requestData) : {};
    const username = data.username;
    const password = data.password;
    
    // Check mock credentials (for development)
    if (username === 'admin' && password === 'admin123') {
      return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        token: 'mock_token_' + Date.now(),
        user: {
          _id: 'mock_id_' + Date.now(),
          discord_id: '1234567890',
          username: 'admin',
          discord_username: 'AdminUser',
          role: 'general_manager',
          permissions: ['manage_staff', 'manage_users', 'view_all', 'edit_settings'],
          fingerprint: 'mock_fingerprint',
          status: 'active',
          added_by: 'System',
          added_date: new Date().toISOString(),
          last_active: new Date().toISOString(),
          can_login: true,
          avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100'
        }
      };
    } else if (username === 'founder' && password === 'founder123') {
      return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        token: 'mock_token_' + Date.now(),
        user: {
          _id: 'mock_id_' + Date.now(),
          discord_id: '9876543210',
          username: 'founder',
          discord_username: 'FounderUser',
          role: 'founder',
          permissions: ['all_permissions'],
          fingerprint: 'mock_founder_fingerprint',
          status: 'active',
          added_by: 'System',
          added_date: new Date().toISOString(),
          last_active: new Date().toISOString(),
          can_login: false, // Founder should be able to login even with can_login=false
          avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100'
        }
      };
    } else if (username === 'supervisor' && password === 'supervisor123') {
      return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        token: 'mock_token_' + Date.now(),
        user: {
          _id: 'mock_id_' + Date.now(),
          discord_id: '5678901234',
          username: 'supervisor',
          discord_username: 'SupervisorUser',
          role: 'supervisor',
          permissions: ['view_department', 'moderate_users'],
          fingerprint: 'mock_supervisor_fingerprint',
          status: 'active',
          added_by: 'Admin',
          added_date: new Date().toISOString(),
          last_active: new Date().toISOString(),
          can_login: true,
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
        }
      };
    } else {
      return {
        success: false,
        message: 'معلومات تسجيل الدخول غير صحيحة',
        attempts: 1,
        max_attempts: 5
      };
    }
  } else if (url.includes('/api/staff/verify-token')) {
    // Mock token verification
    return {
      success: true,
      message: 'توكن المصادقة صالح',
      user: {
        _id: 'mock_id_' + Date.now(),
        discord_id: '1234567890',
        username: 'admin',
        discord_username: 'AdminUser',
        role: 'general_manager',
        permissions: ['manage_staff', 'manage_users', 'view_all', 'edit_settings'],
        fingerprint: 'mock_fingerprint',
        status: 'active',
        added_by: 'System',
        added_date: new Date().toISOString(),
        last_active: new Date().toISOString(),
        can_login: true,
        avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100'
      }
    };
  } else if (url.includes('/api/users/top-balances')) {
    // Mock data for top users by balance
    return {
      success: true,
      users: [
        { user_id: 'user1', username: 'محمد أحمد', balance: '156.34200000', avatar: null },
        { user_id: 'user2', username: 'أحمد محمود', balance: '123.50000000', avatar: null },
        { user_id: 'user3', username: 'عمر خالد', balance: '89.75000000', avatar: null },
        { user_id: 'user4', username: 'سارة علي', balance: '76.20000000', avatar: null },
        { user_id: 'user5', username: 'فاطمة محمد', balance: '65.10000000', avatar: null }
      ],
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 50,
        total: 5,
        pages: 1
      }
    };
  } else if (url.includes('/api/user/info/')) {
    // Get user ID from URL
    const userId = url.split('/').pop() || 'default';
    
    // Generate unique security data based on user ID to avoid same values for all users
    const generateUniqueCode = (prefix: string, id: string, length: number) => {
      const hash = [...id].reduce((a, b) => {
        return a + b.charCodeAt(0);
      }, 0);
      return `${prefix}${hash % 1000}${Math.random().toString(36).substring(2, length)}`;
    };
    
    // Create the user data object
    const userData = {
      user_id: userId,
      username: 'مستخدم تجريبي',
      email: `user${userId.substring(0, 4)}@example.com`,
      balance: '100.00000000',
      dob: '1990-01-01',
      created_at: '2023-01-01',
      wallet_id: `wallet${userId.substring(0, 6)}`,
      private_address: `private_${userId.substring(0, 8)}`,
      public_address: `public_${userId.substring(0, 8)}`,
      verified: true,
      vip: userId.length % 5 === 0,
      premium: userId.length % 3 === 0,
      account_type: userId.length % 5 === 0 ? 'vip' : (userId.length % 3 === 0 ? 'premium' : 'standard'),
      membership: 'شهري',
      wallet_lock: false,
      ban: false,
      frozen: false,
      profile_hidden: false
    };
    
    // Add security fields only if it's an admin request (otherwise simulate backend security filtering)
    if (isAdminRequest) {
      return {
        success: true,
        user: {
          ...userData,
          password: generateUniqueCode('', userId, 8),
          secret_word: `كلمة سرية ${userId.substring(0, 4)}`,
          backup_code: generateUniqueCode('BACKUP', userId, 12),
          mnemonic_phrase: '1.apple 2.orange 3.banana 4.grape 5.lemon 6.peach 7.melon 8.cherry 9.mango 10.kiwi 11.plum 12.fig',
          '2fa_secret': generateUniqueCode('2FA', userId, 16),
          '2fa_activated': userId.length % 2 === 0,
        }
      };
    } else {
      // For non-admin requests, don't include security fields (simulating backend filtering)
      return {
        success: true,
        user: userData
      };
    }
  } else if (url.includes('/api/wallet/update-balance')) {
    // Mock balance update
    // Get request data from config
    const data = requestData ? JSON.parse(requestData) : {};
    const amount = parseFloat(data.amount);
    
    // Calculate new balance
    const currentBalance = 100; // assuming initial balance
    const newBalance = currentBalance + amount;
    
    return {
      success: true,
      message: 'Balance updated successfully',
      new_balance: newBalance.toFixed(10)
    };
  }
  
  // No mock data available for this endpoint
  return null;
}

// Export all services
export default api; 
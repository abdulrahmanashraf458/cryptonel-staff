import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, Lock, Mail, ArrowRight, X, RotateCcw, Sparkles, User, 
  Fingerprint, AlertTriangle, Shield, ShieldCheck, XCircle, RefreshCw
} from 'lucide-react';
import api from '../services/api';

// Constants
const MAX_ATTEMPTS = 5; // Maximum login attempts before blocking

// Custom hook for particle system
const useParticles = (count = 50) => {
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number; color: string; opacity: number }[]>([]);
  
  useEffect(() => {
    const colors = ['#D4D5F4', '#8A8DBA', '#5D5F8D', '#FFFFFF'];
    const newParticles = Array.from({ length: count }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 1,
      speed: Math.random() * 0.3 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.1
    }));
    
    setParticles(newParticles);
    
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        y: p.y - p.speed > 0 ? p.y - p.speed : 100,
        opacity: p.y < 10 ? p.y / 10 : p.opacity
      })));
    }, 50);
    
    return () => clearInterval(interval);
  }, [count]);
  
  return particles;
};

// Interactive orbit component
const OrbitSystem = ({ children }: { children: React.ReactNode }) => {
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.2) % 360);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative w-full h-full">
      {/* Central element */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        {children}
      </div>
      
      {/* Orbiting elements */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (rotation + (i * 72)) * (Math.PI / 180);
        const distance = 140;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const size = 20 - i * 2;
        
        return (
          <div 
            key={i}
            className="absolute rounded-full bg-[#D4D5F4]/20 backdrop-blur-sm border border-[#D4D5F4]/30"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              top: `calc(50% - ${size/2}px + ${y}px)`,
              left: `calc(50% - ${size/2}px + ${x}px)`,
              transition: 'all 0.2s ease-out'
            }}
          />
        );
      })}
      
      {/* Orbit paths */}
      <div className="absolute top-1/2 left-1/2 w-[280px] h-[280px] rounded-full border border-dashed border-[#D4D5F4]/10 transform -translate-x-1/2 -translate-y-1/2"></div>
    </div>
  );
};

// Creative input field
const InnovativeInput = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  icon: Icon,
  error = false,
  disabled = false
}: { 
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ElementType;
  error?: boolean;
  disabled?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const actualType = type === 'password' && showPassword ? 'text' : type;
  
  return (
    <div 
      className={`
        relative rounded-lg overflow-hidden transition-all duration-300
        ${focused ? 'shadow-lg shadow-[#D4D5F4]/20' : ''}
        ${error ? 'shadow-red-500/30' : ''}
        ${disabled ? 'opacity-70' : ''}
      `}
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d1117]/90 to-[#0a192f]/80 backdrop-blur-md"></div>
      <div 
        className={`
          absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 
          ${focused ? 'bg-[#D4D5F4]' : 'bg-[#D4D5F4]/30'}
          ${error ? '!bg-red-500' : ''}
          ${disabled ? 'bg-gray-500/30' : ''}
        `}
      ></div>
      
      <div className="relative flex items-center">
        <div className="flex-shrink-0 pl-4">
          <Icon className={`w-5 h-5 ${focused ? 'text-[#D4D5F4]' : 'text-[#D4D5F4]/50'} ${error ? '!text-red-500' : ''} ${disabled ? 'text-gray-500/50' : ''}`} />
        </div>
        
        <input
          type={actualType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className="w-full bg-transparent text-white border-none outline-none py-4 px-4 placeholder-[#D4D5F4]/30 disabled:cursor-not-allowed"
        />
        
        {type === 'password' && (
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="flex-shrink-0 pr-4 text-[#D4D5F4]/50 hover:text-[#D4D5F4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
};

interface LoginPageProps {
  onLogin: (username: string, password: string, token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginPhase, setLoginPhase] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'verifying'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'credentials' | 'permission' | 'rate_limit' | 'server' | null>(null);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [fingerprintScanLines, setFingerprintScanLines] = useState(false);
  const [fingerprintMatched, setFingerprintMatched] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginBlocked, setLoginBlocked] = useState(false);
  const [loginBlockedUntil, setLoginBlockedUntil] = useState<Date | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useParticles(80);
  
  // Fetch CSRF token on component mount
  useEffect(() => {
    // Generate a simple CSRF token (in production this would come from the server)
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    setCsrfToken(token);
  }, []);
  
  // Rate limiting logic
  useEffect(() => {
    if (loginAttempts >= 5 && !loginBlocked) {
      setLoginBlocked(true);
      const blockUntil = new Date();
      blockUntil.setMinutes(blockUntil.getMinutes() + 15); // Block for 15 minutes
      setLoginBlockedUntil(blockUntil);
      setErrorMessage(`Too many login attempts. Login blocked for 15 minutes.`);
      setErrorType('rate_limit');
    }
    
    // Check if block time has passed
    if (loginBlocked && loginBlockedUntil) {
      const checkBlockStatus = setInterval(() => {
        const now = new Date();
        if (now > loginBlockedUntil) {
          setLoginBlocked(false);
          setLoginAttempts(0);
          setErrorMessage('');
          setErrorType(null);
        } else {
          const minutesLeft = Math.round((loginBlockedUntil.getTime() - now.getTime()) / (1000 * 60));
          setErrorMessage(`Too many login attempts. Please try again in ${minutesLeft} minutes.`);
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(checkBlockStatus);
    }
  }, [loginAttempts, loginBlocked, loginBlockedUntil]);
  
  // Gravity effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      containerRef.current.style.setProperty('--mouse-x', `${x}%`);
      containerRef.current.style.setProperty('--mouse-y', `${y}%`);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't proceed if login is blocked
    if (loginBlocked) {
      return;
    }
    
    // Validate input data
    if (!username || !password) {
      setLoginPhase('error');
      setErrorMessage('Username and password are required');
      setErrorType('credentials');
      setTimeout(() => {
        setLoginPhase('idle');
        setErrorMessage('');
        setErrorType(null);
      }, 2000);
      return;
    }

    // Validate password length (very basic validation)
    if (password.length < 3) {
      setLoginPhase('error');
      setErrorMessage('Password is too short, please enter your full password');
      setErrorType('credentials');
      setTimeout(() => {
        setLoginPhase('idle');
        setErrorMessage('');
        setErrorType(null);
      }, 2000);
      return;
    }

    setLoginPhase('connecting');
    
    try {
      // Simulate a real authentication flow with fingerprint scanning
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Show fingerprint verification overlay
      setShowFingerprint(true);
      setFingerprintScanLines(true);
      
      // Simulate fingerprint verification process
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Verify user through API
      try {
        console.log('Attempting to login with username:', username);
        const response = await api.auth.login(username, password);
        
        // If login was successful
        if (response?.data?.success) {
          setFingerprintScanLines(false);
          setFingerprintMatched(true);
          setLoginPhase('connected');
          
          // Get token from response
          const token = response.data.token;
          
          console.log('Login successful, token received');
          
          // Delay before continuing to verify permissions
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          // Get user data
          const userData = response.data.user;
          
          console.log('User data from login response:', {
            role: userData?.role,
            can_login: userData?.can_login,
            will_allow_login: userData?.role === 'founder' || userData?.can_login === true,
            permissions: userData?.permissions
          });
          
          // Allow founders to login regardless of can_login status
          if (userData && (userData.role === 'founder' || userData.can_login === true)) {
            // User has login permission, proceed to dashboard
            // Reset login attempts on successful login
            setLoginAttempts(0);
            setTimeout(() => {
              setShowFingerprint(false);
              onLogin(username, password, token);
            }, 1000);
          } else {
            // User does not have permission to login
            // Don't increment login attempts for permission issues
            setErrorType('permission');
            setErrorMessage('You do not have permission to access the dashboard');
            setTimeout(() => {
              setShowFingerprint(false);
              setLoginPhase('error');
              // Reset after delay
              setTimeout(() => {
                setLoginPhase('idle');
                setErrorMessage('');
                setErrorType(null);
              }, 3000);
            }, 1500);
          }
        } else {
          // Login failed (wrong credentials)
          // Update attempts from server response if available
          if (response?.data?.attempts) {
            setLoginAttempts(response.data.attempts);
            
            // If server indicates we're blocked, update block state
            if (response?.data?.block_remaining) {
              const blockUntil = new Date();
              blockUntil.setSeconds(blockUntil.getSeconds() + response.data.block_remaining);
              setLoginBlocked(true);
              setLoginBlockedUntil(blockUntil);
            }
          } else {
            setLoginAttempts(prev => prev + 1);
          }
          
          setFingerprintScanLines(false);
          setFingerprintMatched(true);
          setErrorType('credentials');
          setErrorMessage(response?.data?.message || 'Invalid login credentials');
          
          setTimeout(() => {
            setShowFingerprint(false);
            setLoginPhase('error');
            // Reset after delay
            setTimeout(() => {
              setLoginPhase('idle');
              setFingerprintMatched(false);
            }, 2000);
          }, 1500);
        }
      } catch (apiError: any) {
        // Check if this is a rate limit response
        if (apiError.response && apiError.response.status === 429) {
          const data = apiError.response.data;
          
          // Update attempts counter
          if (data.attempts) {
            setLoginAttempts(data.attempts);
          } else {
            setLoginAttempts(MAX_ATTEMPTS); // Use max attempts as default when blocked
          }
          
          // Set blocked state
          setLoginBlocked(true);
          
          // Calculate block duration
          const blockUntil = new Date();
          if (data.block_remaining) {
            blockUntil.setSeconds(blockUntil.getSeconds() + data.block_remaining);
          } else {
            blockUntil.setMinutes(blockUntil.getMinutes() + 15); // Default 15 minutes
          }
          setLoginBlockedUntil(blockUntil);
          
          setErrorType('rate_limit');
          setErrorMessage(data.message || 'تم تجاوز عدد محاولات تسجيل الدخول المسموح بها');
        } else {
          // Network or other server error - but DON'T increment attempts for server errors
          console.error('API Error:', apiError);
          setErrorType('server');
          setErrorMessage('حدث خطأ أثناء الاتصال بالخادم');
        }
        
        setFingerprintScanLines(false);
        setFingerprintMatched(true);
        
        setTimeout(() => {
          setShowFingerprint(false);
          setLoginPhase('error');
          // Reset after delay
          setTimeout(() => {
            setLoginPhase('idle');
            setFingerprintMatched(false);
          }, 3000);
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginAttempts(prev => prev + 1);
      setLoginPhase('error');
      setErrorMessage('حدث خطأ أثناء تسجيل الدخول');
      setErrorType('server');
      
      setTimeout(() => {
        setLoginPhase('idle');
        setErrorMessage('');
        setErrorType(null);
      }, 3000);
    }
  };
  
  // Calculate remaining time for login block
  const getRemainingBlockTime = () => {
    if (!loginBlockedUntil) return '';
    
    const now = new Date();
    const diffMs = loginBlockedUntil.getTime() - now.getTime();
    if (diffMs <= 0) return '';
    
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    return `(${diffMins} minutes)`;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      {/* Backdrop - remove onClick completely to prevent unwanted exits */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </div>
      
      {/* Login container */}
      <motion.div
        ref={containerRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.7 }}
        className="relative w-full max-w-md bg-gradient-to-br from-[#0d1117]/90 via-[#0a192f]/80 to-[#0d1117]/90 backdrop-blur-lg rounded-2xl overflow-hidden"
        style={{
          '--mouse-x': '50%',
          '--mouse-y': '50%',
        } as React.CSSProperties}
      >
        {/* Interactive background effect */}
        <div 
          className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(212,213,244,0.4),transparent_50%)]"
          style={{ transition: 'opacity 0.3s ease-out' }}
        ></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(212, 213, 244, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(212, 213, 244, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}
        ></div>
        
        <div className="p-8 relative z-10">
          {/* Header with dimension title */}
          <div className="mb-10">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-center space-x-2 mb-2"
            >
              <div className="w-10 h-10 bg-[#0d1117] rounded-full flex items-center justify-center border border-[#D4D5F4]/30">
                <Sparkles className="w-5 h-5 text-[#D4D5F4]" />
              </div>
              <h2 className="text-2xl font-bold text-white">Dimension Portal</h2>
            </motion.div>
          </div>
          
          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <InnovativeInput 
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={User}
                error={loginPhase === 'error' && (errorType === 'credentials' || errorType === 'permission')}
                disabled={loginBlocked || loginPhase === 'connecting' || loginPhase === 'connected'}
              />
            </div>
            
            <div>
              <InnovativeInput 
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                error={loginPhase === 'error' && (errorType === 'credentials' || errorType === 'permission')}
                disabled={loginBlocked || loginPhase === 'connecting' || loginPhase === 'connected'}
              />
            </div>
            
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center text-sm px-4 py-2 rounded-lg ${
                  errorType === 'rate_limit' 
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : errorType === 'server'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-center">
                  {errorType === 'rate_limit' && <AlertTriangle className="w-4 h-4 mr-2" />}
                  {errorType === 'permission' && <ShieldCheck className="w-4 h-4 mr-2" />}
                  {errorType === 'server' && <AlertTriangle className="w-4 h-4 mr-2" />}
                  {errorType === 'credentials' && <XCircle className="w-4 h-4 mr-2" />}
                  <span>{errorMessage}</span>
                </div>
                {errorType === 'rate_limit' && getRemainingBlockTime() && (
                  <div className="text-xs mt-1 text-yellow-300/70">
                    {getRemainingBlockTime()}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Login attempts display */}
            {loginAttempts > 0 && loginAttempts < MAX_ATTEMPTS && !loginBlocked && (
              <div className="flex flex-col items-center space-y-1">
                <div className="text-xs text-white/70">
                  Remaining attempts: <span className="font-bold text-white">{MAX_ATTEMPTS - loginAttempts}</span> of <span>{MAX_ATTEMPTS}</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${
                        i < loginAttempts 
                          ? 'bg-red-500' 
                          : 'bg-[#2d3748]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={loginBlocked || loginPhase === 'connecting' || loginPhase === 'connected'}
                className={`
                  relative w-full py-4 rounded-lg overflow-hidden group
                  ${loginPhase === 'error' 
                    ? 'bg-red-500/20' 
                    : loginBlocked 
                    ? 'bg-yellow-500/20' 
                    : 'bg-[#D4D5F4]/20'
                  }
                  disabled:opacity-70 disabled:cursor-not-allowed
                `}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#D4D5F4]/30 to-transparent"></div>
                
                {loginPhase === 'idle' && !loginBlocked && (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-white font-medium">Connect to Dimension</span>
                    <ArrowRight className="w-5 h-5 text-[#D4D5F4]" />
                  </div>
                )}
                
                {loginPhase === 'connecting' && (
                  <div className="flex items-center justify-center space-x-2">
                    <RotateCcw className="w-5 h-5 text-[#D4D5F4] animate-spin" />
                    <span className="text-white font-medium">Connecting...</span>
                  </div>
                )}
                
                {loginPhase === 'connected' && (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-white font-medium">Connected!</span>
                    <span className="inline-block w-5 h-5 bg-[#D4D5F4] rounded-full"></span>
                  </div>
                )}
                
                {loginPhase === 'error' && (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-white font-medium">Connection Failed</span>
                    <X className="w-5 h-5 text-white" />
                  </div>
                )}
                
                {loginBlocked && (
                  <div className="flex items-center justify-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-300" />
                    <span className="text-yellow-300 font-medium">Login Temporarily Blocked</span>
                  </div>
                )}
              </button>
            </div>
          </form>
          
          {/* Visual element - 3D rotating system */}
          <div className="mt-10 h-40 overflow-hidden">
            <OrbitSystem>
              <div className="w-16 h-16 bg-[#0d1117] rounded-full flex items-center justify-center border border-[#D4D5F4]/30 shadow-lg shadow-[#D4D5F4]/10">
                <div className="w-8 h-8 text-[#D4D5F4]">
                  {loginPhase === 'idle' && !loginBlocked && <Lock className="w-full h-full" />}
                  {loginPhase === 'connecting' && <RotateCcw className="w-full h-full animate-spin" />}
                  {loginPhase === 'connected' && <Sparkles className="w-full h-full animate-pulse" />}
                  {loginPhase === 'error' && <X className="w-full h-full text-red-500" />}
                  {loginBlocked && <AlertTriangle className="w-full h-full text-yellow-300" />}
                </div>
              </div>
            </OrbitSystem>
          </div>
          
          {/* Footer links */}
          <div className="mt-6 text-center text-xs text-[#D4D5F4]/50 space-y-2">
            <div>
              <a href="/privacy-policy" className="hover:text-[#D4D5F4] transition-colors">
                Terms & Privacy Policy
              </a>
            </div>
            <div className="text-[#D4D5F4]/40">
              Dashboard Coming Soon
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Fingerprint verification overlay */}
      <AnimatePresence>
        {showFingerprint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-lg z-50"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="bg-[#0a0e1a]/90 rounded-xl p-8 shadow-2xl border border-[#D4D5F4]/20 max-w-sm w-full"
            >
              <div className="text-center">
                <div className="relative mx-auto w-24 h-24 mb-5">
                  {/* Pulsating background */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-full bg-[#D4D5F4]/20"
                  />
                  
                  {/* Fingerprint container */}
                  <div className="absolute inset-0 rounded-full bg-[#D4D5F4]/10 flex items-center justify-center overflow-hidden border border-[#D4D5F4]/30">
                    {/* Scan line animation */}
                    {fingerprintScanLines && (
                      <motion.div
                        initial={{ y: -140 }}
                        animate={{ y: 140 }}
                        transition={{
                          duration: 1.5,
                          ease: "linear",
                          repeat: Infinity,
                        }}
                        className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#D4D5F4]/80 to-transparent"
                      />
                    )}
                    
                    {/* Success/Error effect when matched */}
                    {fingerprintMatched && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
                        transition={{ duration: 0.5 }}
                        className={`absolute inset-0 ${errorType === 'credentials' ? 'bg-yellow-500/20' : errorType === 'server' ? 'bg-yellow-500/20' : errorType === 'permission' ? 'bg-yellow-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center`}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                          className={`${
                            errorType === 'credentials' 
                              ? 'bg-yellow-500/90' 
                              : errorType === 'server' 
                              ? 'bg-yellow-500/90' 
                              : errorType === 'permission' 
                              ? 'bg-yellow-500/90' 
                              : 'bg-green-500/90'
                          } text-white rounded-full p-2`}
                        >
                          <motion.div
                            animate={{ rotate: [0, 10, 0] }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                          >
                            {errorType === 'credentials' && <AlertTriangle size={24} />}
                            {errorType === 'permission' && <AlertTriangle size={24} />}
                            {errorType === 'server' && <AlertTriangle size={24} />}
                            {(!errorType || errorType === null) && <ShieldCheck size={24} />}
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {/* Fingerprint icon */}
                    <motion.div
                      animate={{
                        opacity: fingerprintMatched ? 0.3 : [0.8, 1, 0.8],
                        scale: fingerprintMatched ? 0.9 : 1
                      }}
                      transition={{
                        duration: 2,
                        repeat: fingerprintMatched ? 0 : Infinity,
                      }}
                    >
                      <Fingerprint className={`${
                        fingerprintMatched 
                          ? (errorType === 'credentials' 
                            ? 'text-yellow-300' 
                            : errorType === 'permission'
                            ? 'text-yellow-300'
                            : errorType === 'server'
                            ? 'text-yellow-300'
                            : 'text-green-300')
                          : 'text-[#D4D5F4]'
                      }`} size={76} />
                    </motion.div>
                  </div>
                </div>
                
                <h3 className="text-white text-xl font-semibold mb-2 relative z-10">
                  {fingerprintMatched 
                    ? (errorType ? 'Invalid Credentials' : 'Verification Success')
                    : 'Verifying'
                  }
                </h3>
                
                <p className="text-gray-400 text-sm text-center relative z-10 max-w-xs mx-auto">
                  {fingerprintMatched 
                    ? (errorType ? 'Invalid credentials' : 'Identity verified successfully. Preparing dashboard...')
                    : 'Verifying your identity and access permissions...'
                  }
                </p>
                
                {/* Loading dots */}
                <div className="flex justify-center space-x-2 mt-4">
                  <motion.div
                    animate={{ scale: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    className={`w-2 h-2 rounded-full ${errorType ? 'bg-yellow-400' : 'bg-[#D4D5F4]'}`}
                  />
                  <motion.div
                    animate={{ scale: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className={`w-2 h-2 rounded-full ${errorType ? 'bg-yellow-400' : 'bg-[#D4D5F4]'}`}
                  />
                  <motion.div
                    animate={{ scale: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className={`w-2 h-2 rounded-full ${errorType ? 'bg-yellow-400' : 'bg-[#D4D5F4]'}`}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
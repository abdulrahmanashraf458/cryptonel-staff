import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';
import { 
  Wallet, 
  Users, 
  BarChart3, 
  Settings, 
  Bell, 
  History,
  UserCog,
  Menu,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Star,
  Cpu,
  Microscope,
  Play,
  FileText,
  Award,
  UserCheck,
  LogOut,
  Headphones,
  Shield,
  Receipt,
  Coins,
  Pickaxe
} from 'lucide-react';
import WalletPage from './components/WalletPage';
import UsersManagement from './components/UsersManagement';
import AdminManagement from './components/AdminManagement';
import SupervisorManagement from './components/SupervisorManagement';
import AdminStaffManagement from './components/AdminStaffManagement';
import DashboardPage from './components/DashboardPage';
import TopUsersPage from './components/TopUsersPage';
import LoginPage from './components/LoginPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import { AuthProvider, useAuth } from './context/AuthContext';
import OperationsLog from './components/OperationsLog';
import UserTransactions from './components/UserTransactions';
import CurrencySettings from './components/CurrencySettings';
import MiningSettings from './components/MiningSettings';

// Add CSS for hiding scrollbar but allowing scrolling
const globalStyles = `
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera */
    width: 0;
    height: 0;
  }
`;

// Main App wrapper with authentication provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user, logout, updateLastActive, login } = useAuth();
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const location = useLocation();

  // Memoize handleActivity to prevent recreation on each render
  const handleActivity = useCallback(() => {
    updateLastActive();
  }, [updateLastActive]);

  // Add activity tracking for user presence
  useEffect(() => {
    if (isAuthenticated) {
      const activityEvents = [
        'mousedown', 'mousemove', 'keydown', 
        'scroll', 'touchstart', 'click'
      ];
      
      activityEvents.forEach(event => {
        window.addEventListener(event, handleActivity);
      });
      
      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [isAuthenticated, handleActivity]);

  // Check if user has permission to see a section
  const hasPermission = (sectionId: string) => {
    if (!user || !user.role) return false;
    
    // Founder has access to everything
    if (user.role === 'founder') {
      return true;
    }
    
    // Administrators section is exclusive to founders only
    if (sectionId === 'administrators') {
      return user.role === 'founder';
    }
    
    // Responsibles section is for general managers, managers, and founders
    if (sectionId === 'responsibles') {
      return user.role === 'founder' || user.role === 'general_manager' || user.role === 'manager';
    }
    
    // Support role can only access tech support section
    if (user.role === 'support') {
      return sectionId === 'techSupport' || sectionId === 'mainContent' || sectionId === 'contentSeparator';
    }
    
    // Supervisor role can access tech support, supervisors sections
    if (user.role === 'supervisor') {
      return sectionId === 'techSupport' || sectionId === 'records' || sectionId === 'mainContent' || sectionId === 'contentSeparator';
    }
    
    // General manager and Manager can access everything except administrators section
    if (user.role === 'general_manager' || user.role === 'manager') {
      return sectionId !== 'administrators';
    }
    
    // All other roles can access only the main content
    return sectionId === 'mainContent' || sectionId === 'contentSeparator';
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#0f172a] text-white items-center justify-center">
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-pink-600"
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Check if current path is privacy policy
  const isPrivacyPolicyPage = location.pathname === '/privacy-policy';
  
  // If privacy policy page, show it without authentication
  if (isPrivacyPolicyPage) {
    return (
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    );
  }
  
  // If not authenticated, show login page directly
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={
          <LoginPage 
            onLogin={async (username, password, token) => {
              try {
                // استدعاء وظيفة تسجيل الدخول مع البيانات المناسبة
                const result = await login({ username, password });
                if (!result.success) {
                  // يمكن إضافة معالجة الخطأ هنا إذا لزم الأمر
                  console.error("Login failed:", result.message);
                }
              } catch (error) {
                console.error("Error during login:", error);
              }
            }}
          />
        } />
      </Routes>
    );
  }
  
  // Menu structure with hierarchical data
  const menuSections = [
    // Original menu items for the main content
    {
      id: 'contentSeparator',
      isSeparator: true,
      label: 'Application'
    },
    {
      id: 'mainContent',
      label: 'Content',
      items: [
        { id: 'dashboard', label: 'نظرة عامة', icon: BarChart3 }
      ]
    },
    // Technical Support Section - New section
    {
      id: 'techSupport',
      label: 'الدعم الفني',
      icon: Headphones,
      expandable: true,
      items: [
        { id: 'wallet', label: 'CRN ادارة محفظة', icon: Wallet }
      ]
    },
    // Records Section (modified to remove violations)
    {
      id: 'records',
      label: 'المشرفيين',
      icon: FileText,
      expandable: true,
      items: [
        { id: 'users', label: 'المستخدمين', icon: Users },
        { id: 'userTransactions', label: 'سجل معاملات العميل', icon: Receipt },
        { id: 'techStaff', label: 'إدارة الدعم الفني', icon: Headphones },
        { id: 'logs', label: 'سجل العمليات', icon: History }
      ]
    },
    // Administrators Section
    {
      id: 'responsibles',
      label: 'المسئولين',
      icon: UserCog,
      expandable: true,
      items: [
        // Item for Admins to manage both supervisors and tech support
        { id: 'staff', label: 'إدارة المشرفين والدعم الفني', icon: Shield },
        { id: 'topUsers', label: 'أعلى مستخدمين العملة', icon: Award }
      ]
    },
    // Founders Section
    {
      id: 'administrators',
      label: 'الادارة العليا',
      icon: UserCog,
      expandable: true,
      items: [
        { id: 'admins', label: 'إدارة الفريق', icon: UserCog },
        { id: 'currencySettings', label: 'إعدادات العملة', icon: Coins },
        { id: 'miningSettings', label: 'إعدادات التعدين', icon: Pickaxe }
      ]
    }
  ];

  // Function to render the selected page content
  const renderPageContent = () => {
    switch (selectedMenu) {
      case 'wallet':
        return <WalletPage />;
      case 'users':
        return <UsersManagement />;
      case 'admins':
        return <AdminManagement />;
      case 'staff':
        return <AdminStaffManagement />;
      case 'techStaff':
        return <SupervisorManagement />;
      case 'topUsers':
        return <TopUsersPage />;
      case 'logs':
        return <OperationsLog />;
      case 'userTransactions':
        return <UserTransactions />;
      case 'currencySettings':
        return <CurrencySettings />;
      case 'miningSettings':
        return <MiningSettings />;
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Routes>
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="*" element={
        <div className="flex min-h-screen bg-[#0f172a] text-white">
          {/* Inject global styles for hiding scrollbars */}
          <style>{globalStyles}</style>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Sidebar - Fixed position */}
          <div className={`fixed top-0 bottom-0 left-0 z-40 ${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-[#1e293b] shadow-2xl border-r border-[#2d3748] transition-all duration-300 ${
              isMobileMenuOpen ? 'translate-x-0' : 'lg:translate-x-0 -translate-x-full'
            }`}
          >
            {/* Sidebar content */}
            <div className="h-full flex flex-col overflow-hidden">
              {/* Sidebar Toggle Button */}
              <button 
                onClick={toggleSidebar}
                className="hidden lg:block absolute top-3 right-1 p-1 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg transition-colors"
              >
                {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>

              <div className={`py-4 px-3 flex items-center ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                <motion.div
                  whileHover={{ rotate: 5 }}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg"
                >
                  <Wallet className="text-white" size={18} />
                </motion.div>
                {!isSidebarCollapsed && (
                  <motion.h1 
                    className="text-sm font-bold ml-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    Clyne Dashboard
                  </motion.h1>
                )}
              </div>
              
              {/* Sidebar Navigation - with hidden scrollbar */}
              <nav className="flex-1 overflow-y-auto mt-2 text-sm hide-scrollbar">
                {menuSections.map((section) => {
                  // Skip sections the user doesn't have permission to see
                  if (section.id !== 'contentSeparator' && section.id !== 'mainContent' && !hasPermission(section.id)) {
                    return null;
                  }
                  
                  if (section.isSeparator) {
                    return !isSidebarCollapsed ? (
                      <div key={section.id} className="px-4 py-2 text-xs text-gray-400 font-semibold border-t border-[#2d3748]/50 mt-4 mb-2">
                        {section.label}
                      </div>
                    ) : (
                      <div key={section.id} className="border-t border-[#2d3748]/50 my-4"></div>
                    );
                  }
                  
                  if (section.items && !section.expandable) {
                    // For sections with items but not expandable (like mainContent)
                    return (
                      <div key={section.id}>
                        {section.items.map(item => {
                          const Icon = item.icon;
                          const isActive = selectedMenu === item.id;
                          return (
                            <a
                              key={item.id}
                              href="#"
                              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''} px-3 py-2 my-1 rounded-md transition-all ${
                                isActive 
                                  ? 'bg-purple-600/80 text-white font-medium' 
                                  : 'text-gray-400 hover:bg-[#2d3748]/30'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedMenu(item.id);
                                if (window.innerWidth < 1024) {
                                  setIsMobileMenuOpen(false);
                                }
                              }}
                            >
                              <div className={`p-1.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-[#2d3748] text-gray-400'}`}>
                                <Icon size={16} />
                              </div>
                              {!isSidebarCollapsed && (
                                <span className="ml-2 text-sm">{item.label}</span>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    );
                  }
                  
                  // For expandable sections or single items
                  const Icon = section.icon;
                  const isExpanded = expandedSection === section.id;
                  return (
                    <div key={section.id} className="mb-1">
                      <a
                        href="#"
                        className={`flex items-center justify-between px-3 py-2 rounded-md transition-all
                        ${isExpanded ? 'text-white' : 'text-gray-300'} 
                        ${!isSidebarCollapsed ? 'hover:bg-[#2d3748]/30' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          if (section.expandable) {
                            toggleSection(section.id);
                          } else if (section.id !== 'contentSeparator') {
                            setSelectedMenu(section.id);
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <div className="p-1.5 rounded-md bg-[#2d3748] text-gray-300">
                            {Icon && <Icon size={14} />}
                          </div>
                          {!isSidebarCollapsed && (
                            <span className="ml-2 text-sm">{section.label}</span>
                          )}
                        </div>
                        {!isSidebarCollapsed && section.expandable && (
                          <ChevronDown 
                            size={14} 
                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          />
                        )}
                      </a>
                      
                      {/* Submenu items */}
                      {!isSidebarCollapsed && section.expandable && isExpanded && section.items && (
                        <div className="overflow-hidden">
                          {section.items.map(item => (
                            <a
                              key={item.id}
                              href="#"
                              className="flex items-center pl-10 pr-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-md hover:bg-[#2d3748]/20 transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedMenu(item.id);
                                if (window.innerWidth < 1024) {
                                  setIsMobileMenuOpen(false);
                                }
                              }}
                            >
                              <span>{item.label}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* User Profile - Fixed at bottom */}
              {!isSidebarCollapsed && (
                <div className="px-4 py-3 border-t border-[#2d3748]">
                  <div 
                    className="bg-gradient-to-b from-[#2d3748] to-[#1e293b] rounded-xl p-3 shadow-lg border border-purple-500/20"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-purple-500 p-0.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <img
                          src={user?.avatar_url || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100"}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-500 border border-[#1e293b]"></div>
                    </div>
                    <h3 className="text-center font-semibold text-sm text-white">
                      {user?.discord_username || user?.username || "---"}
                    </h3>
                    <p className="text-xs text-gray-400 text-center mt-1 bg-[#0f172a]/50 rounded-lg py-0.5">
                      {user?.role === 'manager' && 'مدير'}
                      {user?.role === 'supervisor' && 'مشرف'}
                      {user?.role === 'founder' && 'مؤسس'}
                      {user?.role === 'general_manager' && 'مدير عام'}
                      {user?.role === 'tech_support' && 'دعم فني'}
                      {user?.role === 'support' && 'دعم العملاء'}
                      {!user?.role && 'عضو فريق'}
                    </p>
                    <div className="flex justify-between mt-3">
                      <button
                        className="bg-[#0f172a] hover:bg-[#1a2234] p-1.5 rounded-lg text-purple-400"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={logout}
                        className="bg-[#0f172a] hover:bg-red-900/30 p-1.5 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                        title="تسجيل الخروج"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {isSidebarCollapsed && (
                <div className="py-3 flex flex-col items-center border-t border-[#2d3748]">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full mx-auto border-2 border-purple-500 p-0.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <img
                        src={user?.avatar_url || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100"}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-[#1e293b]"></div>
                  </div>
                  <button
                    onClick={logout}
                    className="mt-3 p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
                    title="تسجيل الخروج"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - with proper margin and scrollable */}
          <div className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}>
            <div className="p-5 lg:p-6 pt-16 lg:pt-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
                <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-[#2d3748]/50 w-full">
                  <h1 className="text-2xl font-bold text-white">
                    {selectedMenu === 'dashboard' ? 'نظرة عامة' : 
                     selectedMenu === 'wallet' ? 'CRN ادارة محفظة' :
                     selectedMenu === 'users' ? 'المستخدمين' :
                     selectedMenu === 'admins' ? 'إدارة المشرفين' :
                     selectedMenu === 'staff' ? 'إدارة المشرفين والدعم الفني' :
                     selectedMenu === 'techStaff' ? 'إدارة الدعم الفني' :
                     selectedMenu === 'topUsers' ? 'أعلى مستخدمين العملة' :
                     selectedMenu === 'logs' ? 'سجل العمليات' :
                     selectedMenu === 'userTransactions' ? 'سجل معاملات العميل' :
                     selectedMenu === 'currencySettings' ? 'إعدادات العملة' :
                     selectedMenu === 'miningSettings' ? 'إعدادات التعدين' : 'الإعدادات'}
                  </h1>
                  <p className="text-gray-400">مرحباً بك، {user?.discord_username || user?.username}</p>
                </div>
              </div>

              {/* Page Content */}
              <div className="container mx-auto">
                {renderPageContent()}
              </div>
            </div>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;
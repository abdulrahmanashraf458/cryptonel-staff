import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Filter, 
  RefreshCw,
  Headphones,
  User,
  Settings,
  Save,
  ListFilter,
  Copy,
  CheckCircle,
  type LucideIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// تعريف واجهة الأنواع للدور
interface RoleDetail {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  shadow?: string;
  priority?: number; // لترتيب العرض
}

// Staff roles available for supervisors to manage
const AVAILABLE_ROLES: RoleDetail[] = [
  { 
    id: 'support', 
    label: 'دعم فني', 
    icon: Headphones, 
    color: 'emerald', 
    bgColor: 'linear-gradient(135deg, #0f172a, #0c1016)', 
    textColor: 'text-emerald-400', 
    borderColor: 'border-emerald-500/30', 
    shadow: 'shadow-emerald-900/20',
    priority: 5 
  },
];

const API_BASE_URL = '/api'; // API base URL

// Define CSS for the component
const styles = {
  cardPattern: {
    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
    backgroundSize: '15px 15px',
  }
};

const SupervisorManagement = () => {
  const { user } = useAuth();
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state for adding/editing staff
  const [formData, setFormData] = useState({
    discord_id: '',
    role: 'support', // Default to support role
    added_by: user?.username || 'Supervisor', 
    username: '',
    password: '',
    fingerprint: '',
    can_login: true
  });

  // Generated credentials after adding staff
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    password: string;
    fingerprint: string;
  } | null>(null);

  // Fetch staff data - only tech support staff
  const fetchStaffData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Add timestamp for cache busting
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${API_BASE_URL}/staff/all?page=${currentPage}&search=${searchTerm}&role=support&_t=${timestamp}`
      );
      
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات الفريق');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Additional filter to ensure ONLY support roles are displayed
        // and sort by priority if needed
        const filteredStaff = (data.staff || [])
          .filter((staff: any) => staff.role === 'support')
          .sort((a: any, b: any) => {
            // For future sorting if additional roles are added
            const roleA = getRoleDetails(a.role);
            const roleB = getRoleDetails(b.role);
            return (roleA.priority || 999) - (roleB.priority || 999);
          });
        
        setStaffMembers(filteredStaff);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        throw new Error(data.message || 'فشل في جلب بيانات الفريق');
      }
    } catch (err: any) {
      setError(err.message);
      setStaffMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when page or search changes
  useEffect(() => {
    fetchStaffData();
  }, [currentPage, searchTerm]);

  // Navigation functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Set form data for editing
  const startEditing = (staff: any) => {
    // Safety check to ensure we're only editing support roles
    if (staff.role !== 'support') {
      setError('يمكن تعديل أعضاء الدعم الفني فقط');
      return;
    }
    
    setFormData({
      discord_id: staff.discord_id,
      role: staff.role,
      added_by: staff.added_by,
      username: staff.username || '',
      password: staff.password || '',
      fingerprint: staff.fingerprint || '',
      can_login: staff.can_login !== undefined ? staff.can_login : true
    });
    setEditingStaff(staff._id);
    setShowAddStaffForm(false);
  };

  // Add new staff member - only tech support
  const handleAddStaff = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    // Validate that role is support
    if (formData.role !== 'support') {
      setError('يمكن إضافة أعضاء الدعم الفني فقط');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/staff/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          discord_id: formData.discord_id,
          role: 'support', // Only support role is allowed
          can_login: formData.can_login,
          added_by: user?.username || 'Supervisor'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('تمت إضافة عضو الدعم الفني بنجاح');
        setGeneratedCredentials({
          username: data.staff.username,
          password: data.staff.password,
          fingerprint: data.staff.fingerprint
        });
        
        fetchStaffData();
        resetForm();
      } else {
        throw new Error(data.message || 'فشل في إضافة عضو الدعم الفني');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save edited staff data
  const handleSaveEdit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    // Validate that role is support
    if (formData.role !== 'support') {
      setError('يمكن تعديل أعضاء الدعم الفني فقط');
      setIsLoading(false);
      return;
    }
    
    try {
      // لا نقوم بإرسال البصمة الفريدة عند التحديث
      const updates = {
        username: formData.username,
        password: formData.password,
        // fingerprint: formData.fingerprint, // تم تعطيل إمكانية تعديل البصمة
        can_login: formData.can_login
      };
      
      const response = await fetch(`${API_BASE_URL}/staff/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          staff_id: editingStaff,
          updates
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('تم تحديث بيانات عضو الدعم الفني بنجاح');
        // Force a fresh reload with new state
        setTimeout(() => {
          setCurrentPage(1);  // Reset to first page
          fetchStaffData();   // Fetch data fresh
        }, 300);
        setEditingStaff(null);
      } else {
        throw new Error(data.message || 'فشل في تحديث بيانات عضو الدعم الفني');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete staff member
  const handleDeleteStaff = async (id: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/staff/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          staff_id: id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('تم حذف عضو الدعم الفني بنجاح');
        fetchStaffData();
        setConfirmDelete(null);
      } else {
        throw new Error(data.message || 'فشل في حذف عضو الدعم الفني');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      discord_id: '',
      role: 'support',
      added_by: user?.username || 'Supervisor',
      username: '',
      password: '',
      fingerprint: '',
      can_login: true
    });
    setShowAddStaffForm(false);
    setGeneratedCredentials(null);
  };

  // Cancel editing/adding
  const handleCancel = () => {
    resetForm();
    setEditingStaff(null);
    setShowAddStaffForm(false);
  };

  // Get role details
  const getRoleDetails = (roleId: string): RoleDetail => {
    const role = AVAILABLE_ROLES.find(r => r.id === roleId);
    return role || { 
      id: 'unknown', 
      label: 'غير معروف', 
      icon: User, 
      color: 'gray',
      bgColor: 'linear-gradient(45deg, #808080, #2d3748)',
      textColor: 'text-gray-400',
      borderColor: 'border-gray-500/50',
      shadow: 'shadow-gray-500/40'
    };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Copy field to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    // Show confirmation etc.
  };

  return (
    <div className="w-full px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1e293b] rounded-xl shadow-xl p-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">إدارة الدعم الفني</h1>
            <p className="text-gray-400 mt-1">إضافة، تعديل، أو إزالة أعضاء الدعم الفني</p>
          </div>
          
          {!showAddStaffForm && !editingStaff && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddStaffForm(true)}
              className="mt-4 md:mt-0 px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} />
              إضافة دعم فني جديد
            </motion.button>
          )}
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-500">
            {successMessage}
          </div>
        )}
        
        {/* New Staff Credentials */}
        {generatedCredentials && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-purple-500/20 border border-purple-500 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-purple-400 mb-2">بيانات تسجيل الدخول الجديدة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-[#2d3748] rounded-lg">
                <p className="text-gray-400 text-sm">اسم المستخدم</p>
                <p className="text-white font-mono">{generatedCredentials.username}</p>
              </div>
              <div className="p-3 bg-[#2d3748] rounded-lg">
                <p className="text-gray-400 text-sm">كلمة المرور</p>
                <p className="text-white font-mono">{generatedCredentials.password}</p>
              </div>
              <div className="p-3 bg-[#2d3748] rounded-lg">
                <p className="text-gray-400 text-sm">البصمة الفريدة</p>
                <p className="text-white font-mono truncate">{generatedCredentials.fingerprint}</p>
              </div>
            </div>
            <p className="mt-3 text-yellow-400 text-sm">
              <b>هام:</b> يرجى حفظ هذه البيانات، لن يتم عرض كلمة المرور مرة أخرى!
            </p>
          </motion.div>
        )}
        
        {/* Add/Edit Staff Form */}
        {(showAddStaffForm || editingStaff) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-5 bg-[#2d3748] rounded-lg border border-[#4a5568]"
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingStaff ? 'تعديل بيانات عضو الدعم الفني' : 'إضافة عضو دعم فني جديد'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 mb-2">معرف Discord ID</label>
                <input
                  type="text"
                  name="discord_id"
                  value={formData.discord_id}
                  onChange={handleFormChange}
                  disabled={!!editingStaff}
                  className="w-full bg-[#1e293b] text-white p-3 rounded-lg border border-[#4a5568] focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="أدخل معرف Discord ID"
                />
              </div>
              
              {/* Role is fixed as support for supervisors */}
              <div>
                <label className="block text-gray-400 mb-2">المنصب / الدور</label>
                <select
                  name="role"
                  value={formData.role}
                  disabled={true}
                  className="w-full bg-[#1e293b] text-white p-3 rounded-lg border border-[#4a5568] focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {AVAILABLE_ROLES.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Only show login permission for adding new staff */}
              {!editingStaff && (
                <div>
                  <label className="block text-gray-400 mb-2">صلاحية الوصول للداش بورد</label>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="can_login"
                        checked={formData.can_login === true}
                        onChange={() => setFormData({...formData, can_login: true})}
                        className="h-4 w-4 text-purple-600"
                      />
                      <span className="mr-2 text-white">يمتلك صلاحية</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="can_login"
                        checked={formData.can_login === false}
                        onChange={() => setFormData({...formData, can_login: false})}
                        className="h-4 w-4 text-purple-600"
                      />
                      <span className="mr-2 text-white">لا يمتلك صلاحية</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Only show these fields when editing */}
              {editingStaff && (
                <>
                  <div>
                    <label className="block text-gray-400 mb-2">اسم المستخدم</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleFormChange}
                      className="w-full bg-[#1e293b] text-white p-3 rounded-lg border border-[#4a5568] focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="اسم المستخدم"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-2">كلمة المرور</label>
                    <input
                      type="text"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      className="w-full bg-[#1e293b] text-white p-3 rounded-lg border border-[#4a5568] focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="كلمة المرور"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-2">البصمة الفريدة</label>
                    <input
                      type="text"
                      name="fingerprint"
                      value={formData.fingerprint}
                      onChange={handleFormChange}
                      disabled={true}
                      className="w-full bg-[#1e293b] text-white p-3 rounded-lg border border-[#4a5568] focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 cursor-not-allowed"
                      placeholder="البصمة الفريدة (غير قابلة للتعديل)"
                    />
                    <p className="text-red-400 text-xs mt-1">* لا يمكن تعديل البصمة الفريدة لأسباب أمنية</p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-2">صلاحية الوصول للداش بورد</label>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="can_login"
                          checked={formData.can_login === true}
                          onChange={() => setFormData({...formData, can_login: true})}
                          className="h-4 w-4 text-purple-600"
                        />
                        <span className="mr-2 text-white">يمتلك صلاحية</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="can_login"
                          checked={formData.can_login === false}
                          onChange={() => setFormData({...formData, can_login: false})}
                          className="h-4 w-4 text-purple-600"
                        />
                        <span className="mr-2 text-white">لا يمتلك صلاحية</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-[#1e293b] text-white rounded-lg flex items-center gap-2 hover:bg-[#2d3748] transition-colors"
              >
                <X size={18} />
                إلغاء
              </button>
              
              <button
                onClick={editingStaff ? handleSaveEdit : handleAddStaff}
                disabled={isLoading || !formData.discord_id}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:hover:bg-purple-600"
              >
                {isLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : editingStaff ? (
                  <Save size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {editingStaff ? 'حفظ التغييرات' : 'إضافة'}
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Filter and Search */}
        {!showAddStaffForm && !editingStaff && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث عن طريق الاسم أو معرف Discord"
                className="w-full pl-3 pr-10 py-2 bg-[#2d3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-[#4a5568]"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="p-2 bg-[#2d3748] text-white rounded-lg hover:bg-[#4a5568] transition-colors border border-[#4a5568]"
                title="إعادة ضبط الفلاتر"
              >
                <ListFilter size={18} />
              </button>
              
              <button
                onClick={() => fetchStaffData()}
                className="p-2 bg-[#2d3748] text-white rounded-lg hover:bg-[#4a5568] transition-colors border border-[#4a5568]"
                title="تحديث"
              >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        )}
        
        {/* Staff List */}
        {!showAddStaffForm && !editingStaff && (
          <>
            {isLoading && staffMembers.length === 0 ? (
              <div className="bg-[#2d3748] rounded-lg p-8 text-center">
                <RefreshCw size={24} className="mx-auto animate-spin text-purple-500 mb-2" />
                <p className="text-gray-400">جاري تحميل البيانات...</p>
              </div>
            ) : staffMembers.length === 0 ? (
              <div className="bg-[#2d3748] rounded-lg p-8 text-center">
                <Headphones size={48} className="mx-auto text-gray-600 mb-3" />
                <h3 className="text-white text-lg font-medium mb-1">لا يوجد أعضاء دعم فني</h3>
                <p className="text-gray-400">
                  {searchTerm
                    ? 'لا توجد نتائج مطابقة لمعايير البحث الخاصة بك'
                    : 'لم يتم إضافة أي أعضاء إلى فريق الدعم الفني بعد'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* عنوان قسم الدعم الفني */}
                <div className="mb-4 border-b border-emerald-600/30 pb-2 flex items-center gap-2">
                  <Headphones className="text-emerald-400" size={20} />
                  <h2 className="text-xl font-bold text-emerald-400">
                    الدعم الفني ({staffMembers.length})
                  </h2>
                </div>
                
                {/* بطاقات الموظفين في قسم الدعم الفني */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffMembers.map((staff) => {
                    const roleDetails = getRoleDetails(staff.role);
                    const RoleIcon = roleDetails.icon;
                    
                    return (
                      <motion.div
                        key={staff._id}
                        whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)" }}
                        className={`bg-[#1a1d2d] rounded-lg overflow-hidden shadow-md border ${roleDetails.borderColor || 'border-[#4a5568]'} hover:border-purple-500 transition-all relative ${roleDetails.shadow || ''}`}
                      >
                        {/* Delete Confirmation Overlay */}
                        {confirmDelete === staff._id && (
                          <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center p-4 rounded-lg">
                            <p className="text-white text-center mb-4">
                              هل أنت متأكد من حذف هذا العضو؟
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleDeleteStaff(staff._id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
                              >
                                <Trash2 size={16} />
                                نعم، حذف
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 bg-[#1e293b] text-white rounded-lg flex items-center gap-2 hover:bg-[#2d3748] transition-colors"
                              >
                                <X size={16} />
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="relative">
                          <div 
                            className="h-28 flex items-center justify-center"
                            style={{ background: roleDetails.bgColor || 'linear-gradient(to right, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9))' }}
                          >
                            <div className="absolute inset-0 opacity-30" style={styles.cardPattern}></div>
                          </div>
                          
                          <div className="absolute -bottom-10 left-4 w-20 h-20 rounded-full overflow-hidden shadow-lg">
                            <div className="absolute inset-0 border-4 rounded-full border-[#2d3748]"></div>
                            <img
                              src={staff.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.username)}&background=random`}
                              alt={staff.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div
                            className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 bg-[#0f1117]/70 backdrop-blur-sm border ${roleDetails.borderColor?.replace('border-', 'border-') || 'border-gray-600/40'}`}
                          >
                            <RoleIcon size={14} className={roleDetails.textColor || 'text-white'} />
                            <span className={roleDetails.textColor || 'text-white'}>{roleDetails.label}</span>
                          </div>
                          
                          {staff.can_login !== undefined && (
                            <div
                              className="absolute top-4 left-10 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-[#0f1117]/70 backdrop-blur-sm border border-gray-700"
                            >
                              <span className={staff.can_login ? 'text-green-400' : 'text-red-400'}>
                                {staff.can_login ? 'لديه صلاحية الوصول' : 'ليس لديه صلاحية الوصول'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-12 pb-4 px-4">
                          <div className="mb-3">
                            <h3 className="text-white font-semibold text-lg overflow-hidden text-ellipsis">{staff.discord_username || staff.username}</h3>
                            <p className="text-gray-400 text-sm truncate">ID: {staff.discord_id}</p>
                          </div>
                          
                          <div className="flex justify-between items-center mt-4">
                            <div className="text-gray-400 text-xs">
                              تمت الإضافة: {formatDate(staff.added_date)}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditing(staff)}
                                className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                                title="تعديل"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(staff._id)}
                                className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                                title="حذف"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {staffMembers.length > 0 && totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-[#2d3748] text-white hover:bg-[#4a5568] disabled:opacity-50 disabled:hover:bg-[#2d3748]"
                  >
                    <ChevronRight size={16} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-8 h-8 rounded-lg ${
                        currentPage === page
                          ? 'bg-purple-600 text-white'
                          : 'bg-[#2d3748] text-white hover:bg-[#4a5568]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-[#2d3748] text-white hover:bg-[#4a5568] disabled:opacity-50 disabled:hover:bg-[#2d3748]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SupervisorManagement; 
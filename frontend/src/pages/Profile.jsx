import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiLock, FiSettings, FiShield, FiLogOut, FiEdit2, FiInfo, FiUpload, FiHeart, FiFileText, FiX, FiCheck } from 'react-icons/fi';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { useAuth } from '../context/AuthContext';
import { maskEmail } from '../utils/dataMasking';
import { supabase } from '../services/supabaseClient';

export default function Profile() {
  const { user, signOut, savedSongs, addAuditLog } = useAuth();
  const activeSongsCount = savedSongs ? savedSongs.filter(s => !s.isDeleting).length : 0;

  // Modals state
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newName, setNewName] = useState(user?.user_metadata?.full_name || '');
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [uploadsHistory, setUploadsHistory] = useState([]);
  const [expandedHymnKey, setExpandedHymnKey] = useState(null);

  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    doesNotContainUserInfo: false,
    strength: 'weak',
    isStrong: false
  });

  // Keep newName in sync if user profile loads later
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setNewName(user.user_metadata.full_name);
    }
  }, [user]);

  // Real-time password requirements validation (matching Register.jsx logic)
  useEffect(() => {
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[@$!%*?&]/.test(newPassword);

    let containsUserInfo = false;
    const lowerPassword = newPassword.toLowerCase();
    
    if (user?.email) {
      const emailPart = user.email.split('@')[0].toLowerCase();
      if (emailPart.length >= 3 && lowerPassword.includes(emailPart)) {
        containsUserInfo = true;
      }
      if (lowerPassword.includes(user.email.toLowerCase())) {
        containsUserInfo = true;
      }
    }
    
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      const nameParts = fullName.toLowerCase().split(/\s+/).filter(part => part.length >= 3);
      for (const part of nameParts) {
        if (lowerPassword.includes(part)) {
          containsUserInfo = true;
          break;
        }
      }
    }

    const doesNotContainUserInfo = !containsUserInfo;

    const passedChecks = [
      hasMinLength, 
      hasUppercase, 
      hasLowercase, 
      hasNumber,
      hasSpecialChar,
      doesNotContainUserInfo
    ].filter(Boolean).length;

    const strength = 
      passedChecks <= 2 ? 'weak' :
      passedChecks <= 4 ? 'medium' : 'strong';

    const isStrong = 
      hasMinLength && 
      hasUppercase && 
      hasLowercase && 
      hasNumber &&
      hasSpecialChar &&
      doesNotContainUserInfo;

    setPasswordValidation({
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      doesNotContainUserInfo,
      strength,
      isStrong
    });
  }, [newPassword, user]);

  const getStrengthColor = () => {
    if (newPassword.length === 0) return 'bg-slate-200 text-slate-500';
    if (passwordValidation.strength === 'strong') return 'bg-green-500 text-green-500';
    if (passwordValidation.strength === 'medium') return 'bg-orange-500 text-orange-500';
    return 'bg-red-500 text-red-500';
  };

  const openEditName = () => {
    setNewName(user?.user_metadata?.full_name || '');
    setNameError('');
    setNameSuccess('');
    setShowEditNameModal(true);
  };

  const openChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowChangePasswordModal(true);
  };

  const openUploadsModal = () => {
    const historyData = localStorage.getItem('hymnmatch_upload_history');
    let historyList = [];
    if (historyData) {
      try {
        historyList = JSON.parse(historyData);
      } catch (e) {
        historyList = [];
      }
    }
    
    // Fallback: If history list is empty but single lastUploadedResults exists, migrate it
    if (historyList.length === 0) {
      const singleData = localStorage.getItem('lastUploadedResults');
      if (singleData) {
        try {
          const parsed = JSON.parse(singleData);
          historyList = [{
            id: parsed.id || Date.now() * 1000 + Math.floor(Math.random() * 1000),
            filename: parsed.filename,
            hymns: parsed.hymns,
            timestamp: parsed.timestamp,
            created_at: parsed.timestamp || new Date().toISOString()
          }];
        } catch (_) {}
      }
    }

    setUploadsHistory(historyList);
    setExpandedHymnKey(null);
    setShowUploadsModal(true);
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');
    
    if (!newName.trim()) {
      setNameError('Name cannot be empty.');
      return;
    }
    
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(newName)) {
      setNameError('Name must contain letters only.');
      return;
    }

    setIsUpdatingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName.trim() }
      });

      if (error) throw error;

      if (typeof addAuditLog === 'function') {
        addAuditLog('Profile Update', `Changed profile name to "${newName.trim()}"`);
      }
      setNameSuccess('Name updated successfully!');
      setTimeout(() => {
        setShowEditNameModal(false);
        setNameSuccess('');
      }, 1500);
    } catch (err) {
      setNameError(err.message || 'Failed to update name.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!passwordValidation.isStrong) {
      setPasswordError('New password does not meet the complexity requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // 1. Verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        setPasswordError('Incorrect current password.');
        setIsUpdatingPassword(false);
        return;
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      if (typeof addAuditLog === 'function') {
        addAuditLog('Security Update', 'Account password changed successfully.');
      }
      setPasswordSuccess('Password changed successfully! Logging out...');
      setTimeout(async () => {
        setShowChangePasswordModal(false);
        await signOut();
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

// ============================================
// CONTROL #6B: XSS PREVENTION (Input Sanitization)
// ============================================
// Threat: Cross-Site Scripting (XSS)
// CIA Principle: Integrity
// Status: IMPLEMENTED via React JSX
//
// Implementation:
// 1. React automatically escapes all interpolated text
// 2. No use of dangerouslySetInnerHTML with user input
// 3. Custom sanitization for edge cases
//
// Code Location: Profile component, line ~16
//
// Safe Examples:
// ✅ <h1>{userName}</h1> — React escapes HTML
// ✅ <p>{userEmail}</p> — Safe, will not execute scripts
// ✅ <div>{userComment}</div> — Text nodes are escaped

  return (
    <div className="max-w-3xl mx-auto py-4 pb-20">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">Profile & Settings</h1>

      {/* User Info & Activity Stats (US-027) */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 border-4 border-white shadow-md flex items-center justify-center text-purple-600 text-3xl font-bold">
              {user?.user_metadata?.full_name?.charAt(0) || 'JD'}
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user?.user_metadata?.full_name || 'John Doe'}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{user?.email ? maskEmail(user.email) : 'john.doe@example.com'}</p>
          </div>
        </div>

        {/* Activity Stats (US-027) */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-center space-x-4 border border-slate-100 dark:border-slate-800/50">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
              <FiHeart size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeSongsCount}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saved Songs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Account Section (US-027, US-028) */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FiUser size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Account</h3>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={openEditName}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                <FiUser size={18} />
                <span className="font-medium">Edit Name</span>
              </div>
              <FiEdit2 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button 
              onClick={openChangePassword}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                <FiLock size={18} />
                <span className="font-medium">Change Password</span>
              </div>
              <FiEdit2 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Data & History Section */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <FiUpload size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Data &amp; History</h3>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={openUploadsModal}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                <FiFileText size={18} />
                <span className="font-medium">Uploaded Files</span>
              </div>
              <FiInfo size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Legal & About Section (US-031, US-032) */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <FiFileText size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Legal & About</h3>
          </div>
          
          <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setShowTermsModal(true)}
              className="w-full flex items-center p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4">
                <FiFileText size={18} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Terms &amp; Conditions</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Read our terms of service and usage guidelines</p>
              </div>
            </button>
            
            <button 
              onClick={() => setShowPrivacyModal(true)}
              className="w-full flex items-center p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                <FiShield size={18} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Privacy Policy</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">RA 10173 compliance and data protection details</p>
              </div>
            </button>
          </div>
        </div>
      </div>


      {/* Edit Name Modal */}
      {showEditNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col relative transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Name</h2>
              <button 
                onClick={() => setShowEditNameModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>

            {nameError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
                {nameError}
              </div>
            )}

            {nameSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium border border-green-100 dark:border-green-900/30">
                {nameSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">New Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                  placeholder="Enter new name"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingName}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  {isUpdatingName ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col relative max-h-[90vh] overflow-y-auto transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
              <button 
                onClick={() => setShowChangePasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium border border-green-100 dark:border-green-900/30">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors focus:outline-none"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
              </div>

              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                    placeholder="Create new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors focus:outline-none"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
              </div>

              {/* Password Validation Criteria UI */}
              {newPassword.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Password strength:</span>
                    <span className={`font-bold capitalize ${getStrengthColor().split(' ')[1]}`}>
                      {passwordValidation.strength}
                    </span>
                  </div>
                  <div className="flex space-x-1 h-1.5">
                    <div className={`flex-1 rounded-full ${newPassword.length > 0 ? getStrengthColor().split(' ')[0] : 'bg-slate-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${(passwordValidation.strength === 'medium' || passwordValidation.strength === 'strong') && newPassword.length > 0 ? getStrengthColor().split(' ')[0] : 'bg-slate-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${passwordValidation.strength === 'strong' ? 'bg-green-500' : 'bg-slate-200'} transition-colors duration-300`}></div>
                  </div>
                  <ul className="text-xs space-y-2 mt-3 font-medium">
                    <li className={`flex items-center space-x-2 ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-slate-500'}`}>
                      {passwordValidation.hasMinLength ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>At least 8 characters</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-slate-500'}`}>
                      {passwordValidation.hasUppercase ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Contains an uppercase letter</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-slate-500'}`}>
                      {passwordValidation.hasLowercase ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Contains a lowercase letter</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                      {passwordValidation.hasNumber ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Contains a number</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-slate-500'}`}>
                      {passwordValidation.hasSpecialChar ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Contains a special character (@$!%*?&)</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${passwordValidation.doesNotContainUserInfo ? 'text-green-600' : 'text-slate-500'}`}>
                      {passwordValidation.doesNotContainUserInfo ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Does not contain your name or email</span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-purple-500 transition-all placeholder:text-slate-400 ${
                      confirmPassword.length > 0 
                        ? newPassword === confirmPassword 
                          ? 'border-green-300 dark:border-green-900/50 focus:ring-green-500/20' 
                          : 'border-red-300 dark:border-red-900/50 focus:ring-red-500/20'
                        : 'border-slate-200 dark:border-slate-800 focus:ring-purple-500/20'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
              </div>

              {confirmPassword.length > 0 && (
                <div className={`text-xs font-medium pl-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !passwordValidation.isStrong || newPassword !== confirmPassword}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>Change Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Terms &amp; Conditions</h2>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-4">
              <p className="font-medium text-slate-800 dark:text-slate-200">Last updated: March 2026</p>
              
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">1. Acceptance of Terms</h3>
                <p>By accessing and using HymnMatch, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this service.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">2. Use of Service</h3>
                <p>HymnMatch is designed exclusively for liturgical and church music planning purposes. You agree to use this service only for its intended purpose of selecting hymns for religious services. Commercial resale or redistribution of AI-generated recommendations is strictly prohibited.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">3. User Accounts</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information during registration. Each user is permitted one account only.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">4. Uploaded Documents</h3>
                <p>Documents and images you upload are processed in temporary memory only and are not permanently stored on our servers. You retain full ownership of all content you upload. By uploading, you confirm you have the right to use and share the content for music planning purposes.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">5. AI-Generated Recommendations</h3>
                <p>Song recommendations are generated by artificial intelligence and are meant to assist, not replace, your liturgical judgment. HymnMatch does not guarantee the doctrinal accuracy or appropriateness of any recommendation. Final song selection remains solely your responsibility.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">6. Intellectual Property</h3>
                <p>HymnMatch and its original content, features, and functionality are the property of the HymnMatch development team. Lyrics displayed are used for reference purposes only.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">7. Limitation of Liability</h3>
                <p>HymnMatch is provided as-is without warranties of any kind. We are not liable for any decisions made based on AI-generated recommendations or any disruption of service.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">8. Changes to Terms</h3>
                <p>We reserve the right to update these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms.</p>
              </div>

              <p className="pt-2 font-medium text-slate-700 dark:text-slate-200">Contact: hymnmatch.support@gmail.com</p>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setShowTermsModal(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 font-bold transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Privacy Policy</h2>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-4">
              <p className="font-medium text-slate-800 dark:text-slate-200">Last updated: May 2026</p>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl text-purple-950 dark:text-purple-250 font-medium animate-fadeIn">
                <h3 className="font-bold mb-1 text-purple-900 dark:text-purple-200">RA 10173 Compliance Declaration</h3>
                <p>In strict compliance with the Republic Act No. 10173, also known as the Data Privacy Act of 2012, HymnMatch ensures that all personal and liturgical information collected is processed securely, transparently, and lawfully. Your information will only be accessed for the purpose of personalized hymn recommendations and profile planning.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">1. Information We Collect</h3>
                <p>We collect the following personal information:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700 dark:text-slate-200">
                  <li>Full name (for account identification)</li>
                  <li>Email address (for authentication and password recovery)</li>
                  <li>Liturgical preferences (default season setting)</li>
                  <li>Usage activity logs (uploads, saved songs)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">2. How We Use Your Information</h3>
                <p>Your information is used solely to:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700 dark:text-slate-200">
                  <li>Provide and improve the HymnMatch service</li>
                  <li>Authenticate your identity securely</li>
                  <li>Send password reset emails when requested</li>
                  <li>Display personalized liturgical recommendations</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">3. Data Storage and Security</h3>
                <p>Your account data is stored securely in Supabase, a PostgreSQL-based platform with enterprise-grade security. Uploaded liturgical documents are processed in temporary browser memory only and are never permanently stored on our servers.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">4. Data Sharing</h3>
                <p>We do not sell, trade, or share your personal information with third parties. Your data is never used for advertising purposes.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">5. Cookies and Sessions</h3>
                <p>HymnMatch uses secure session tokens for authentication purposes only. We do not use tracking cookies or third-party analytics.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">6. Your Rights</h3>
                <p>You have the right to:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700 dark:text-slate-200">
                  <li>Access your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and data</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">7. Data Retention</h3>
                <p>Your data is retained as long as your account is active. Upon account deletion, all personal data is permanently removed within 30 days.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">8. Contact Us</h3>
                <p>For privacy concerns or data requests, contact us at: <br/><strong>hymnmatch.support@gmail.com</strong></p>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 font-bold transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Files Modal */}
      {showUploadsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Uploaded Files</h2>
              <button 
                onClick={() => setShowUploadsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6 max-h-[600px]">
              {uploadsHistory && uploadsHistory.length > 0 ? (
                <div className="space-y-8">
                  {uploadsHistory
                    .slice()
                    .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp))
                    .map((upload, uIdx) => (
                      <div key={upload.id || uIdx} className="space-y-4 pb-6 border-b last:border-b-0 border-slate-100 dark:border-slate-800">
                        {/* File Box with Metadata */}
                        <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl">
                          <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Filename</p>
                          <p className="text-slate-800 dark:text-slate-200 font-bold">{upload.filename}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(upload.created_at || upload.timestamp).toLocaleString()}</p>
                        </div>
                        
                        {/* Recommendations Section */}
                        <div className="pl-1">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Extracted Hymns</h3>
                          <div className="space-y-2">
                            {upload.hymns && upload.hymns.length > 0 ? (
                              upload.hymns.map((hymn, hIdx) => {
                                const hymnKey = `${upload.id || uIdx}-${hIdx}`;
                                const isExpanded = expandedHymnKey === hymnKey;
                                
                                return (
                                  <div key={hIdx} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/30 dark:bg-slate-900/20">
                                    <button 
                                      onClick={() => setExpandedHymnKey(isExpanded ? null : hymnKey)}
                                      className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors text-left"
                                    >
                                      <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{hymn.title}</p>
                                        <p className="text-xs text-slate-500">{hymn.mass_part || hymn.category} • {hymn.composer}</p>
                                      </div>
                                      <span className="text-purple-600 dark:text-purple-400 text-sm font-bold ml-2">Lyrics</span>
                                    </button>
                                    {isExpanded && (
                                      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-350 whitespace-pre-wrap leading-relaxed font-serif">
                                        {hymn.lyrics}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-slate-400 italic">No recommendations found for this document.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <FiFileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No upload history found in this session.</p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setShowUploadsModal(false)}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

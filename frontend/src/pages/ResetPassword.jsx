import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiCheck, FiX } from 'react-icons/fi';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { supabase } from '../services/supabaseClient';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [validation, setValidation] = useState({
    hasMinLength: false,
    hasLetter: false,
    hasNumber: false,
    hasSymbol: false,
    isStrong: false
  });

  useEffect(() => {
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[@$!%*#?&^_-]/.test(password);

    setValidation({
      hasMinLength,
      hasLetter,
      hasNumber,
      hasSymbol,
      isStrong: hasMinLength && hasLetter && hasNumber && hasSymbol
    });
  }, [password]);

  const getStrengthText = () => {
    if (password.length === 0) return '';
    if (validation.isStrong) return 'Strong';
    
    // Count met criteria
    const metCriteria = [validation.hasMinLength, validation.hasLetter, validation.hasNumber, validation.hasSymbol].filter(Boolean).length;
    if (metCriteria >= 3) return 'Medium';
    return 'Weak';
  };

  const getStrengthColor = () => {
    if (password.length === 0) return 'bg-slate-200';
    if (validation.isStrong) return 'bg-green-500 text-green-500';
    
    const metCriteria = [validation.hasMinLength, validation.hasLetter, validation.hasNumber, validation.hasSymbol].filter(Boolean).length;
    if (metCriteria >= 3) return 'bg-orange-500 text-orange-500';
    return 'bg-red-500 text-red-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!validation.isStrong || password !== confirmPassword) return;
    
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md px-8 py-10 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Set New Password
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Please enter your new password below. Make sure it's strong and secure.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {errorMsg}
          </div>
        )}

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-600 transition-colors">
                  <FiLock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all placeholder:text-slate-400"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-yellow-600 transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </button>
              </div>

              {/* Password Validation UI */}
              {password.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Password strength:</span>
                    <span className={`font-bold capitalize ${getStrengthColor().split(' ')[1]}`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="flex space-x-1 h-1.5">
                    <div className={`flex-1 rounded-full ${password.length > 0 ? getStrengthColor().split(' ')[0] : 'bg-slate-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${(validation.hasMinLength || validation.hasLetter || validation.hasNumber || validation.hasSymbol) && password.length > 0 ? getStrengthColor().split(' ')[0] : 'bg-slate-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${validation.isStrong ? 'bg-green-500' : 'bg-slate-200'} transition-colors duration-300`}></div>
                  </div>
                  <ul className="text-xs space-y-2 mt-3 font-medium">
                    <li className={`flex items-center space-x-2 ${validation.hasMinLength ? 'text-green-600' : 'text-slate-500'}`}>
                      {validation.hasMinLength ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>At least 8 characters</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${validation.hasLetter ? 'text-green-600' : 'text-slate-500'}`}>
                      {validation.hasLetter ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Contains a letter</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${validation.hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                      {validation.hasNumber ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Contains a number</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${validation.hasSymbol ? 'text-green-600' : 'text-slate-500'}`}>
                      {validation.hasSymbol ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Contains a symbol (@, $, !, %, *, #, ?, &)</span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-600 transition-colors">
                  <FiLock size={20} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className={`w-full pl-12 pr-12 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-yellow-500 transition-all placeholder:text-slate-400 ${
                    confirmPassword.length > 0 
                      ? password === confirmPassword 
                        ? 'border-green-300 focus:ring-green-500/20' 
                        : 'border-red-300 focus:ring-red-500/20'
                      : 'border-slate-200 focus:ring-yellow-500/20'
                  }`}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-yellow-600 transition-colors focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`text-xs font-medium pl-1 ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !validation.isStrong || password !== confirmPassword}
              className="w-full py-3 px-6 rounded-xl bg-yellow-500 text-white font-bold text-base hover:bg-yellow-600 shadow-md hover:shadow-yellow-500/30 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center mt-4"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300 text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
              <FiCheck size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Password reset successful!</h2>
            <p className="text-slate-500 text-sm">
              Redirecting you to login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

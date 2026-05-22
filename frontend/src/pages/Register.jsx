import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiArrowRight, FiCheck, FiX } from 'react-icons/fi';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { supabase } from '../services/supabaseClient';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [validation, setValidation] = useState({
    hasMinLength: false,
    hasNumber: false,
    hasSymbol: false,
    notContainsNameOrEmail: true,
    strength: 'weak',
    isStrong: false
  });

  useEffect(() => {
    const validatePassword = (password, name, email) => {
      const hasMinLength = password.length >= 8;
      const hasNumber = /[0-9]/.test(password);
      const hasSymbol = /[@$!%*#?&_\-+=]/.test(password);
      const containsName = name && password.toLowerCase().includes(name.toLowerCase());
      const containsEmail = email && email.includes('@') && password.toLowerCase().includes(email.split('@')[0].toLowerCase());
      const notContainsNameOrEmail = password.length > 0 ? (!containsName && !containsEmail) : false;

      const passedChecks = [
        hasMinLength, 
        hasNumber, 
        hasSymbol, 
        notContainsNameOrEmail
      ].filter(Boolean).length;

      const strength = 
        passedChecks <= 1 ? 'weak' :
        passedChecks <= 3 ? 'medium' : 'strong';

      const isStrong = 
        hasMinLength && 
        hasNumber && 
        hasSymbol && 
        notContainsNameOrEmail;

      return {
        hasMinLength,
        hasNumber,
        hasSymbol,
        notContainsNameOrEmail,
        strength,
        isStrong
      };
    };

    setValidation(validatePassword(password, name, email));
  }, [password, name, email]);

  const getStrengthColor = () => {
    if (password.length === 0) return 'bg-slate-200 text-slate-500';
    if (validation.strength === 'strong') return 'bg-green-500 text-green-500';
    if (validation.strength === 'medium') return 'bg-orange-500 text-orange-500';
    return 'bg-red-500 text-red-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!validation.isStrong || password !== confirmPassword || !agreeTerms) return;
    
    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate('/login');
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 relative overflow-hidden py-12">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md px-8 py-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-primary-700 mb-2 tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-500 font-medium">Join HymnMatch today</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                  <FiUser size={20} />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                  <FiMail size={20} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                  <FiLock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                  placeholder="Create Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors focus:outline-none"
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
                      {validation.strength}
                    </span>
                  </div>
                  {/* Strength Bar */}
                  <div className="flex space-x-1 h-1.5">
                    <div className={`flex-1 rounded-full ${password.length > 0 ? getStrengthColor().split(' ')[0] : 'bg-slate-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${(validation.strength === 'medium' || validation.strength === 'strong') && password.length > 0 ? getStrengthColor().split(' ')[0] : 'bg-slate-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${validation.strength === 'strong' ? 'bg-green-500' : 'bg-slate-200'} transition-colors duration-300`}></div>
                  </div>
                  {/* Validation rules */}
                  <ul className="text-xs space-y-2 mt-3 font-medium">
                    <li className={`flex items-center space-x-2 ${validation.hasMinLength ? 'text-green-600' : 'text-slate-500'}`}>
                      {validation.hasMinLength ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>At least 8 characters</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${validation.hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                      {validation.hasNumber ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Contains a number</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${validation.hasSymbol ? 'text-green-600' : 'text-slate-500'}`}>
                      {validation.hasSymbol ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Contains a symbol (@$!%*#?&amp;_-+=)</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${validation.notContainsNameOrEmail ? 'text-green-600' : 'text-slate-500'}`}>
                      {validation.notContainsNameOrEmail ? <FiCheck className="text-green-500 shrink-0" /> : <FiX className="text-red-400 shrink-0" />}
                      <span>Cannot contain your name or email address</span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                  <FiLock size={20} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className={`w-full pl-12 pr-12 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:border-purple-500 transition-all placeholder:text-slate-400 ${
                    confirmPassword.length > 0 
                      ? password === confirmPassword 
                        ? 'border-green-300 focus:ring-green-500/20' 
                        : 'border-red-300 focus:ring-red-500/20'
                      : 'border-slate-200 focus:ring-purple-500/20'
                  }`}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </button>
              </div>
              {/* Confirm Password Feedback */}
              {confirmPassword.length > 0 && (
                <div className={`text-xs font-medium pl-1 ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>

            {/* Terms and Privacy Checkbox Row */}
            <div className="flex items-start pt-2">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
              </div>
              <div className="ml-2 text-sm">
                <label htmlFor="terms" className="text-slate-600 font-medium cursor-pointer">
                  I agree to the{' '}
                </label>
                <button
                  type="button"
                  className="text-purple-600 font-bold hover:text-purple-700 focus:outline-none transition-colors"
                  onClick={() => setShowTermsModal(true)}
                >
                  Terms &amp; Conditions
                </button>
                <span className="text-slate-600 font-medium"> and </span>
                <button
                  type="button"
                  className="text-purple-600 font-bold hover:text-purple-700 focus:outline-none transition-colors"
                  onClick={() => setShowPrivacyModal(true)}
                >
                  Privacy Policy
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !validation.isStrong || password !== confirmPassword || !agreeTerms}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-primary-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 mt-2"
            >
              {loading ? (
                <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign Up</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 font-bold hover:text-purple-700 transition-colors">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Terms &amp; Conditions</h2>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-600 leading-relaxed space-y-4">
              <p className="font-medium text-slate-800">Last updated: March 2026</p>
              
              <div>
                <h3 className="font-bold text-slate-800 mb-1">1. Acceptance of Terms</h3>
                <p>By accessing and using HymnMatch, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this service.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">2. Use of Service</h3>
                <p>HymnMatch is designed exclusively for liturgical and church music planning purposes. You agree to use this service only for its intended purpose of selecting hymns for religious services. Commercial resale or redistribution of AI-generated recommendations is strictly prohibited.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">3. User Accounts</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information during registration. Each user is permitted one account only.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">4. Uploaded Documents</h3>
                <p>Documents and images you upload are processed in temporary memory only and are not permanently stored on our servers. You retain full ownership of all content you upload. By uploading, you confirm you have the right to use and share the content for music planning purposes.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">5. AI-Generated Recommendations</h3>
                <p>Song recommendations are generated by artificial intelligence and are meant to assist, not replace, your liturgical judgment. HymnMatch does not guarantee the doctrinal accuracy or appropriateness of any recommendation. Final song selection remains solely your responsibility.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">6. Intellectual Property</h3>
                <p>HymnMatch and its original content, features, and functionality are the property of the HymnMatch development team. Lyrics displayed are used for reference purposes only.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">7. Limitation of Liability</h3>
                <p>HymnMatch is provided as-is without warranties of any kind. We are not liable for any decisions made based on AI-generated recommendations or any disruption of service.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">8. Changes to Terms</h3>
                <p>We reserve the right to update these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms.</p>
              </div>

              <p className="pt-2 font-medium">Contact: hymnmatch.support@gmail.com</p>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Privacy Policy</h2>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-600 leading-relaxed space-y-4">
              <p className="font-medium text-slate-800">Last updated: January 2025</p>
              
              <div>
                <h3 className="font-bold text-slate-800 mb-1">1. Information We Collect</h3>
                <p>We collect the following personal information:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Full name (for account identification)</li>
                  <li>Email address (for authentication and password recovery)</li>
                  <li>Liturgical preferences (default season setting)</li>
                  <li>Usage activity logs (uploads, saved songs)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">2. How We Use Your Information</h3>
                <p>Your information is used solely to:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Provide and improve the HymnMatch service</li>
                  <li>Authenticate your identity securely</li>
                  <li>Send password reset emails when requested</li>
                  <li>Display personalized liturgical recommendations</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">3. Data Storage and Security</h3>
                <p>Your account data is stored securely in Supabase, a PostgreSQL-based platform with enterprise-grade security. Uploaded liturgical documents are processed in temporary browser memory only and are never permanently stored on our servers.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">4. Data Sharing</h3>
                <p>We do not sell, trade, or share your personal information with third parties. Your data is never used for advertising purposes.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">5. Cookies and Sessions</h3>
                <p>HymnMatch uses secure session tokens for authentication purposes only. We do not use tracking cookies or third-party analytics.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">6. Your Rights</h3>
                <p>You have the right to:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Access your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and data</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">7. Data Retention</h3>
                <p>Your data is retained as long as your account is active. Upon account deletion, all personal data is permanently removed within 30 days.</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1">8. Contact Us</h3>
                <p>For privacy concerns or data requests, contact us at: <br/><strong>hymnmatch.support@gmail.com</strong></p>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, Radio, Mail } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyMagicLink, setPassword, resendMagicLink, clearError } from '../../store/slices/authSlice';
import Toast from '../../components/UserSide/Toast';

const CreatePassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendSuccess, setResendSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, error, magicLinkData } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      navigate('/user-login', { replace: true });
      return;
    }

    // Verify the magic link token
    dispatch(verifyMagicLink(token));
  }, [token, dispatch, navigate]);

  useEffect(() => {
    if (error) {
      setErrors({ submit: error.detail || 'An error occurred' });
    }
  }, [error]);

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { text: 'Contains number', met: /\d/.test(formData.password) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (errors.submit) {
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRequirements.every(req => req.met)) {
      newErrors.password = 'Password does not meet all requirements';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const result = await dispatch(setPassword({ token, password: formData.password }));
    
    if (setPassword.fulfilled.match(result)) {
      navigate('/user-login', { 
        state: { message: 'Password set successfully! You can now login.' }
      });
    }
  };

  const handleResendLink = async () => {
    if (!magicLinkData?.user?.email) return;
    
    setToastMessage(null);
    const result = await dispatch(resendMagicLink(magicLinkData.user.email));
    
    if (resendMagicLink.fulfilled.match(result)) {
      setResendSuccess(true);
      setToastMessage('Magic link has been sent successfully. Please check your email.');
      setToastType('success');
      setTimeout(() => setResendSuccess(false), 5000);
    } else if (resendMagicLink.rejected.match(result)) {
      const errorData = result.payload;
      let errorMsg = 'Failed to send magic link. Please try again.';
      
      if (errorData?.error) {
        errorMsg = errorData.error;
        if (errorData.seconds_remaining) {
          errorMsg = `${errorData.error} (${errorData.seconds_remaining} seconds remaining)`;
        }
      } else if (errorData?.detail) {
        errorMsg = errorData.detail;
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      }
      
      setToastMessage(errorMsg);
      setToastType('error');
    }
  };


  // Show loading while verifying token
  if (!magicLinkData && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (error && !magicLinkData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Invalid or Expired Link</h3>
            <p className="text-red-600 mb-4">
              This password creation link is invalid or has expired.
            </p>
            <button
              onClick={handleResendLink}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Resend Link
            </button>
            {resendSuccess && (
              <p className="text-green-600 mt-3">New link sent to your email!</p>
            )}
          </div>
          <Link to="/user-login" className="text-blue-600 mt-4 inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Animation */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10">
          {/* Animated Radio Waves */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-64 h-64">
              {/* Central Radio Icon */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Radio className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Animated Circles */}
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30 animate-ping"
                  style={{
                    width: `${i * 60}px`,
                    height: `${i * 60}px`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: '3s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-20 animate-bounce" style={{ animationDelay: '1s' }}>
            <div className="w-3 h-3 bg-white/40 rounded-full"></div>
          </div>
          <div className="absolute top-40 right-32 animate-bounce" style={{ animationDelay: '2s' }}>
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
          </div>
          <div className="absolute bottom-32 left-40 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <div className="w-4 h-4 bg-white/50 rounded-full"></div>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <h1 className="text-5xl font-bold mb-6 text-center">Radio Tracker</h1>
          <p className="text-xl text-center text-blue-100 mb-8 max-w-md">
            Welcome to the future of radio monitoring. Create your secure access credentials to get started.
          </p>
          <div className="flex items-center space-x-2 text-blue-200">
            <CheckCircle className="w-5 h-5" />
            <span>Secure • Encrypted • Professional</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="lg:hidden mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Radio className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Password</h2>
            <p className="text-gray-600">Set up your secure access credentials</p>
          </div>

          {/* Form */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Password Requirements */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((requirement, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle 
                        className={`w-4 h-4 ${
                          requirement.met ? 'text-green-500' : 'text-gray-300'
                        } transition-colors`} 
                      />
                      <span className={`text-sm ${
                        requirement.met ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {requirement.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !passwordRequirements.every(req => req.met)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Password & Continue'
                )}
              </button>

              {/* Footer Links */}
              <div className="text-center space-y-2">
                <Link 
                  to="/user-login" 
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Already have a password? Sign in
                </Link>
                {/* Resend Magic Link Section */}
                {magicLinkData?.user?.email && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Mail className="w-4 h-4 text-blue-600 mr-2" />
                      <p className="text-sm text-gray-700">
                        Setting up password for:
                      </p>
                    </div>
                    <p className="text-sm font-medium text-blue-800 mb-3">
                      {magicLinkData.user.email}
                    </p>
                    <button
                      type="button"
                      onClick={handleResendLink}
                      disabled={isLoading || resendSuccess}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {resendSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Link Sent
                        </>
                      ) : (
                        'Resend Magic Link'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
          type={toastType}
        />
      )}
    </div>
  );
};

export default CreatePassword;
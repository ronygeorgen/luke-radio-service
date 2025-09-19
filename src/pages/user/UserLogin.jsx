import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Radio, Eye, EyeOff, ArrowRight, Waves, Signal } from 'lucide-react';

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
    
    setIsLoading(true);
    setTimeout(() => {
      console.log('User login:', formData);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Animation */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5">
          {/* Animated Signal Towers */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-80 h-80">
              {/* Central Signal Tower */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Signal className="w-10 h-10 text-white" />
                </div>
              </div>
              
              {/* Animated Signal Waves */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white/20 animate-pulse"
                  style={{
                    width: `${i * 70}px`,
                    height: `${i * 70}px`,
                    borderRadius: '50%',
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}

              {/* Floating Radio Icons */}
              <div className="absolute top-16 left-16 animate-float" style={{ animationDelay: '0s' }}>
                <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                  <Radio className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="absolute top-20 right-20 animate-float" style={{ animationDelay: '1s' }}>
                <div className="w-6 h-6 bg-white/25 rounded-lg flex items-center justify-center">
                  <Waves className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="absolute bottom-20 left-24 animate-float" style={{ animationDelay: '2s' }}>
                <div className="w-10 h-10 bg-white/35 rounded-lg flex items-center justify-center">
                  <Signal className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-24 right-16 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="w-7 h-7 bg-white/40 rounded-lg flex items-center justify-center">
                  <Radio className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border border-white/20"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <h1 className="text-5xl font-bold mb-6 text-center">Welcome Back</h1>
          <p className="text-xl text-center text-blue-100 mb-8 max-w-md">
            Access your Radio Tracker dashboard and continue monitoring your channels with precision.
          </p>
          <div className="flex items-center space-x-6 text-blue-200">
            <div className="flex items-center space-x-2">
              <Signal className="w-5 h-5" />
              <span>Live Monitoring</span>
            </div>
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5" />
              <span>Multi-Channel</span>
            </div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600">Access your Radio Tracker account</p>
          </div>

          {/* Form */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
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
                    placeholder="Enter your password"
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link to="/create-password" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>

              {/* Divider */}
              {/* <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
              </div> */}

              {/* Create Account Link */}
              {/* <div className="text-center">
                <Link 
                  to="/create-password" 
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  First time here? Create your password
                </Link>
              </div> */}
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link 
              to="/admin-login" 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default UserLogin;
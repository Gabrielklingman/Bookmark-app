import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthForms = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, login } = useAuth();

  const commonInputClasses = "w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition duration-200 bg-bg-primary text-text-primary"; // Use theme variables
  
  const primaryButtonClasses = "w-full py-3 px-6 rounded-xl font-semibold " +
                               "bg-gradient-to-r from-accent-start to-white " + 
                               "text-white " + // Changed text-text-primary to text-white
                               "hover:from-purple-700 hover:to-gray-100 " +
                               "focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 transition duration-200 " +
                               "disabled:opacity-50 disabled:cursor-not-allowed";
  
  const linkButtonClasses = "text-sm text-purple-600 hover:underline cursor-pointer";

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { user, error } = await login(email, password);
    
    if (error) {
      setError(formatFirebaseError(error));
    } else {
      // Login successful, close modal
      onClose();
    }
    
    setLoading(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { user, error } = await signup(email, password);
    
    if (error) {
      setError(formatFirebaseError(error));
    } else {
      // Signup successful, close modal
      onClose();
    }
    
    setLoading(false);
  };

  // Format Firebase error messages to be more user-friendly
  const formatFirebaseError = (error) => {
    if (error.includes('email-already-in-use')) {
      return 'An account with this email already exists.';
    }
    if (error.includes('weak-password')) {
      return 'Password is too weak. Please choose a stronger password.';
    }
    if (error.includes('invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (error.includes('wrong-password') || error.includes('invalid-credential')) {
      return 'Invalid email or password. Please try again.';
    }
    if (error.includes('user-not-found')) {
      return 'No account found with this email address.';
    }
    if (error.includes('too-many-requests')) {
      return 'Too many failed attempts. Please try again later.';
    }
    // Return original error if no specific match
    return error;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary rounded-xl p-8 shadow-2xl max-w-md w-full relative"> {/* Use bg-bg-primary */}
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-2xl font-bold" // Use theme variables
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold text-center text-text-primary mb-8"> {/* Use text-text-primary */}
          {isLogin ? 'Welcome Back!' : 'Join AuraMark'}
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLogin ? (
          // Login Form
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="sr-only">Email address</label>
              <input
                type="email"
                id="login-email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={commonInputClasses}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="sr-only">Password</label>
              <input
                type="password"
                id="login-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={commonInputClasses}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className={primaryButtonClasses} disabled={loading}>
              {loading ? 'Signing In...' : 'Login'}
            </button>
            <p className="text-center text-text-secondary text-sm mt-4"> {/* Use text-text-secondary */}
              Don't have an account?{' '}
              <span onClick={() => setIsLogin(false)} className={linkButtonClasses}>
                Sign Up
              </span>
            </p>
          </form>
        ) : (
          // Signup Form
          <form onSubmit={handleSignupSubmit} className="space-y-6">
            <div>
              <label htmlFor="signup-email" className="sr-only">Email address</label>
              <input
                type="email"
                id="signup-email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={commonInputClasses}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="sr-only">Password</label>
              <input
                type="password"
                id="signup-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={commonInputClasses}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="signup-confirm-password" className="sr-only">Confirm Password</label>
              <input
                type="password"
                id="signup-confirm-password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={commonInputClasses}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className={primaryButtonClasses} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
            <p className="text-center text-text-secondary text-sm mt-4"> {/* Use text-text-secondary */}
              Already have an account?{' '}
              <span onClick={() => setIsLogin(true)} className={linkButtonClasses}>
                Login
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForms;
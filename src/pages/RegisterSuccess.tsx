import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VerificationStatus } from '../types/auth';

interface LocationState {
  email?: string;
  verification_status?: VerificationStatus;
  message?: string;
  user_type?: 'organization' | 'government' | 'political_figure';
}

export default function RegisterSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  useEffect(() => {
    // Redirect if no state (direct access)
    if (!state) {
      navigate('/register');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const getVerificationStatusColor = (status?: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'text-mtaji-primary';
      case 'under_review':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-mtaji-light-gray';
    }
  };

  const getVerificationStatusIcon = (status?: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return '✓';
      case 'under_review':
        return '⏳';
      case 'rejected':
        return '✗';
      default:
        return '📋';
    }
  };

  const getUserTypeDisplay = (type?: string) => {
    switch (type) {
      case 'organization':
        return 'Social Organization';
      case 'government':
        return 'Government Entity';
      case 'political_figure':
        return 'Political Figure';
      default:
        return 'Account';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtaji-purple via-mtaji-navy to-black text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-8xl mb-6"
          >
            ✅
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-heading font-black mb-4">
            Registration <span className="text-mtaji-primary">Successful!</span>
          </h1>

          {/* Message */}
          <p className="text-xl text-mtaji-light-gray mb-8">
            Your {getUserTypeDisplay(state.user_type)} account has been created successfully.
          </p>

          {/* Verification Status Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className={`text-3xl ${getVerificationStatusColor(state.verification_status)}`}>
                {getVerificationStatusIcon(state.verification_status)}
              </span>
              <div className="text-left">
                <div className="text-sm text-mtaji-light-gray">Verification Status</div>
                <div className={`text-xl font-bold capitalize ${getVerificationStatusColor(state.verification_status)}`}>
                  {state.verification_status || 'Pending'}
                </div>
              </div>
            </div>

            {state.message && (
              <p className="text-sm text-mtaji-light-gray mt-4">
                {state.message}
              </p>
            )}
          </div>

          {/* Email Confirmation - Prominent */}
          {state.email && (
            <div className="bg-mtaji-primary/20 border-2 border-mtaji-primary rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="text-3xl">📧</div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-xl mb-3 text-mtaji-primary">Email Confirmation Sent!</h3>
                  <p className="text-sm text-white mb-3">
                    We've sent a confirmation email to:
                  </p>
                  <p className="text-white font-mono text-sm break-all bg-black/20 p-2 rounded mb-3">
                    {state.email}
                  </p>
                  <div className="bg-black/20 rounded-lg p-4 mt-4">
                    <p className="text-sm text-white font-semibold mb-2">⚠️ Important:</p>
                    <p className="text-xs text-mtaji-light-gray">
                      Please check your inbox (and spam folder) and click the verification link to activate your account. 
                      After verification, you'll be automatically redirected to your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4">What Happens Next?</h3>
            <ol className="space-y-3 text-sm text-mtaji-light-gray">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mtaji-primary/20 flex items-center justify-center text-mtaji-primary font-bold text-xs">
                  1
                </span>
                <span>
                  <strong className="text-white">Email Verification:</strong> Click the verification link in your email to activate your account. You'll be redirected to your dashboard automatically.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mtaji-primary/20 flex items-center justify-center text-mtaji-primary font-bold text-xs">
                  2
                </span>
                <span>
                  <strong className="text-white">Document Review:</strong> Our team will review your uploaded documents (24-48 hours).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mtaji-primary/20 flex items-center justify-center text-mtaji-primary font-bold text-xs">
                  3
                </span>
                <span>
                  <strong className="text-white">Account Activation:</strong> Once verified, you'll receive an email notification and can start using the platform.
                </span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold hover:bg-white/15 transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold hover:bg-white/15 transition-colors"
            >
              Back to Home
            </button>
          </div>
          
          {/* Note about email confirmation */}
          {state.email && (
            <div className="mt-6 text-center">
              <p className="text-sm text-mtaji-medium-gray">
                After clicking the verification link in your email, you'll be automatically redirected to your dashboard.
              </p>
            </div>
          )}

          {/* Support */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-sm text-mtaji-medium-gray mb-2">
              Need help? Contact our support team
            </p>
            <a
              href="mailto:support@mtaji.com"
              className="text-mtaji-primary hover:underline text-sm"
            >
              support@mtaji.com
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

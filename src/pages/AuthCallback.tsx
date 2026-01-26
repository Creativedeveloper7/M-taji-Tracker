import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from URL (Supabase email confirmation includes tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params (some flows use query params)
        const code = searchParams.get('code');
        const token = searchParams.get('token');

        if (type === 'signup' || code || token || accessToken) {
          // Exchange the code/token for a session
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
          } else if (accessToken && refreshToken) {
            // Set the session directly
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
          }

          // Refresh the user profile after session is set
          await refreshProfile();

          setStatus('success');
          setMessage('Email verified successfully! Redirecting to dashboard...');

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // No auth tokens found, might be a direct visit
          setStatus('error');
          setMessage('Invalid verification link. Please try again or contact support.');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, refreshProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtaji-purple via-mtaji-navy to-black text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 md:p-12">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mtaji-primary mx-auto mb-6"></div>
              <h1 className="text-2xl font-heading font-black mb-4">Verifying Email</h1>
              <p className="text-mtaji-light-gray">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-6xl mb-6"
              >
                ✅
              </motion.div>
              <h1 className="text-2xl font-heading font-black mb-4 text-mtaji-primary">
                Email Verified!
              </h1>
              <p className="text-mtaji-light-gray mb-6">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-6">❌</div>
              <h1 className="text-2xl font-heading font-black mb-4 text-red-400">
                Verification Failed
              </h1>
              <p className="text-mtaji-light-gray mb-6">{message}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-mtaji-primary rounded-lg font-semibold hover:bg-mtaji-primary-dark transition-colors"
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
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

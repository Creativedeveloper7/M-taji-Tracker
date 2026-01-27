import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserType } from '../types/auth';

export default function Register() {
  const navigate = useNavigate();
  const [, setSelectedUserType] = useState<UserType | null>(null);

  const userTypes = [
    {
      type: 'organization' as UserType,
      icon: '🏢',
      title: 'Social Organization',
      description: 'NGOs, CBOs, NPOs, and community groups focused on development projects',
      features: [
        'Create and track initiatives',
        'Manage team members',
        'Upload verification documents',
        'Public transparency profile',
      ],
    },
    {
      type: 'government' as UserType,
      icon: '🏛️',
      title: 'Government Entity',
      description: 'National and county governments, ministries, departments, and agencies',
      features: [
        'Publish official projects',
        'Budget allocation tracking',
        'Multi-user access control',
        'Verified government badge',
      ],
    },
    {
      type: 'political_figure' as UserType,
      icon: '👤',
      title: 'Political Figure',
      description: 'Governors, MPs, Senators, and MCAs with manifesto commitments',
      features: [
        'Upload manifesto for AI analysis',
        'Track campaign promises',
        'Commission development projects',
        'Public accountability dashboard',
      ],
    },
  ];

  const handleSelectUserType = (type: UserType) => {
    setSelectedUserType(type);
    // Navigate to specific registration form
    if (type === 'organization') {
      navigate('/register/organization');
    } else if (type === 'government') {
      navigate('/register/government');
    } else if (type === 'political_figure') {
      navigate('/political-figures/register');
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          <div className="text-sm text-secondary">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-accent-primary hover:underline font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-heading font-black mb-6 text-primary">
            Join the <span className="text-accent-primary">Transparency</span> Revolution
          </h1>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Select your account type to get started. All accounts are verified to ensure transparency and accountability.
          </p>
        </motion.div>

        {/* User Type Selection Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {userTypes.map((userType, index) => (
            <motion.div
              key={userType.type}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectUserType(userType.type)}
                className="w-full bg-secondary border-2 border-subtle rounded-lg p-8 text-left transition-all duration-300 hover:border-accent-primary hover:bg-overlay group"
              >
                {/* Icon */}
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">
                  {userType.icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-heading font-bold mb-3 text-primary group-hover:text-accent-primary transition-colors">
                  {userType.title}
                </h2>

                {/* Description */}
                <p className="text-secondary mb-6">
                  {userType.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {userType.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-accent-primary mt-0.5">✓</span>
                      <span className="text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="flex items-center justify-between text-accent-primary font-semibold">
                  <span>Get Started</span>
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <p className="text-muted mb-6">Trusted by development organizations across Kenya</p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-primary">24-48hrs</div>
              <div className="text-sm text-secondary">Verification Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-primary">100%</div>
              <div className="text-sm text-secondary">Secure & Encrypted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-primary">500+</div>
              <div className="text-sm text-secondary">Verified Users</div>
            </div>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 max-w-3xl mx-auto bg-secondary border border-subtle rounded-lg p-6"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔒</div>
            <div>
              <h3 className="font-heading font-bold mb-2 text-primary">Your Security Matters</h3>
              <p className="text-sm text-secondary leading-relaxed">
                All registrations undergo thorough verification including KYC compliance checks,
                document verification, and admin approval. Your data is encrypted and securely stored
                in compliance with data protection regulations.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

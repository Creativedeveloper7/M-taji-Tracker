import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import masaiImage from '../images/masai.png';
import kibandaImage from '../images/kibanda.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleCreateInitiative = () => navigate('/map');

  // Images array
  const backgroundImages = [masaiImage, kibandaImage];

  // Rotate images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <div className="bg-gradient-to-br from-mtaji-purple via-mtaji-navy to-black text-white min-h-screen">
      <Header onCreateInitiative={handleCreateInitiative} />

      {/* ====================================================================== */}
      {/*                                HERO                                   */}
      {/* ====================================================================== */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-gray-900"
      >
        {/* Rotating Background Images */}
        <div className="absolute inset-0">
          {backgroundImages.map((image, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{
                opacity: currentImageIndex === index ? 1 : 0,
                scale: currentImageIndex === index ? 1 : 1.1,
              }}
              transition={{
                duration: 1.5,
                ease: 'easeInOut',
              }}
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          ))}
        </div>

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/60 z-0" />

        {/* Animated Background Grid (on top of overlay for subtle effect) */}
        <div className="absolute inset-0 opacity-10 z-[1]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,168,89,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,168,89,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              animation: 'grid-animation 20s linear infinite',
            }}
          />
        </div>

        {/* Floating Orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-mtaji-primary to-transparent rounded-full blur-3xl opacity-30 z-[2]"
        />

        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-mtaji-accent to-transparent rounded-full blur-3xl opacity-20 z-[2]"
        />

        {/* Hero Content */}
        <motion.div
          style={{ y, opacity }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/10 backdrop-blur-lg rounded-full border border-white/20"
          >
            <span className="w-2 h-2 bg-mtaji-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              Real-Time Satellite Monitoring • AI-Powered
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-hero-mobile md:text-hero font-heading font-black mb-6 leading-tight"
          >
            Track Every
            <br />
            <span className="text-mtaji-primary">Promise Made</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl text-mtaji-light-gray mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            The world&apos;s first{' '}
            <span className="text-mtaji-primary font-semibold">
              satellite-powered platform
            </span>{' '}
            that validates and monitors development projects in real time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: '0 20px 40px rgba(0,168,89,0.4)',
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/initiatives')}
              className="px-8 py-4 bg-gradient-to-r from-mtaji-primary to-mtaji-primary-dark rounded-lg font-heading font-bold text-lg text-white shadow-green"
            >
              🛰️ Track a Project →
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateInitiative}
              className="px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/30 rounded-lg font-heading font-bold text-lg"
            >
              📊 Request Demo
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              { value: '1,247', label: 'Projects Tracked', icon: '🎯' },
              { value: '47', label: 'Counties Covered', icon: '📍' },
              { value: '99.8%', label: 'Accuracy Rate', icon: '✓' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-mtaji-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-mtaji-medium-gray">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-white rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* ====================================================================== */}
      {/*                              FEATURES                                  */}
      {/* ====================================================================== */}
      <section className="py-section bg-mtaji-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-heading font-black mb-6 text-mtaji-dark-gray">
              The <span className="text-mtaji-primary">Transparency</span> Revolution
            </h2>
            <p className="text-xl text-mtaji-medium-gray max-w-3xl mx-auto">
              Powered by satellite imagery and AI-driven analysis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🛰️',
                title: 'Satellite Monitoring',
                description: 'Real-time imagery from Sentinel-2 satellites captures every change, every day',
              },
              {
                icon: '🤖',
                title: 'AI Analysis',
                description: 'Advanced machine learning detects construction progress and flags stalled projects automatically',
              },
              {
                icon: '📊',
                title: 'Live Dashboard',
                description: 'Track every project from groundbreaking to completion with interactive timeline controls',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white border border-mtaji-light-gray rounded-3xl p-8 shadow-md"
              >
                <div className="text-6xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-heading font-bold mb-4 text-mtaji-dark-gray">
                  {feature.title}
                </h3>
                <p className="text-mtaji-medium-gray">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/*                            HOW IT WORKS                                */}
      {/* ====================================================================== */}
      <section className="py-section bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="text-5xl font-heading font-black mb-20">
            How It <span className="text-mtaji-primary">Works</span>
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Register Project',
                description: 'Create your initiative with location, timeline, and goals',
              },
              {
                step: '02',
                title: 'Satellite Capture',
                description: 'Our system automatically captures baseline satellite imagery',
              },
              {
                step: '03',
                title: 'AI Analysis',
                description: 'Machine learning tracks progress and detects changes over time',
              },
              {
                step: '04',
                title: 'Live Updates',
                description: 'Get real-time notifications and visual progress reports',
              },
            ].map(({ step, title, description }) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="text-6xl font-black text-mtaji-primary opacity-40 mb-4">
                  {step}
                </div>
                <h3 className="text-2xl font-heading font-bold mb-3 text-white">
                  {title}
                </h3>
                <p className="text-mtaji-light-gray text-base leading-relaxed">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/*                                  CTA                                   */}
      {/* ====================================================================== */}
      <section className="py-section bg-white text-center">
        <h2 className="text-5xl font-heading font-black mb-6 text-mtaji-dark-gray">
          Ready to <span className="text-mtaji-primary">Transform</span> Development?
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/initiatives')}
          className="px-12 py-6 bg-gradient-to-r from-mtaji-primary to-mtaji-primary-dark rounded-lg font-heading font-bold text-xl text-white"
        >
          Get Started Now →
        </motion.button>
      </section>

      {/* Animations */}
      <style>{`
        @keyframes grid-animation {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>
    </div>
  );
}

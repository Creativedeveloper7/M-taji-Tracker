import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface LandingPageProps {
  onVolunteerClick: () => void;
}

export default function LandingPage({ onVolunteerClick }: LandingPageProps) {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleCreateInitiative = () => {
    navigate('/map');
  };

  return (
    <div className="bg-gradient-to-br from-mtaji-purple via-mtaji-navy to-black text-white min-h-screen">
      {/* Navigation */}
      <Header 
        onCreateInitiative={handleCreateInitiative} 
        onVolunteerClick={onVolunteerClick} 
      />

      {/* Hero Section with 3D Effect */}
      <section ref={heroRef} className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 bg-gray-900">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0, 168, 89, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0, 168, 89, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            animation: 'grid-animation 20s linear infinite'
          }} />
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-mtaji-primary to-transparent rounded-full blur-3xl opacity-30"
        />

        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-mtaji-accent to-transparent rounded-full blur-3xl opacity-20"
        />

        <motion.div
          style={{ y, opacity }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 backdrop-blur-lg rounded-full border border-white border-opacity-20 mb-8"
          >
            <span className="w-2 h-2 bg-mtaji-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium">Real-Time Satellite Monitoring • AI-Powered</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="text-hero-mobile md:text-hero font-heading font-black mb-6 leading-tight"
          >
            Track Every
            <br />
            <span className="text-mtaji-primary">
              Promise Made
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="text-lg md:text-xl text-mtaji-light-gray mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            The world's first <span className="text-mtaji-primary font-semibold">satellite-powered platform</span> that 
            validates and monitors development projects in real-time. From boreholes to schools, 
            bridges to hospitals—<span className="text-white font-semibold">see progress unfold from space</span>.
          </motion.p>

          {/* CTA Buttons with Advanced Hover Effects */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 168, 89, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/initiatives')}
              className="group relative px-8 py-4 bg-gradient-to-r from-mtaji-primary to-mtaji-primary-dark rounded-lg font-heading font-bold text-lg text-white overflow-hidden shadow-green transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-3">
                🛰️ Track a Project
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-mtaji-primary-dark to-mtaji-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateInitiative}
              className="px-8 py-4 bg-white bg-opacity-10 backdrop-blur-lg border-2 border-white border-opacity-30 rounded-lg font-heading font-bold text-lg text-white hover:bg-opacity-20 transition-all duration-300"
            >
              📊 Request Demo
            </motion.button>
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto"
          >
            {[
              { value: "1,247", label: "Projects Tracked", icon: "🎯" },
              { value: "47", label: "Counties Covered", icon: "📍" },
              { value: "99.8%", label: "Accuracy Rate", icon: "✓" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                className="bg-white bg-opacity-5 backdrop-blur-lg border border-white border-opacity-10 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-mtaji-primary mb-1">{stat.value}</div>
                <div className="text-sm text-mtaji-medium-gray">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white border-opacity-30 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 bg-white rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Impact Section with Parallax */}
      <section id="features" className="py-section-mobile md:py-section relative bg-mtaji-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12 md:mb-20"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black mb-6 text-mtaji-dark-gray">
              The <span className="text-mtaji-primary">Transparency</span> Revolution
            </h2>
            <p className="text-lg md:text-xl text-mtaji-medium-gray max-w-3xl mx-auto">
              Powered by satellite imagery and AI, we're bringing unprecedented accountability 
              to development projects across Kenya and beyond.
            </p>
          </motion.div>

          {/* Feature Cards with Hover Effects */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: "🛰️",
                title: "Satellite Monitoring",
                description: "Real-time imagery from Sentinel-2 satellites captures every change, every day",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: "🤖",
                title: "AI-Powered Analysis",
                description: "Advanced machine learning detects construction progress and flags stalled projects automatically",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: "📊",
                title: "Live Dashboard",
                description: "Track every project from groundbreaking to completion with interactive timeline controls",
                gradient: "from-mtaji-primary to-mtaji-primary-dark"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.6, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl rounded-3xl`} />
                
                <div className="relative bg-white border border-mtaji-light-gray rounded-3xl p-6 md:p-8 h-full shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="text-5xl md:text-6xl mb-4 md:mb-6">{feature.icon}</div>
                  <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 md:mb-4 text-mtaji-dark-gray">{feature.title}</h3>
                  <p className="text-mtaji-medium-gray leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-section-mobile md:py-section relative bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12 md:mb-20"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black mb-6 text-white">
              How It <span className="text-mtaji-primary">Works</span>
            </h2>
            <p className="text-lg md:text-xl text-mtaji-light-gray max-w-3xl mx-auto">
              From project registration to real-time monitoring, see how we bring transparency to development.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { step: "01", title: "Register Project", description: "Create your initiative with location, timeline, and goals" },
              { step: "02", title: "Satellite Capture", description: "Our system automatically captures baseline satellite imagery" },
              { step: "03", title: "AI Analysis", description: "Machine learning tracks progress and detects changes over time" },
              { step: "04", title: "Live Updates", description: "Get real-time notifications and visual progress reports" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.6, ease: "easeOut" }}
                className="text-center"
              >
                <div className="text-5xl md:text-6xl font-black text-mtaji-primary mb-4 opacity-50">{item.step}</div>
                <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-mtaji-light-gray">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-section-mobile md:py-section relative bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black mb-6 text-mtaji-dark-gray">
              Ready to <span className="text-mtaji-primary">Transform</span> Development?
            </h2>
            <p className="text-lg md:text-xl text-mtaji-medium-gray mb-8 md:mb-12">
              Join us in bringing transparency and accountability to development projects across Kenya.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 168, 89, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/initiatives')}
              className="px-10 md:px-12 py-5 md:py-6 bg-gradient-to-r from-mtaji-primary to-mtaji-primary-dark rounded-lg font-heading font-bold text-lg md:text-xl text-white shadow-green-lg hover:shadow-green transition-all duration-300"
            >
              Get Started Now →
            </motion.button>
          </motion.div>
        </div>
      </section>

      <style>{`
        @keyframes grid-animation {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>
    </div>
  );
}

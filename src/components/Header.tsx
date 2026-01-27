import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  onCreateInitiative?: () => void
}

const Header = ({ onCreateInitiative: _onCreateInitiative }: HeaderProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { user, userProfile, completeProfile, signOut, refreshProfile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [initiativesDropdownOpen, setInitiativesDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Refresh profile when user is available but completeProfile might be missing
  useEffect(() => {
    if (user && userProfile && !completeProfile) {
      refreshProfile()
    }
  }, [user, userProfile, completeProfile, refreshProfile])

  // Get display name based on user type
  const getDisplayName = () => {
    if (!userProfile) return user?.email || 'User'
    
    // First check completeProfile for type-specific data
    if (completeProfile?.organization?.organization_name) {
      return completeProfile.organization.organization_name
    }
    if (completeProfile?.government_entity?.entity_name) {
      return completeProfile.government_entity.entity_name
    }
    if (completeProfile?.political_figure?.name) {
      return completeProfile.political_figure.name
    }
    
    // Fallback to changemaker name (most reliable since it's created for all users)
    if (completeProfile?.changemaker?.name) {
      return completeProfile.changemaker.name
    }
    
    // Final fallback to email
    return userProfile.email || user?.email || 'User'
  }

  // Get initials for avatar
  const getInitials = () => {
    const name = getDisplayName()
    if (name === 'User' || !name) return 'U'
    // If it's an email, use first letter
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase()
    }
    // Otherwise, use first letter of first word
    return name.charAt(0).toUpperCase()
  }

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Initiatives', href: '/initiatives', hasDropdown: true },
  ]

  const dropdownOptions = [
    { type: 'initiative', value: 'all', label: 'All Initiatives', href: '/initiatives' },
    { type: 'initiative', value: 'NGO', label: 'NGO', href: '/initiatives?org_type=NGO' },
    { type: 'initiative', value: 'CBO', label: 'CBO', href: '/initiatives?org_type=CBO' },
    { type: 'initiative', value: 'Govt', label: 'Government', href: '/initiatives?org_type=Govt' },
    { type: 'link', value: 'political-figures', label: 'Political Figures', href: '/political-figures' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setInitiativesDropdownOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (initiativesDropdownOpen || userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [initiativesDropdownOpen, userMenuOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      setUserMenuOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Still navigate even if there's an error
      navigate('/')
    }
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    // Check if Initiatives dropdown should be active (for initiatives or political-figures)
    if (href === '/initiatives') {
      return location.pathname.startsWith('/initiatives') || location.pathname.startsWith('/political-figures')
    }
    return location.pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 bg-secondary backdrop-blur-md transition-all duration-300 border-b border-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/Mtaji logo.png" 
              alt="Mtaji Tracker Logo" 
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-heading font-bold text-primary transition-colors duration-300">M-taji Tracker</h1>
            </div>
          </Link>

          {/* Center Links - Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div key={link.href} className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setInitiativesDropdownOpen(!initiativesDropdownOpen)}
                      className={`text-sm font-medium transition-colors duration-300 flex items-center space-x-1 ${
                        isActive(link.href)
                          ? 'text-primary font-semibold'
                          : 'text-secondary hover:text-primary'
                      }`}
                    >
                      <span>{link.label}</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${
                          initiativesDropdownOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {initiativesDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-secondary rounded-lg shadow-lg border border-subtle z-50 overflow-hidden">
                        {dropdownOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              navigate(option.href)
                              setInitiativesDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-3 text-sm text-secondary hover:bg-overlay transition-colors duration-200 ${
                              option.type === 'link' ? 'border-t border-divider mt-1 pt-3' : ''
                            } ${
                              location.pathname === option.href || 
                              (option.type === 'initiative' && location.pathname.startsWith('/initiatives') && 
                               (option.value === 'all' ? !location.search.includes('org_type') : location.search.includes(`org_type=${option.value}`)))
                              ? 'bg-overlay font-medium text-primary' 
                              : ''
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isActive(link.href)
                      ? 'text-primary font-semibold'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Side - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Search Icon */}
            <button
              className="p-2 text-secondary hover:text-primary transition-colors duration-300"
              aria-label="Search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-secondary hover:text-primary transition-colors duration-300"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Auth Buttons or User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2 text-secondary hover:bg-overlay rounded-lg transition-colors duration-300"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: '#121212' }}>
                    {userProfile?.email?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium hidden xl:block">
                    {userProfile?.email || user.email}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-secondary rounded-lg shadow-lg border border-subtle z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-divider">
                      <p className="text-sm font-medium text-primary">
                        {getDisplayName()}
                      </p>
                      {userProfile && (
                        <p className="text-xs text-muted capitalize mt-1">
                          {userProfile.user_type?.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        navigate('/dashboard')
                        setUserMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-secondary hover:bg-overlay transition-colors duration-200"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-overlay transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            {/* Search Icon - Mobile */}
            <button
              className="p-2 text-secondary hover:text-primary transition-colors duration-300"
              aria-label="Search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Theme Toggle - Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 text-secondary hover:text-primary transition-colors duration-300"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-secondary hover:text-primary transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-divider transition-all duration-300">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                if (link.hasDropdown) {
                  return (
                    <div key={link.href} className="px-4">
                      <div className="text-base font-medium text-secondary mb-2">
                        {link.label}
                      </div>
                      <div className="flex flex-col space-y-1 ml-4">
                        {dropdownOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              navigate(option.href)
                              setMobileMenuOpen(false)
                            }}
                            className={`px-4 py-2 text-sm text-secondary hover:bg-overlay rounded-lg transition-colors duration-300 text-left ${
                              option.type === 'link' ? 'border-t border-divider mt-2 pt-3' : ''
                            } ${
                              location.pathname === option.href || 
                              (option.type === 'initiative' && location.pathname.startsWith('/initiatives') && 
                               (option.value === 'all' ? !location.search.includes('org_type') : location.search.includes(`org_type=${option.value}`)))
                              ? 'bg-overlay font-medium text-primary' 
                              : ''
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 text-base font-medium rounded-lg transition-colors duration-300 ${
                      isActive(link.href)
                        ? 'text-primary bg-overlay font-semibold'
                        : 'text-secondary hover:text-primary hover:bg-overlay'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              {/* Auth Buttons - Mobile */}
              {user ? (
                <>
                  <div className="px-4 py-3 border-t border-divider">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: '#121212' }}>
                        {getInitials()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">
                          {getDisplayName()}
                        </p>
                        {userProfile && (
                          <p className="text-xs text-muted capitalize">
                            {userProfile.user_type?.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/dashboard')
                        setMobileMenuOpen(false)
                      }}
                      className="btn-primary w-full text-center mb-2"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 text-center"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-3 border-t border-divider space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-2 text-center text-sm font-medium text-secondary bg-overlay hover:bg-secondary rounded-lg transition-colors duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary block w-full text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

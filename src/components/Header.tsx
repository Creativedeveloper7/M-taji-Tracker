import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

interface HeaderProps {
  onCreateInitiative: () => void
  onVolunteerClick?: () => void
}

const Header = ({ onCreateInitiative, onVolunteerClick }: HeaderProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [initiativesDropdownOpen, setInitiativesDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    }

    if (initiativesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [initiativesDropdownOpen])

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
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-all duration-300 border-b border-gray-200 dark:border-gray-800">
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
              <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white transition-colors duration-300">M-taji Tracker</h1>
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
                          ? 'text-gray-900 dark:text-white font-semibold'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                        {dropdownOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              navigate(option.href)
                              setInitiativesDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                              option.type === 'link' ? 'border-t border-gray-200 dark:border-gray-700 mt-1 pt-3' : ''
                            } ${
                              location.pathname === option.href || 
                              (option.type === 'initiative' && location.pathname.startsWith('/initiatives') && 
                               (option.value === 'all' ? !location.search.includes('org_type') : location.search.includes(`org_type=${option.value}`)))
                              ? 'bg-gray-50 dark:bg-gray-700 font-medium' 
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
                      ? 'text-gray-900 dark:text-white font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
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
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
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

            {/* Volunteer Button */}
            <button
              onClick={onVolunteerClick}
              className="flex items-center space-x-2 px-4 py-2 bg-transparent border border-teal-400 text-teal-400 font-medium rounded-full transition-all duration-300 hover:bg-teal-400/10 hover:shadow-[0_0_12px_rgba(43,199,181,0.3)] hover:shadow-teal-400/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Volunteer</span>
            </button>

            {/* Volunteer Button - Mobile */}
            <button
              onClick={onVolunteerClick}
              className="lg:hidden w-full flex items-center justify-center space-x-2 px-4 py-3 bg-transparent border border-teal-400 text-teal-400 font-medium rounded-full transition-all duration-300 hover:bg-teal-400/10 hover:shadow-[0_0_12px_rgba(43,199,181,0.3)] hover:shadow-teal-400/30 mb-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Volunteer</span>
            </button>

            {/* Create Initiative Button */}
            <button
              onClick={onCreateInitiative}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Create Initiative
            </button>

            {/* Create Initiative Button - Mobile */}
            <button
              onClick={onCreateInitiative}
              className="lg:hidden w-full px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-center"
            >
              Create Initiative
            </button>

          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            {/* Search Icon - Mobile */}
            <button
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
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
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
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
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
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
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-800 transition-all duration-300">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                if (link.hasDropdown) {
                  return (
                    <div key={link.href} className="px-4">
                      <div className="text-base font-medium text-gray-600 dark:text-gray-300 mb-2">
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
                            className={`px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-300 text-left ${
                              option.type === 'link' ? 'border-t border-gray-200 dark:border-gray-700 mt-2 pt-3' : ''
                            } ${
                              location.pathname === option.href || 
                              (option.type === 'initiative' && location.pathname.startsWith('/initiatives') && 
                               (option.value === 'all' ? !location.search.includes('org_type') : location.search.includes(`org_type=${option.value}`)))
                              ? 'bg-gray-100 dark:bg-gray-700 font-medium' 
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
                        ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <button
                onClick={() => {
                  onCreateInitiative()
                  setMobileMenuOpen(false)
                }}
                className="mx-4 mt-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-center"
              >
                Create Initiative
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

import { Link, useLocation } from 'react-router-dom'

interface HeaderProps {
  onCreateInitiative: () => void
}

const Header = ({ onCreateInitiative }: HeaderProps) => {
  const location = useLocation()
  
  return (
    <header className="bg-mtaji-primary text-white shadow-lg z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-mtaji-accent rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-heading font-bold text-mtaji-primary">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">Mtaji Tracker</h1>
              <p className="text-sm text-mtaji-secondary opacity-90">Geospatial Initiative Monitoring</p>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/initiatives" 
                className={`hover:text-mtaji-accent transition-colors duration-300 ${
                  location.pathname === '/initiatives' ? 'text-mtaji-accent font-semibold' : ''
                }`}
              >
                Initiatives
              </Link>
              <a href="#" className="hover:text-mtaji-accent transition-colors duration-300">Analytics</a>
              <a href="#" className="hover:text-mtaji-accent transition-colors duration-300">About</a>
            </nav>
            <button
              onClick={onCreateInitiative}
              className="px-6 py-2 bg-mtaji-accent text-white font-heading font-semibold rounded-xl hover:bg-mtaji-primary-light transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Initiative</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header


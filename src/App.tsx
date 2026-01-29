import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import Initiatives from './pages/Initiatives'
import PoliticalFigures from './pages/PoliticalFigures'
import PoliticalFigureRegister from './pages/PoliticalFigureRegister'
import PoliticalFigureProfile from './pages/PoliticalFigureProfile'
import Register from './pages/Register'
import RegisterOrganization from './pages/RegisterOrganization'
import RegisterGovernment from './pages/RegisterGovernment'
import RegisterSuccess from './pages/RegisterSuccess'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'
import InitiativeDetail from './pages/InitiativeDetail'
import InitiativeOpportunities from './pages/InitiativeOpportunities'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-primary" style={{ opacity: 1 }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/map" element={<Home />} />
              <Route path="/initiatives" element={<Initiatives />} />
              <Route path="/initiatives/:id" element={<InitiativeDetail />} />
              <Route path="/initiatives/:id/opportunities" element={<InitiativeOpportunities />} />
              <Route path="/political-figures" element={<PoliticalFigures />} />
              <Route path="/political-figures/register" element={<PoliticalFigureRegister />} />
              <Route path="/political-figures/:id" element={<PoliticalFigureProfile />} />
              {/* Authentication Routes */}
              <Route path="/register" element={<Register />} />
              <Route path="/register/organization" element={<RegisterOrganization />} />
              <Route path="/register/government" element={<RegisterGovernment />} />
              <Route path="/register/success" element={<RegisterSuccess />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </BrowserRouter>
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App


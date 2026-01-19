import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import VolunteerDrawer from './components/VolunteerDrawer'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import Initiatives from './pages/Initiatives'
import PoliticalFigures from './pages/PoliticalFigures'
import PoliticalFigureRegister from './pages/PoliticalFigureRegister'
import PoliticalFigureProfile from './pages/PoliticalFigureProfile'

function App() {
  const [volunteerDrawerOpen, setVolunteerDrawerOpen] = useState(false)

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900" style={{ opacity: 1 }}>
        <BrowserRouter>
          <VolunteerDrawer 
            isOpen={volunteerDrawerOpen}
            onClose={() => setVolunteerDrawerOpen(false)}
          />
          <Routes>
            <Route path="/" element={
              <LandingPage 
                onVolunteerClick={() => setVolunteerDrawerOpen(true)} 
              />} 
            />
            <Route path="/map" element={<Home />} />
            <Route path="/initiatives" element={<Initiatives />} />
            <Route path="/initiatives/:id" element={<Initiatives />} />
            <Route path="/political-figures" element={<PoliticalFigures />} />
            <Route path="/political-figures/register" element={<PoliticalFigureRegister />} />
            <Route path="/political-figures/:id" element={<PoliticalFigureProfile />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}

export default App


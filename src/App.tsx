import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Initiatives from './pages/Initiatives'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/initiatives" element={<Initiatives />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './screens/LandingPage'
import FreeCheckForm from './screens/FreeCheckForm'
import CompatibilityReport from './screens/CompatibilityReport'
import PlansPage from './screens/PlansPage'
import NumerologyDashboard from './screens/NumerologyDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/free-check" element={<FreeCheckForm />} />
      <Route path="/report/:data" element={<CompatibilityReport />} />
      <Route path="/plans/:data" element={<PlansPage />} />
      <Route path="/numerology/:data" element={<NumerologyDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

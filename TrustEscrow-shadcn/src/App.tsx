import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout'
import { Dashboard } from './pages/dashboard'
import { CreateEscrow } from './pages/create-escrow'
import { EscrowDetails } from './pages/escrow-details'
import { Arbitration } from './pages/arbitration'
import { Profile } from './pages/profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/create" element={<CreateEscrow />} />
        <Route path="/escrow/:address" element={<EscrowDetails />} />
        <Route path="/arbitration" element={<Arbitration />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App

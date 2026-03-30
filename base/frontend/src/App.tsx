import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthContext'
import Navbar from './components/shared/Navbar'
import Home from './pages/Home'
import ResetPassword from './pages/ResetPassword'
import DashbordUser from './pages/dashbordUser/DashbordUser.tsx'
import LolProfile from './pages/lol/LolProfile'
import LolMatch from './pages/lol/LolMatch'
import LolLive from './pages/lol/LolLive'
import LolRanking from './pages/lol/LolRanking'
import LolServer from './pages/lol/LolServer'
import LolClash from './pages/lol/LolClash'
import LolClashTournaments from './pages/lol/LolClashTournaments'
import TftProfile from './pages/tft/TftProfile'
import TftMatch from './pages/tft/TftMatch'
import TftRanking from './pages/tft/TftRanking'
import TftServer from './pages/tft/TftServer'
import ValorantProfile from './pages/valorant/ValorantProfile'
import ValorantMatch from './pages/valorant/ValorantMatch'
import ValorantServer from './pages/valorant/ValorantServer'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Home />} />
            <Route path="/register" element={<Home />} />
            <Route path="/forgot-password" element={<Home />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<DashbordUser />} />
            <Route path="/" element={<Home />} />

          {/* LoL */}
          <Route path="/lol/:region/:gameName/:tagLine" element={<LolProfile />} />
          <Route path="/lol/:region/partida/:matchId" element={<LolMatch />} />
          <Route path="/lol/:region/:gameName/:tagLine/aovivo" element={<LolLive />} />
          <Route path="/lol/ranking" element={<LolRanking />} />
          <Route path="/lol/servidor" element={<LolServer />} />
          <Route path="/lol/clash/torneios" element={<LolClashTournaments />} />
          <Route path="/lol/clash/:region/:gameName/:tagLine" element={<LolClash />} />

          {/* TFT */}
          <Route path="/tft/:region/:gameName/:tagLine" element={<TftProfile />} />
          <Route path="/tft/:region/partida/:matchId" element={<TftMatch />} />
          <Route path="/tft/ranking" element={<TftRanking />} />
          <Route path="/tft/servidor" element={<TftServer />} />

          {/* Valorant */}
          <Route path="/valorant/:region/:gameName/:tagLine" element={<ValorantProfile />} />
          <Route path="/valorant/:region/partida/:matchId" element={<ValorantMatch />} />
          <Route path="/valorant/servidor" element={<ValorantServer />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

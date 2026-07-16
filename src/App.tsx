import { Navigate, Route, Routes } from 'react-router-dom';
import { SacredBackground } from './components/SacredBackground';
import { useSanctuary } from './hooks/SanctuaryContext';
import { HomePage } from './pages/HomePage';
import { LinkPage } from './pages/LinkPage';
import { LoomPage } from './pages/LoomPage';
import { ObservatoryPage } from './pages/ObservatoryPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { OraclePage } from './pages/OraclePage';
import { PinPage } from './pages/PinPage';
import { VaultPage } from './pages/VaultPage';
import { VowWallPage } from './pages/VowWallPage';
import { DreamsPage } from './pages/DreamsPage';
import { TemplePage } from './pages/TemplePage';

function Guard({ children }: { children: React.ReactNode }) {
  const { state } = useSanctuary();
  if (!state.pactAccepted) return <Navigate to="/onboarding" replace />;
  if (!state.unlocked) return <Navigate to="/pin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="app-shell">
      <SacredBackground />
      <div className="content">
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/pin" element={<PinPage />} />
          <Route
            path="/"
            element={
              <Guard>
                <HomePage />
              </Guard>
            }
          />
          <Route
            path="/vow-wall"
            element={
              <Guard>
                <VowWallPage />
              </Guard>
            }
          />
          <Route
            path="/loom"
            element={
              <Guard>
                <LoomPage />
              </Guard>
            }
          />
          <Route
            path="/oracle"
            element={
              <Guard>
                <OraclePage />
              </Guard>
            }
          />
          <Route
            path="/link"
            element={
              <Guard>
                <LinkPage />
              </Guard>
            }
          />
          <Route
            path="/vault"
            element={
              <Guard>
                <VaultPage />
              </Guard>
            }
          />
          <Route
            path="/observatory"
            element={
              <Guard>
                <ObservatoryPage />
              </Guard>
            }
          />
          <Route
            path="/dreams"
            element={
              <Guard>
                <DreamsPage />
              </Guard>
            }
          />
          <Route
            path="/temple"
            element={
              <Guard>
                <TemplePage />
              </Guard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

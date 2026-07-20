import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Checklist from './pages/Checklist';
import CadastrarEstabelecimento from './pages/CadastrarEstabelecimento';
import MeusEstabelecimentos from './pages/MeusEstabelecimentos';
import SyncDashboard from './pages/SyncDashboard';
import MinhasReservas from './pages/MinhasReservas';
import ReservasRecebidas from './pages/ReservasRecebidas';
import CalendarioReservas from './pages/CalendarioReservas';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { SearchProvider } from '@/components/search/SearchContext';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>} />
        ))}
        <Route path="/Checklist" element={<LayoutWrapper currentPageName="Checklist"><Checklist /></LayoutWrapper>} />
        <Route path="/CadastrarEstabelecimento" element={<LayoutWrapper currentPageName="CadastrarEstabelecimento"><CadastrarEstabelecimento /></LayoutWrapper>} />
        <Route path="/MeusEstabelecimentos" element={<LayoutWrapper currentPageName="MeusEstabelecimentos"><MeusEstabelecimentos /></LayoutWrapper>} />
        <Route path="/SyncDashboard" element={<LayoutWrapper currentPageName="SyncDashboard"><SyncDashboard /></LayoutWrapper>} />
        <Route path="/MinhasReservas" element={<LayoutWrapper currentPageName="MinhasReservas"><MinhasReservas /></LayoutWrapper>} />
        <Route path="/ReservasRecebidas" element={<LayoutWrapper currentPageName="ReservasRecebidas"><ReservasRecebidas /></LayoutWrapper>} />
        <Route path="/CalendarioReservas" element={<LayoutWrapper currentPageName="CalendarioReservas"><CalendarioReservas /></LayoutWrapper>} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <SearchProvider>
            <NavigationTracker />
            <AuthenticatedApp />
          </SearchProvider>
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
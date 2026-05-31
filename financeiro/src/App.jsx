import { Toaster } from "@/components/ui/toaster"
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClientInstance, persister } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import MobileLayout from '@/components/layout/MobileLayout';
import Dashboard from '@/pages/Dashboard';
import ScanReceipt from '@/pages/ScanReceipt';
import Expenses from '@/pages/Expenses';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Reports from '@/pages/Reports';
import Login from '@/pages/Login';

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<MobileLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan" element={<ScanReceipt />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <PersistQueryClientProvider 
         client={queryClientInstance} 
         persistOptions={{ persister }}
      >
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </PersistQueryClientProvider>
    </AuthProvider>
  )
}

export default App
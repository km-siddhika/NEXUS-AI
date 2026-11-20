import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from './components/UiPrimitives';
import { ThemeProvider } from './contexts/ThemeContext';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext';
import DashboardLayout from './layouts/DashboardLayout';
import AiStudioPage from './pages/AiStudioPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import CollaboratePage from './pages/CollaboratePage';
import DiscoverPage from './pages/DiscoverPage';
import LandingPage from './pages/LandingPage';
import {
  AboutPage,
  ContactPage,
  DocsPage,
  PrivacyPage,
  TermsPage,
} from './pages/LegalInfoPages';
import OverviewPage from './pages/OverviewPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectWorkspacePage from './pages/ProjectWorkspacePage';
import ReportsPage from './pages/ReportsPage';
import { HelpCentrePage, SettingsPage } from './pages/SettingsAndHelpPages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useWorkspace();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC] dark:bg-[#0D0E14]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-lg border-2 border-[#7955E8] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium text-[#777789]">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useWorkspace();
  if (authLoading) return null;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing & Legal Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Authentication Routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            {/* Protected Dashboard Workspace Routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="discover" element={<DiscoverPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectWorkspacePage />} />
              <Route path="studio" element={<AiStudioPage />} />
              <Route path="collaborate" element={<CollaboratePage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="help" element={<HelpCentrePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </WorkspaceProvider>
    </ThemeProvider>
  );
}

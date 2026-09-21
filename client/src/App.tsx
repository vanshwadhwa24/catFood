import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { GalleryPage } from './pages/GalleryPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TeamPage } from './pages/TeamPage';
import { SubmitPage } from './pages/SubmitPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrganizerPage } from './pages/OrganizerPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:slug" element={<EventDetailPage />} />
              <Route path="/events/:slug/gallery" element={<GalleryPage />} />
              <Route path="/events/:slug/gallery/:submissionId" element={<ProjectDetailPage />} />
              <Route path="/invites/:token" element={<InviteAcceptPage />} />

              {/* Participant Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:slug/team"
                element={
                  <ProtectedRoute>
                    <TeamPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:slug/submit"
                element={
                  <ProtectedRoute>
                    <SubmitPage />
                  </ProtectedRoute>
                }
              />

              {/* Organizer Protected Routes */}
              <Route
                path="/organizer"
                element={
                  <ProtectedRoute requiredRoles={['ORGANIZER', 'ADMIN']}>
                    <OrganizerPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/events" replace />} />
            </Routes>
          </main>
          <footer className="py-8 border-t border-glass text-center text-xs text-secondary mt-12">
            <div className="container">
              DogFood Hackathon Platform &copy; 2026. Built with modern React & TypeScript.
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

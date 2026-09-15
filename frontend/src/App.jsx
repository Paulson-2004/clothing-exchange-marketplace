import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import ScrollToTop from './components/layout/ScrollToTop';
import ProtectedRoute from './components/layout/ProtectedRoute';
// CODE SPLITTING:
// We use React.lazy() and Suspense to dynamically import page components.
// Instead of downloading one massive JavaScript bundle on initial load,
// the browser only downloads the JS needed for the page the user is currently on.
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ItemDetailsPage = lazy(() => import('./pages/ItemDetailsPage'));
const CreateEditListingPage = lazy(() => import('./pages/CreateEditListingPage'));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage'));
const SwapRequestsPage = lazy(() => import('./pages/SwapRequestsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage'));
const AdminListingsPage = lazy(() => import('./pages/AdminListingsPage'));
const AdminSwapsPage = lazy(() => import('./pages/AdminSwapsPage'));
import Footer from './components/layout/Footer';
const FaqPage = lazy(() => import('./pages/FaqPage'));
const RecentChangesPage = lazy(() => import('./pages/RecentChangesPage'));

// The root component wraps the entire app in global providers:
// 1. AuthProvider: Manages user login state so any component can access the current user.
// 2. ThemeProvider: Manages dark/light mode toggles.
// 3. BrowserRouter: Enables client-side routing.
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="site-wrapper">
            <Navbar />
            <main className="site-content">
              <Suspense fallback={<div className="page-loading">Loading page…</div>}>
                <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/recent-changes" element={<RecentChangesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/listings/:id" element={<ItemDetailsPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listings/new"
                  element={
                    <ProtectedRoute>
                      <CreateEditListingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listings/:id/edit"
                  element={
                    <ProtectedRoute>
                      <CreateEditListingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute>
                      <MyListingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/swap-requests"
                  element={
                    <ProtectedRoute>
                      <SwapRequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                {/* Admin Routes: ProtectedRoute with adminOnly=true ensures the user is logged in AND has the 'admin' role. */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/:id"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminUserDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/listings"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminListingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/swaps"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminSwapsPage />
                    </ProtectedRoute>
                  }
                />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
          <Analytics />
          <SpeedInsights />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;



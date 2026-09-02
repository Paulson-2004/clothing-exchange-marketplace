import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import CreateEditListingPage from './pages/CreateEditListingPage';
import MyListingsPage from './pages/MyListingsPage';
import SwapRequestsPage from './pages/SwapRequestsPage';
import ChatPage from './pages/ChatPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import AdminListingsPage from './pages/AdminListingsPage';
import AdminSwapsPage from './pages/AdminSwapsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmailVerification from './pages/EmailVerification';
import ProfileSetup from './pages/ProfileSetup';
import CollectPayment from './pages/CollectPayment';
import AddTransaction from './pages/AddTransaction';
import TransactionHistory from './pages/TransactionHistory';
import UdhaarManager from './pages/UdhaarManager';
import LandingPage from './pages/LandingPage';
import KhataBook from './pages/KhataBook';
import CustomerKhata from './pages/CustomerKhata';
import AddCustomer from './pages/AddCustomer';
import './index.css';

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route
              path="/profile-setup"
              element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collect-payment"
              element={
                <ProtectedRoute>
                  <CollectPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-transaction"
              element={
                <ProtectedRoute>
                  <AddTransaction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/udhaar"
              element={
                <ProtectedRoute>
                  <UdhaarManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/khata"
              element={
                <ProtectedRoute>
                  <KhataBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/khata/add"
              element={
                <ProtectedRoute>
                  <AddCustomer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/khata/edit/:customerId"
              element={
                <ProtectedRoute>
                  <AddCustomer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/khata/:customerId"
              element={
                <ProtectedRoute>
                  <CustomerKhata />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Videos from './pages/Videos';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import Users from './pages/Users';
import Comments from './pages/Comments';
import Layout from './components/Layout';
import OfflineBanner from './components/OfflineBanner';
import './index.css';

const ProtectedRoute = () => {
  const token = localStorage.getItem('admin_token');
  return token ? <Layout /> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="videos" element={<Videos />} />
          <Route path="comments" element={<Comments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="logs" element={<Logs />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

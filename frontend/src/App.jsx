import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import InquiryForm from './pages/InquiryForm.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { getToken } from './api.js';

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <>
      <header className="nav">
        <NavLink to="/" className="brand"><span className="logo">K12</span> Hunar</NavLink>
        <nav>
          <NavLink to="/" end>Inquiry</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<InquiryForm />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Protected><Dashboard /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} K12 Hunar · Empowering students, parents & schools</footer>
    </>
  );
}
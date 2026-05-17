import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login            from './pages/Login';
import Register         from './pages/Register';
import Home             from './pages/Home';
import Payment          from './pages/Payment';
import Scheduler        from './pages/Scheduler';
import WhatsAppConnect  from './pages/WhatsAppConnect';
import AdminPage        from './pages/AdminPage';
import ClinicsPage      from './pages/ClinicsPage';
import PatientsPage     from './pages/PatientsPage';
import PatientFile      from './pages/PatientFile';

function App() {
  const token = localStorage.getItem('token');
  const Protected = ({ children }) => token ? children : <Navigate to="/login" />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Navigate to="/login" />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/register"   element={<Register />} />
        <Route path="/home"       element={<Protected><Home /></Protected>} />
        <Route path="/payment"    element={<Protected><Payment /></Protected>} />
        <Route path="/scheduler"  element={<Protected><Scheduler /></Protected>} />
        <Route path="/whatsapp"   element={<Protected><WhatsAppConnect /></Protected>} />
        <Route path="/admin"      element={<Protected><AdminPage /></Protected>} />
        <Route path="/clinics"    element={<Protected><ClinicsPage /></Protected>} />
        <Route path="/patients"   element={<Protected><PatientsPage /></Protected>} />
        <Route path="/patients/:id" element={<Protected><PatientFile /></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

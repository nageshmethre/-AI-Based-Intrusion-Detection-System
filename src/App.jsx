import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { api } from './services/api';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AlertDetailPage } from './pages/AlertDetailPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { IPInvestigationPage } from './pages/IPInvestigationPage';
import { UserAnalyticsPage } from './pages/UserAnalyticsPage';
import { IOCsPage } from './pages/IOCsPage';
import { RulesPage } from './pages/RulesPage';
import { MLModelsPage } from './pages/MLModelsPage';
import { ReportsPage } from './pages/ReportsPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(api.getCurrentUser());

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          element={
            currentUser ? (
              <DashboardLayout currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/alerts/:id" element={<AlertDetailPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="/ip-investigation" element={<IPInvestigationPage />} />
          <Route path="/users" element={<UserAnalyticsPage />} />
          <Route path="/iocs" element={<IOCsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/models" element={<MLModelsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { VolunteersPage } from './pages/VolunteersPage';
import { MyInscriptionsPage } from './pages/MyInscriptionsPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/benevoles" element={<VolunteersPage />} />
            <Route path="/mes-inscriptions" element={<MyInscriptionsPage />} />
            <Route path="/organisateurs" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
}

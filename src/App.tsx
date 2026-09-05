/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { ProjectDetail } from './pages/ProjectDetail';
import { ImproveProject } from './pages/ImproveProject';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="project/:id" element={<ProjectDetail />} />
            <Route path="improve" element={<ImproveProject />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';

// Lazy load routes for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Onboarding = React.lazy(() => import('./pages/Onboarding').then(module => ({ default: module.Onboarding })));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail').then(module => ({ default: module.ProjectDetail })));
const ImproveProject = React.lazy(() => import('./pages/ImproveProject').then(module => ({ default: module.ImproveProject })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center h-[50vh]" aria-live="polite" aria-label="Loading page content">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    <span className="sr-only">Loading...</span>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="project/:id" element={<ProjectDetail />} />
              <Route path="improve" element={<ImproveProject />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

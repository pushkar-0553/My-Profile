import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public Layout & Core Landing Page (immediate bundle)
import { PublicLayout } from '../features/public/layouts/PublicLayout.jsx';
import { HomePage } from '../features/public/pages/HomePage.jsx';

// Lazy-load secondary public pages to keep initial bundle ultra-lean
const ProjectsPage = React.lazy(() => import('../features/public/pages/ProjectsPage.jsx').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = React.lazy(() => import('../features/public/pages/ProjectDetailPage.jsx').then(m => ({ default: m.ProjectDetailPage })));
const AboutPage = React.lazy(() => import('../features/public/pages/AboutPage.jsx').then(m => ({ default: m.AboutPage })));
const SkillsPage = React.lazy(() => import('../features/public/pages/SkillsPage.jsx').then(m => ({ default: m.SkillsPage })));
const ContactPage = React.lazy(() => import('../features/public/pages/ContactPage.jsx').then(m => ({ default: m.ContactPage })));

// Admin Auth & Layout
const LoginPage = React.lazy(() => import('../features/admin/pages/LoginPage.jsx').then(m => ({ default: m.LoginPage })));
import { AuthGuard } from '../features/admin/auth/AuthGuard.jsx';
const AdminLayout = React.lazy(() => import('../features/admin/layouts/AdminLayout.jsx').then(m => ({ default: m.AdminLayout })));

// Admin CMS Pages (strictly lazy-loaded; never downloaded by public visitors)
const DashboardOverview = React.lazy(() => import('../features/admin/pages/DashboardOverview.jsx').then(m => ({ default: m.DashboardOverview })));
const ProjectsManager = React.lazy(() => import('../features/admin/pages/ProjectsManager.jsx').then(m => ({ default: m.ProjectsManager })));
const ProjectEditor = React.lazy(() => import('../features/admin/pages/ProjectEditor.jsx').then(m => ({ default: m.ProjectEditor })));
const GitHubImporter = React.lazy(() => import('../features/admin/pages/GitHubImporter.jsx').then(m => ({ default: m.GitHubImporter })));
const ExperienceManager = React.lazy(() => import('../features/admin/pages/ExperienceManager.jsx').then(m => ({ default: m.ExperienceManager })));
const SkillsManager = React.lazy(() => import('../features/admin/pages/SkillsManager.jsx').then(m => ({ default: m.SkillsManager })));
const MessagesInbox = React.lazy(() => import('../features/admin/pages/MessagesInbox.jsx').then(m => ({ default: m.MessagesInbox })));
const SecuritySettings = React.lazy(() => import('../features/admin/pages/SecuritySettings.jsx').then(m => ({ default: m.SecuritySettings })));
const SiteSettings = React.lazy(() => import('../features/admin/pages/SiteSettings.jsx').then(m => ({ default: m.SiteSettings })));

function RouteFallback() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--border-color)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public Portfolio Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Admin Login Route */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin Protected CMS Routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<DashboardOverview />} />
            <Route path="/admin/projects" element={<ProjectsManager />} />
            <Route path="/admin/projects/new" element={<ProjectEditor />} />
            <Route path="/admin/projects/:id/edit" element={<ProjectEditor />} />
            <Route path="/admin/github" element={<GitHubImporter />} />
            <Route path="/admin/experience" element={<ExperienceManager />} />
            <Route path="/admin/skills" element={<SkillsManager />} />
            <Route path="/admin/messages" element={<MessagesInbox />} />
            <Route path="/admin/security" element={<SecuritySettings />} />
            <Route path="/admin/settings" element={<SiteSettings />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

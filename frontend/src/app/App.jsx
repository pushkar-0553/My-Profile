import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../common/hooks/useTheme.jsx';
import { AuthProvider } from '../common/hooks/useAuth.jsx';
import { AppRoutes } from './routes.jsx';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

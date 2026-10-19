import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../common/hooks/useAuth.jsx';

export function AuthGuard() {
  const { isAuthenticated, loading, refreshSession } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      refreshSession().finally(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, refreshSession]);

  if (loading || !checked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Verifying administrative security credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

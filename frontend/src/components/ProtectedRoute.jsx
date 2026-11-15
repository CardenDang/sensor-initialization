import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Supply authentication state from the application's auth provider.
// This client-side guard does not replace server-side authorization.
export default function ProtectedRoute({ isAuthenticated = false, isLoading = false, redirectTo = '/', children }) {
  const location = useLocation();

  if (isLoading) return <p role="status">Loading…</p>;
  if (!isAuthenticated) return <Navigate to={redirectTo} state={{ from: location }} replace />;
  return children ?? <Outlet />;
}

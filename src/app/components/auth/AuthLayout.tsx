import { Outlet, Navigate } from 'react-router';
import { useApp } from '../../context/AppContext';

export const AuthLayout = () => {
  const { user, currentRoom } = useApp();

  if (user && currentRoom) {
    return <Navigate to="/app" replace />;
  }

  if (user && !currentRoom) {
    return <Navigate to="/app/room" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-indigo-600 mb-2">CoLivio</h1>
          <p className="text-gray-600 text-lg">Shared living made simple</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
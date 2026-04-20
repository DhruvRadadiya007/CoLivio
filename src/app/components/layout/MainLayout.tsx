import {
  Outlet,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router";
import { useApp } from "../../context/AppContext";
import {
  Home,
  User,
  Users,
  UtensilsCrossed,
  CheckSquare,
  DollarSign,
  Euro,
  PoundSterling,
  IndianRupee,
  Receipt,
  Briefcase,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export const MainLayout = () => {
  const { user, currentRoom, logout, currency } = useApp();
  const navigate = useNavigate();

  const CurrencyIcon = currency === 'EUR' ? Euro : currency === 'GBP' ? PoundSterling : currency === 'INR' ? IndianRupee : DollarSign;
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navItems = [
    {
      path: "/app",
      icon: Home,
      label: "Dashboard",
      exact: true,
    },
    { path: "/app/profile", icon: User, label: "Profile" },
    { path: "/app/room", icon: Users, label: "Room" },
    {
      path: "/app/meals",
      icon: UtensilsCrossed,
      label: "Meals",
    },
    { path: "/app/tasks", icon: CheckSquare, label: "Tasks" },
    {
      path: "/app/expenses",
      icon: CurrencyIcon,
      label: "Expenses",
    },
    { path: "/app/bills", icon: Receipt, label: "Bills" },
    {
      path: "/app/personnel",
      icon: Briefcase,
      label: "Personnel",
    },
    {
      path: "/app/analytics",
      icon: BarChart3,
      label: "Analytics",
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setMobileMenuOpen(!mobileMenuOpen)
                }
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <h1 className="text-xl font-bold text-indigo-600">
                CoLivio
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {currentRoom && (
                <div className="hidden sm:block text-sm">
                  <span className="text-gray-500">Room:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {currentRoom.name}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(
                    item.path,
                    item.exact,
                  );
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div
                className="bg-white w-64 h-full p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(
                      item.path,
                      item.exact,
                    );
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          active
                            ? "bg-indigo-50 text-indigo-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  active ? "text-indigo-600" : "text-gray-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
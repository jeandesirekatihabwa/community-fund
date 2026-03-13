import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? "bg-slate-100 text-indigo-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group" aria-label="Home">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold group-hover:bg-indigo-700 transition-colors shadow-sm">
                C
              </div>
              <span className="font-semibold text-xl tracking-tight text-slate-900">
                CommunityFund
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <Link to="/" className={navLinkClass("/")}>
                Home
              </Link>
              <Link to="/community" className={navLinkClass("/community")}>
                Impact
              </Link>
              {user && (
                <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-900">
                    {user.name}
                  </span>
                </div>

                {user.avatar ? (
                  <img
                    className="h-9 w-9 rounded-full ring-2 ring-white shadow-sm object-cover"
                    src={user.avatar}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold ring-2 ring-white shadow-sm">
                    {user.name?.charAt(0) || "U"}
                  </div>
                )}

                <Button
                  variant="secondary"
                  onClick={logout}
                  className="text-xs px-3 py-1.5 h-auto"
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="primary">Sign In</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
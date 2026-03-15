import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";
import { LogOut, LayoutDashboard, Globe, Home, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `relative px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
      isActive(path)
        ? "text-indigo-600"
        : "text-slate-500 hover:text-slate-900"
    }`;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-indigo-100/50 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group" aria-label="Home">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-200"
              >
                C
              </motion.div>
              <span className="font-extrabold text-2xl tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors">
                Community<span className="text-indigo-600">Fund</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-2">
              <Link to="/" className={navLinkClass("/")}>
                <Home size={18} />
                Home
                {isActive("/") && <motion.div layoutId="nav-active" className="absolute bottom-[-24px] left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
              </Link>
              <Link to="/community" className={navLinkClass("/community")}>
                <Globe size={18} />
                Impact
                {isActive("/community") && <motion.div layoutId="nav-active" className="absolute bottom-[-24px] left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
              </Link>
              {user && (
                <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                  <LayoutDashboard size={18} />
                  Dashboard
                  {isActive("/dashboard") && <motion.div layoutId="nav-active" className="absolute bottom-[-24px] left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900 leading-none">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Verified Holder
                  </span>
                </div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative group cursor-pointer"
                >
                  {user.avatar ? (
                    <img
                      className="h-10 w-10 rounded-xl ring-2 ring-indigo-50 shadow-md object-cover transition-all group-hover:ring-indigo-200"
                      src={user.avatar}
                      alt={user.name}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold ring-2 ring-indigo-50 shadow-md">
                      <UserIcon size={20} />
                    </div>
                  )}
                </motion.div>

                <Button
                  variant="secondary"
                  onClick={logout}
                  className="!rounded-xl !bg-slate-50 !border-slate-100 !text-slate-600 hover:!bg-red-50 hover:!text-red-600 hover:!border-red-100"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/login">
                  <Button variant="primary" className="!rounded-xl px-8 !py-3 shadow-lg shadow-indigo-100">
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
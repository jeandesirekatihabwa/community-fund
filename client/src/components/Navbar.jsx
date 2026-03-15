import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Globe, Home, User as UserIcon, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/community", icon: Globe, label: "Impact" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Profile", protected: true },
  ];

  return (
    <>
      {/* Desktop Header - Visible only on md+ */}
      <nav className="hidden md:block sticky top-0 z-50 glass border-b border-indigo-100/50 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg">C</div>
              <span className="font-extrabold text-2xl tracking-tighter">Community<span className="text-indigo-600">Fund</span></span>
            </Link>
            
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                (!item.protected || user) && (
                  <Link key={item.path} to={item.path} className={`text-sm font-bold flex items-center gap-2 ${isActive(item.path) ? "text-indigo-600" : "text-slate-500"}`}>
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                )
              ))}
              {user ? (
                <button onClick={logout} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 transition-colors">
                  <LogOut size={18} />
                </button>
              ) : (
                <Link to="/login" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Get Started</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Visible only on mobile */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm">
        <div className="glass-dark rounded-[2.5rem] p-2 flex items-center justify-around shadow-2xl shadow-indigo-900/20 border border-white/10 backdrop-blur-2xl">
          {navItems.map((item) => (
            (!item.protected || user) && (
              <Link 
                key={item.path} 
                to={item.path} 
                className="relative p-4 flex flex-col items-center gap-1 group"
              >
                <item.icon 
                  size={24} 
                  className={`transition-all duration-300 ${isActive(item.path) ? "text-white scale-110" : "text-slate-400 opacity-60 group-hover:opacity-100"}`} 
                />
                {isActive(item.path) && (
                  <motion.div 
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-white/10 rounded-[2rem] -z-10"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </Link>
            )
          ))}
          
          {user ? (
            <button onClick={logout} className="p-4 text-slate-400 opacity-60">
              <LogOut size={24} />
            </button>
          ) : (
            <Link to="/login" className="p-4">
              <LogIn size={24} className={isActive("/login") ? "text-white" : "text-slate-400 opacity-60"} />
            </Link>
          )}
        </div>
        
        {/* Safe Area Buffer */}
        <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
      </nav>

      {/* Mobile Top Branding Bar */}
      <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md">CF</div>
          <span className="font-extrabold text-lg tracking-tighter">CommunityFund</span>
        </Link>
        {user && (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={14} className="text-indigo-400" />}
          </div>
        )}
      </div>
    </>
  );
}
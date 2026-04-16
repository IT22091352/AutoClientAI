import { memo, useMemo, useState } from "react";

function Sidebar({ onNavigate, currentPage, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = useMemo(
    () => [{ id: "dashboard", label: "Dashboard", icon: "📊" }],
    []
  );

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">AC</span>
            </div>
            <span className="text-sm font-semibold text-white">AutoClient AI</span>
          </div>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-100"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div
        className="hidden md:flex md:sticky md:top-0 md:h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/10 flex-col backdrop-blur-xl"
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 animate-fadeIn">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">AC</span>
            </div>
            <div className="flex-1">
              <h1 className="text-white font-bold text-sm">AutoClient</h1>
              <p className="text-slate-400 text-xs">AI Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium
                ${
                  currentPage === item.id
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50 text-blue-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {user && (
            <div className="px-3 py-2 rounded-lg bg-white/5">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-blue-400 mt-1">
                {user.plan === "pro" ? "🌟 Pro" : "Free"} Plan
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full btn-secondary text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-white/10 z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">AC</span>
            </div>
            <span className="text-sm font-semibold text-white">AutoClient AI</span>
          </div>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-100"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium
                ${
                  currentPage === item.id
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50 text-blue-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 mt-auto space-y-3">
          {user && (
            <div className="px-3 py-2 rounded-lg bg-white/5">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            </div>
          )}
          <button type="button" onClick={onLogout} className="w-full btn-secondary text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default memo(Sidebar);

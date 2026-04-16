import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Success from "./pages/Success";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isAuthed, setIsAuthed] = useState(() => Boolean(localStorage.getItem("token")));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
      setIsAuthed(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setPathname(nextPath);
    setIsAuthed(Boolean(localStorage.getItem("token")));
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    // In a full app, you could map pages to routes
    // For now, we keep dashboard as the main page
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    setIsAuthed(false);
    setUser(null);
    navigate("/");
  };

  const handleLoginSuccess = () => {
    setIsAuthed(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    navigate("/dashboard");
  };

  if (pathname === "/success") {
    return isAuthed ? (
      <Success onComplete={() => navigate("/dashboard")} />
    ) : (
      <Login onSuccess={handleLoginSuccess} />
    );
  }

  if (pathname === "/dashboard") {
    return isAuthed ? (
      <div className="min-h-screen md:flex bg-slate-950">
        <Sidebar
          onNavigate={handleNavigate}
          currentPage={currentPage}
          user={user}
          onLogout={logout}
        />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Dashboard />
        </main>
      </div>
    ) : (
      <Login onSuccess={handleLoginSuccess} onNavigateSignup={() => navigate("/signup")} />
    );
  }

  if (pathname === "/signup") {
    return (
      <Signup onNavigateLogin={() => navigate("/")} />
    );
  }

  return <Login onSuccess={handleLoginSuccess} onNavigateSignup={() => navigate("/signup")} />;
}

export default App;
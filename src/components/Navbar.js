import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = ({ currentUser, onLogout, unreadCount }) => {
  if (!currentUser) return null;

  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="navbar">
      <div className="navbar-title">Maynooth Swap</div>

      <nav className="navbar-links">
        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>

        <NavLink to="/list" className={linkClass}>
          List
        </NavLink>

        <NavLink to="/requests" className={linkClass}>
          Request
        </NavLink>

        <NavLink to="/messages" className={linkClass}>
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span>Messages</span>
            {unreadCount > 0 && (
              <span
                style={{
                  minWidth: 20,
                  padding: "0 6px",
                  height: 20,
                  borderRadius: 999,
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {unreadCount}
              </span>
            )}
          </span>
        </NavLink>

        <NavLink to="/profile" className={linkClass}>
          Profile
        </NavLink>

        <button className="button-nav" onClick={onLogout}>
          Logout
        </button>
      </nav>
    </header>
  );
};

export default Navbar;

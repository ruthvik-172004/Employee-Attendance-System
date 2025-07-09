import { Link, useLocation } from "react-router-dom"
import "../styles/Navbar.css"

const Navbar = () => {
  const location = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src="/images/logo.svg" alt="Logo" className="logo" />
          <h1>EMS</h1>
        </div>

        <ul className="navbar-menu">
          <li className={location.pathname === "/dashboard" ? "active" : ""}>
            <Link to="/dashboard">
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </Link>
          </li>
          <li className={location.pathname === "/employees" ? "active" : ""}>
            <Link to="/employees">
              <i className="fas fa-users"></i>
              <span>Employees</span>
            </Link>
          </li>
          <li className={location.pathname === "/attendance" ? "active" : ""}>
            <Link to="/attendance">
              <i className="fas fa-calendar-check"></i>
              <span>Attendance</span>
            </Link>
          </li>
          <li className={location.pathname === "/departments" ? "active" : ""}>
            <Link to="/departments">
              <i className="fas fa-building"></i>
              <span>Departments</span>
            </Link>
          </li>
          <li className={location.pathname === "/register" ? "active" : ""}>
            <Link to="/register">
              <i className="fas fa-user-plus"></i>
              <span>Register</span>
            </Link>
          </li>
        </ul>

        <div className="navbar-profile">
          <img src="/images/avatars/admin.jpg" alt="Admin" className="avatar sm" />
          <div className="profile-info">
            <span className="profile-name">Admin User</span>
            <span className="profile-role">Administrator</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar


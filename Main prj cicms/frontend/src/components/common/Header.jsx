import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "../../styles/common.css"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    navigate("/login")
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>FACIAL RECOGNIZATION SYSTEM </h1>
      </div>
      <div className="header-right">
        <div className={`menu-toggle ${isMenuOpen ? "open" : ""}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <nav className={`header-nav ${isMenuOpen ? "open" : ""}`}>
          <ul>
            <li>
              <Link to="/admin-settings">Settings</Link>
            </li>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header


"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  FaUsers,
  FaBuilding,
  FaCalendarCheck,
  FaBars,
  FaUserPlus,
  FaList,
  FaInfoCircle,
  FaChartLine,
  FaSignOutAlt,
  FaEye,
} from "react-icons/fa"
import "../styles/Dashboard.css"
import { db } from "../firebase"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"
import axios from "axios"

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    departments: 0,
    activeEmployees: 0,
  })
  const [loading, setLoading] = useState(true)
  const [systemInfo, setSystemInfo] = useState(null)
  const navigate = useNavigate()

  const featureCards = [
    {
      title: "Manage Employees",
      description: "View, edit and manage employee records",
      icon: <FaUsers />,
      route: "/manage-employees",
      color: "blue",
      delay: "0.1s",
    },
    {
      title: "Track Attendance",
      description: "Monitor daily attendance and reports",
      icon: <FaCalendarCheck />,
      route: "/attendance",
      color: "yellow",
      delay: "0.2s",
    },
    {
      title: "Departments",
      description: "Manage departments and team structures",
      icon: <FaBuilding />,
      route: "/departments",
      color: "blue",
      delay: "0.3s",
    },
    {
      title: "Register Employee",
      description: "Add new employees",
      icon: <FaUserPlus />,
      route: "/register",
      color: "yellow",
      delay: "0.4s",
    },
    {
      title: "Employee Details",
      description: "View detailed employee information",
      icon: <FaList />,
      route: "/employees",
      color: "blue",
      delay: "0.5s",
    },
    {
      title: "System Info",
      description: "View system information and updates",
      icon: <FaInfoCircle />,
      route: "/home",
      color: "yellow",
      delay: "0.6s",
    },
  ]

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Fetch system health info
        try {
          const healthResponse = await axios.get("http://localhost:5000/health")
          if (healthResponse.data.status === "success") {
            setSystemInfo(healthResponse.data)
          }
        } catch (error) {
          console.error("Error fetching system health:", error)
        }

        const employeesRef = collection(db, "employees")
        const employeeSnapshot = await getDocs(employeesRef)
        const totalEmployees = employeeSnapshot.size

        const activeEmployeesQuery = query(employeesRef, where("status", "==", "Active"))
        const activeEmployeesSnapshot = await getDocs(activeEmployeesQuery)
        const activeEmployees = activeEmployeesSnapshot.size

        // Fetch today's attendance
        let todayAttendance = 0
        try {
          const today = new Date().toISOString().split("T")[0]
          const attendanceResponse = await axios.get(`http://localhost:5000/attendance?date=${today}`)
          if (attendanceResponse.data.status === "success") {
            todayAttendance = attendanceResponse.data.attendance.length
          }
        } catch (error) {
          console.error("Error fetching attendance:", error)
          // Fallback to Firestore
          const attendanceRef = collection(db, "attendance")
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayAttendanceQuery = query(attendanceRef, where("recordedAt", ">=", Timestamp.fromDate(today)))
          const attendanceSnapshot = await getDocs(todayAttendanceQuery)
          todayAttendance = attendanceSnapshot.size
        }

        const departments = new Set()
        employeeSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.department) {
            departments.add(data.department)
          }
        })

        setStats({
          totalEmployees,
          todayAttendance,
          departments: departments.size,
          activeEmployees,
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        setLoading(false)
        setStats({
          totalEmployees: 0,
          todayAttendance: 0,
          departments: 0,
          activeEmployees: 0,
        })
      }
    }

    fetchStats()
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleCardClick = (route) => {
    navigate(route)
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    navigate("/login")
  }

  return (
    <div className="dashboard-container">
      <div className={`left-sidebar ${sidebarOpen ? "show" : ""}`}>
        <div className="sidebar-header">
          <h3>Employee Management</h3>
          {/* <div className="accuracy-badge">99.2% Accuracy</div> */}
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => handleCardClick("/dashboard")} className="active">
            <FaChartLine /> Dashboard
          </li>
          <li onClick={() => handleCardClick("/employees")}>
            <FaUsers /> Employees
          </li>
          <li onClick={() => handleCardClick("/attendance")}>
            <FaCalendarCheck /> Attendance
          </li>
          <li onClick={() => handleCardClick("/departments")}>
            <FaBuilding /> Departments
          </li>
          <li onClick={() => handleCardClick("/register")}>
            <FaUserPlus /> Register
          </li>
          <li onClick={() => handleCardClick("/home")}>
            <FaInfoCircle /> Home
          </li>
          <li onClick={() => handleCardClick("/admin-settings")}>
            <FaInfoCircle /> Settings
          </li>
          <li className="sidebar-divider"></li>
          <li onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </li>
        </ul>
      </div>

      <div className={`content-area ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <h1 className="dashboard-title"> Dashboard</h1>
          {systemInfo && (
            <div className="system-status">
              <span className="status-indicator online"></span>
              
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* System Info Banner */}
            {systemInfo && (
              <div className="system-info-banner">
                <div className="system-info-content">
                  
                  <div className="system-details">
                   
                  </div>
                  <div className="system-status-badge">
                    <span className="status-dot"></span>
                  
                  </div>
                </div>
              </div>
            )}

            <div className="stats-summary">
              <div className="summary-card">
                <div className="summary-icon employees">
                  <FaUsers />
                </div>
                <div className="summary-details">
                  <h3>Total Employees</h3>
                  <p>{stats.totalEmployees}</p>
                 
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon attendance">
                  <FaCalendarCheck />
                </div>
                <div className="summary-details">
                  <h3>Today's Attendance</h3>
                  <p>{stats.todayAttendance}</p>
                  
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon departments">
                  <FaBuilding />
                </div>
                <div className="summary-details">
                  <h3>Departments</h3>
                  <p>{stats.departments}</p>
                
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon active">
                  <FaUsers />
                </div>
                <div className="summary-details">
                  <h3>Active Employees</h3>
                  <p>{stats.activeEmployees}</p>
                 
                </div>
              </div>
            </div>

            <div className="feature-cards-grid">
              {featureCards.map((card, index) => (
                <div
                  key={index}
                  className={`feature-card ${card.color} animate-slide-up`}
                  onClick={() => handleCardClick(card.route)}
                  style={{ animationDelay: card.delay }}
                >
                  <div className="card-icon">{card.icon}</div>
                  <div className="card-content">
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                  {card.title === "Register Employee" && <div className="accuracy-indicator"><p></p></div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard

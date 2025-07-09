import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Dashboard from "./components/Dashboard"
import EmployeeOverview from "./components/EmployeeOverview"
import EmployeeDetails from "./components/EmployeeDetails"
import ManageEmployees from "./components/ManageEmployees"
import AttendanceTracking from "./components/AttendanceTracking"
import DepartmentsOverview from "./components/DepartmentsOverview"
import Register from "./components/Register"
import AdminLogin from "./components/AdminLogin"
import ForgotPassword from "./components/ForgotPassword"
import Home from "./components/Home"
import AdminSettings from "./components/AdminSettings"
import "./styles/App.css"
import "./styles/common.css"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)


  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
  }, [])


  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />
    }
    return children
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<AdminLogin setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <EmployeeOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute>
                <EmployeeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-employees"
            element={
              <ProtectedRoute>
                <ManageEmployees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendanceTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <DepartmentsOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute>
                <Register />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-settings"
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App


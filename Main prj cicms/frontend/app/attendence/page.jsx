

import { useState, useEffect } from "react"
import AttendanceForm from "@/components/AttendanceForm"
import AttendanceList from "@/components/AttendanceList"
import "@/styles/Attendance.css"

const AttendancePage = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    employeeID: "",
    department: "",
  })
  const [departments, setDepartments] = useState([])

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query string from filters
      const queryParams = new URLSearchParams()
      if (filters.date) queryParams.append("date", filters.date)
      if (filters.employeeID) queryParams.append("employeeID", filters.employeeID)
      if (filters.department) queryParams.append("department", filters.department)

      const response = await fetch(`http://localhost:5000/attendance?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "success") {
        setAttendanceRecords(data.attendance)
      } else {
        setError(data.message || "Failed to fetch attendance records")
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching attendance records")
      console.error("Error fetching attendance:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch departments for filter
  const fetchDepartments = async () => {
    try {
      const response = await fetch("http://localhost:5000/departments")

      if (response.ok) {
        const data = await response.json()
        if (data.status === "success") {
          setDepartments(data.departments)
        }
      }
    } catch (err) {
      console.error("Error fetching departments:", err)
    }
  }

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  // Apply filters
  const applyFilters = (e) => {
    e.preventDefault()
    fetchAttendanceRecords()
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      date: new Date().toISOString().split("T")[0],
      employeeID: "",
      department: "",
    })
  }

  // Initial data fetch
  useEffect(() => {
    fetchAttendanceRecords()
    fetchDepartments()
  }, [])

  return (
    <div className="attendance-container">
      <h1>Employee Attendance</h1>

      <AttendanceForm
        filters={filters}
        departments={departments}
        onFilterChange={handleFilterChange}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading attendance records...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchAttendanceRecords}>Try Again</button>
        </div>
      ) : (
        <AttendanceList records={attendanceRecords} />
      )}
    </div>
  )
}

export default AttendancePage


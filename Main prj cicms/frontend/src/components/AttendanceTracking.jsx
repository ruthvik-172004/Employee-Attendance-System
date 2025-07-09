"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FaCalendarAlt, FaSearch, FaArrowLeft, FaBuilding, FaSync } from "react-icons/fa"
import "../styles/AttendanceTracking.css"

const AttendanceTracking = () => {
  const [attendanceData, setAttendanceData] = useState([])
  const [employeesData, setEmployeesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
  })

  // ⏰ UPDATED TIMING CONFIGURATION (23:00-00:00)
  const ATTENDANCE_CONFIG = {
    // Work start time (employees should arrive by this time)
    WORK_START_HOUR: 11, // 11 PM
    WORK_START_MINUTE: 0, // 0 minutes

    // Late threshold (after this time, marked as late)
    LATE_THRESHOLD_HOUR: 11, // 11 PM
    LATE_THRESHOLD_MINUTE: 30, // 30 minutes (so 11:30 PM)

    // Work end time
    WORK_END_HOUR: 16, // 12 AM (midnight)
    WORK_END_MINUTE: 0, // 0 minutes

    // Early departure threshold
    EARLY_DEPARTURE_HOUR: 11, // 11 PM
    EARLY_DEPARTURE_MINUTE: 0, // 45 minutes
  }

  // Function to determine attendance status based on check-in time
  const determineAttendanceStatus = (checkInTime) => {
    if (!checkInTime) return "Absent"

    const checkIn = new Date(checkInTime)

    // Create threshold times for the same date
    const onTimeThreshold = new Date(checkIn)
    onTimeThreshold.setHours(ATTENDANCE_CONFIG.WORK_START_HOUR, ATTENDANCE_CONFIG.WORK_START_MINUTE, 0, 0)

    const lateThreshold = new Date(checkIn)
    lateThreshold.setHours(ATTENDANCE_CONFIG.LATE_THRESHOLD_HOUR, ATTENDANCE_CONFIG.LATE_THRESHOLD_MINUTE, 0, 0)

    // Determine status
    if (checkIn <= onTimeThreshold) {
      return "Present" // On time or early
    } else if (checkIn <= lateThreshold) {
      return "Present" // Within grace period
    } else {
      return "Late" // After grace period
    }
  }

  // Function to format time thresholds for display
  const getAttendanceTimings = () => {
    return {
      workStart: `${ATTENDANCE_CONFIG.WORK_START_HOUR.toString().padStart(2, "0")}:${ATTENDANCE_CONFIG.WORK_START_MINUTE.toString().padStart(2, "0")}`,
      lateThreshold: `${ATTENDANCE_CONFIG.LATE_THRESHOLD_HOUR.toString().padStart(2, "0")}:${ATTENDANCE_CONFIG.LATE_THRESHOLD_MINUTE.toString().padStart(2, "0")}`,
      workEnd: `${ATTENDANCE_CONFIG.WORK_END_HOUR.toString().padStart(2, "0")}:${ATTENDANCE_CONFIG.WORK_END_MINUTE.toString().padStart(2, "0")}`,
    }
  }

  // 🎯 FIXED: Fetch all employees using backend API
  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:5000/employees")
      const data = await response.json()

      if (data.status === "success") {
        setEmployeesData(data.employees)
        console.log("✅ Fetched employees from backend:", data.employees.length)
        return data.employees
      } else {
        console.error("❌ Failed to fetch employees:", data.message)
        return []
      }
    } catch (error) {
      console.error("❌ Error fetching employees:", error)
      return []
    }
  }

  // Extract departments from employees data
  const extractDepartments = (employees) => {
    const uniqueDepartments = [...new Set(employees.map((emp) => emp.department).filter(Boolean))]
    setDepartments(uniqueDepartments)
  }

  // 🎯 FIXED: Fetch attendance data using backend API
  const fetchAttendanceData = async (targetDate, department = "") => {
    try {
      let url = `http://localhost:5000/attendance?date=${targetDate}`

      if (department) {
        url += `&department=${encodeURIComponent(department)}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === "success") {
        console.log(`✅ Fetched attendance records for ${targetDate}:`, data.attendance.length)
        return data.attendance
      } else {
        console.error("❌ Failed to fetch attendance:", data.message)
        return []
      }
    } catch (error) {
      console.error("❌ Error fetching attendance data:", error)
      return []
    }
  }

  // Process attendance data and create comprehensive records
  const processAttendanceData = (employees, attendanceRecords) => {
    const processedData = []

    // Filter employees by department if selected
    const filteredEmployees = selectedDepartment
      ? employees.filter((emp) => emp.department === selectedDepartment)
      : employees

    // Create a map of attendance records by employee ID
    const attendanceMap = new Map()
    attendanceRecords.forEach((record) => {
      const employeeId = record.employeeID
      if (!attendanceMap.has(employeeId)) {
        attendanceMap.set(employeeId, [])
      }
      attendanceMap.get(employeeId).push(record)
    })

    filteredEmployees.forEach((employee) => {
      const employeeAttendance = attendanceMap.get(employee.employeeID) || []

      if (employeeAttendance.length > 0) {
        // Employee has attendance record(s) - get the first check-in
        const sortedRecords = employeeAttendance.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        const firstCheckIn = sortedRecords[0]

        // Use the backend status if available, otherwise determine it
        const status = firstCheckIn.status || determineAttendanceStatus(firstCheckIn.timestamp)

        processedData.push({
          id: employee.employeeID,
          employeeID: employee.employeeID,
          name: `${employee.fname || ""} ${employee.lname || ""}`.trim(),
          department: employee.department || "N/A",
          position: employee.position || "N/A",
          checkIn: firstCheckIn.timestamp,
          status: status,
          image: employee.capturedImage || null,
          recordedAt: firstCheckIn.recordedAt,
          device: firstCheckIn.device || "unknown",
        })
      } else {
        // Employee is absent
        processedData.push({
          id: employee.employeeID,
          employeeID: employee.employeeID,
          name: `${employee.fname || ""} ${employee.lname || ""}`.trim(),
          department: employee.department || "N/A",
          position: employee.position || "N/A",
          checkIn: null,
          status: "Absent",
          image: employee.capturedImage || null,
        })
      }
    })

    return processedData
  }

  // Calculate summary statistics
  const calculateSummary = (processedData, totalEmployees) => {
    const present = processedData.filter((record) => record.status === "Present").length
    const late = processedData.filter((record) => record.status === "Late").length
    const absent = processedData.filter((record) => record.status === "Absent").length

    const attendanceRate = totalEmployees > 0 ? Math.round(((present + late) / totalEmployees) * 100) : 0

    return {
      total: totalEmployees,
      present,
      late,
      absent,
      attendanceRate,
    }
  }

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
  }

  // Main data fetching function
  const fetchAllData = async () => {
    try {
      console.log(`🔄 Fetching data for ${selectedDate}${selectedDepartment ? ` (${selectedDepartment})` : ""}`)

      // Fetch employees from backend
      const employees = await fetchEmployees()

      // Extract departments
      extractDepartments(employees)

      // Fetch attendance for selected date from backend
      const attendanceRecords = await fetchAttendanceData(selectedDate, selectedDepartment)

      // Process the data
      const processedData = processAttendanceData(employees, attendanceRecords)

      // Calculate total employees (considering department filter)
      const totalEmployees = selectedDepartment
        ? employees.filter((emp) => emp.department === selectedDepartment).length
        : employees.length

      setAttendanceData(processedData)

      // Calculate summary
      const summaryStats = calculateSummary(processedData, totalEmployees)
      setSummary(summaryStats)

      console.log(`📊 Summary for ${selectedDate}:`, summaryStats)
      console.log("⏰ Attendance timings:", getAttendanceTimings())
    } catch (error) {
      console.error("❌ Error fetching data:", error)
    }
  }

  // Main data fetching effect
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchAllData()
      setLoading(false)
    }

    loadData()
  }, [selectedDate, selectedDepartment])

  // 🔄 Auto-refresh every 30 seconds to catch new attendance
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        console.log("🔄 Auto-refreshing attendance data...")
        handleRefresh()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [loading, refreshing, selectedDate, selectedDepartment])

  // Filter attendance data based on search term
  const filteredAttendance = attendanceData.filter(
    (record) =>
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeID.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
    console.log("📅 Date changed to:", e.target.value)
  }

  // Handle department change
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value)
    console.log("🏢 Department changed to:", e.target.value)
  }

  // Format time display
  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A"

    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    } catch (error) {
      return "Invalid Time"
    }
  }

  // Format date for display
  const formatSelectedDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  // Get attendance timing info for display
  const timings = getAttendanceTimings()

  return (
    <div className="attendance-tracking">
      <div className="tracking-header">
        <div className="header-title">
          <FaCalendarAlt />
          <h1>Attendance Tracking</h1>
          <span className="selected-date-info">for {formatSelectedDate(selectedDate)}</span>
        </div>
        <div className="header-actions">
          <button
            onClick={handleRefresh}
            className={`refresh-btn ${refreshing ? "refreshing" : ""}`}
            disabled={refreshing}
            title="Refresh attendance data"
          >
            <FaSync className={refreshing ? "spinning" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <Link to="/dashboard" className="back-link">
            <FaArrowLeft />
            <span>Back</span>
          </Link>
        </div>
      </div>

      {/* 🕐 Attendance Timing Info */}
      <div className="timing-info">
        <div className="timing-card">
          <span className="timing-label">Work Start:</span>
          <span className="timing-value">{timings.workStart} PM</span>
        </div>
        <div className="timing-card">
          <span className="timing-label">Late After:</span>
          <span className="timing-value">{timings.lateThreshold} PM</span>
        </div>
        <div className="timing-card">
          <span className="timing-label">Work End:</span>
          <span className="timing-value">00:00 AM</span>
        </div>
      </div>

      <div className="tracking-actions">
        <div className="date-selector">
          <FaCalendarAlt />
          <input type="date" value={selectedDate} onChange={handleDateChange} className="date-input" />
        </div>

        <div className="department-selector">
          <FaBuilding />
          <select value={selectedDepartment} onChange={handleDepartmentChange} className="department-select">
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="attendance-summary">
        <div className="summary-card">
          <div className="summary-title">Total Employees</div>
          <div className="summary-value">{summary.total}</div>
        </div>

        <div className="summary-card">
          <div className="summary-title">Present Today</div>
          <div className="summary-value present">{summary.present}</div>
        </div>

        <div className="summary-card">
          <div className="summary-title">Absent Today</div>
          <div className="summary-value absent">{summary.absent}</div>
        </div>

        <div className="summary-card">
          <div className="summary-title">Late Arrivals</div>
          <div className="summary-value late">{summary.late}</div>
        </div>

        <div className="summary-card attendance-rate">
          <div className="summary-title">Attendance Rate</div>
          <div className="summary-value rate">{summary.attendanceRate}%</div>
          <div className="rate-progress">
            <div className="rate-fill" style={{ width: `${summary.attendanceRate}%` }}></div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading attendance data for {formatSelectedDate(selectedDate)}...</p>
        </div>
      ) : (
        <div className="attendance-table-container">
       

          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Check In</th>
                <th>Status</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => (
                  <tr key={record.id} className={`status-row status-${record.status?.toLowerCase()}`}>
                    <td className="employee-cell">
                      {record.image ? (
                        <img
                          src={record.image || "/placeholder.svg"}
                          alt={record.name}
                          className="avatar sm"
                          onError={(e) => {
                            e.target.src = `/images/avatars/default.jpg`
                          }}
                        />
                      ) : (
                        <div className="avatar sm default-avatar">{record.name.charAt(0).toUpperCase()}</div>
                      )}
                      <div className="employee-info">
                        <span className="employee-name">{record.name}</span>
                        <span className="employee-id">{record.employeeID}</span>
                      </div>
                    </td>
                    <td>{record.department}</td>
                    <td>{record.position}</td>
                    <td className="time-cell">
                      <i className="fas fa-sign-in-alt"></i>
                      <span>{formatTime(record.checkIn)}</span>
                    </td>
                    <td>
                      <div className={`status-badge status-${record.status?.toLowerCase() || "absent"}`}>
                        {record.status || "Absent"}
                      </div>
                    </td>
                    <td className="device-cell">
                      <span className={`device-badge ${record.device || "unknown"}`}>
                        {record.device === "raspberry_pi"
                          ? "🥧 Pi"
                          : record.device === "manual"
                            ? "👤 Manual"
                            : record.device || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="no-data">
                    {searchTerm
                      ? `No employees found matching "${searchTerm}" for ${formatSelectedDate(selectedDate)}`
                      : `No attendance records found for ${formatSelectedDate(selectedDate)}`}
                    {selectedDepartment && ` in ${selectedDepartment} department`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AttendanceTracking

"use client"

import { useState } from "react"

const AttendanceForm = ({ filters, departments, onFilterChange, onApplyFilters, onResetFilters }) => {
  const [manualEntry, setManualEntry] = useState(false)
  const [manualData, setManualData] = useState({
    employeeID: "",
    timestamp: new Date().toISOString().slice(0, 16),
  })
  const [submitStatus, setSubmitStatus] = useState(null)

  // Handle manual entry form changes
  const handleManualDataChange = (e) => {
    const { name, value } = e.target
    setManualData({
      ...manualData,
      [name]: value,
    })
  }

  // Submit manual attendance
  const submitManualAttendance = async (e) => {
    e.preventDefault()

    try {
      setSubmitStatus({ type: "loading", message: "Submitting attendance..." })

      const response = await fetch("http://localhost:5000/mark-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeID: manualData.employeeID,
          timestamp: manualData.timestamp,
          device: "manual_entry",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: `Attendance marked for ${data.name || manualData.employeeID}`,
        })

        // Reset form
        setManualData({
          employeeID: "",
          timestamp: new Date().toISOString().slice(0, 16),
        })

        // Refresh attendance list after 2 seconds
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setSubmitStatus({
          type: "error",
          message: data.message || "Failed to mark attendance",
        })
      }
    } catch (err) {
      setSubmitStatus({
        type: "error",
        message: err.message || "An error occurred",
      })
    }
  }

  return (
    <div className="attendance-form-container">
      <div className="filter-section">
        <h2>Filter Attendance Records</h2>
        <form onSubmit={onApplyFilters} className="filter-form">
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input type="date" id="date" name="date" value={filters.date} onChange={onFilterChange} />
          </div>

          <div className="form-group">
            <label htmlFor="employeeID">Employee ID</label>
            <input
              type="text"
              id="employeeID"
              name="employeeID"
              value={filters.employeeID}
              onChange={onFilterChange}
              placeholder="Enter Employee ID"
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <select id="department" name="department" value={filters.department} onChange={onFilterChange}>
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="form-buttons">
            <button type="submit" className="action-button">
              Apply Filters
            </button>
            <button type="button" className="action-button secondary" onClick={onResetFilters}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="manual-entry-section">
        <h2>Manual Attendance Entry</h2>
        <button className="toggle-button" onClick={() => setManualEntry(!manualEntry)}>
          {manualEntry ? "Hide Manual Entry" : "Show Manual Entry"}
        </button>

        {manualEntry && (
          <form onSubmit={submitManualAttendance} className="manual-entry-form">
            <div className="form-group">
              <label htmlFor="manual-employeeID">Employee ID</label>
              <input
                type="text"
                id="manual-employeeID"
                name="employeeID"
                value={manualData.employeeID}
                onChange={handleManualDataChange}
                placeholder="Enter Employee ID"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="timestamp">Date & Time</label>
              <input
                type="datetime-local"
                id="timestamp"
                name="timestamp"
                value={manualData.timestamp}
                onChange={handleManualDataChange}
                required
              />
            </div>

            <button type="submit" className="action-button">
              Mark Attendance
            </button>

            {submitStatus && (
              <div className={`status-message ${submitStatus.type}`}>
                <p>{submitStatus.message}</p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default AttendanceForm


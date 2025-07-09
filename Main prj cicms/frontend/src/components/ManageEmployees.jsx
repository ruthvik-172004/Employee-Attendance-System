"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FaSearch, FaFilter, FaPlus, FaArrowLeft, FaTrashAlt, FaEye, FaUserTie } from "react-icons/fa"
import "../styles/ManageEmployees.css"

const ManageEmployees = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    // Fetch employees data
    const fetchEmployees = async () => {
      try {
        const response = await fetch("http://localhost:5000/employees")
        const data = await response.json()

        if (data.status === "success") {
          setEmployees(data.employees)

          // Extract unique departments
          const uniqueDepartments = [...new Set(data.employees.map((emp) => emp.department))]
          setDepartments(uniqueDepartments)
        } else {
          console.error("Failed to fetch employees")
        }
      } catch (error) {
        console.error("Error fetching employees:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // Filter employees based on search term and department
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeID.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = selectedDepartment === "" || employee.department === selectedDepartment

    return matchesSearch && matchesDepartment
  })

  // Handle delete employee
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:5000/employee/${id}`, {
          method: "DELETE",
        })

        const data = await response.json()

        if (data.status === "success") {
          // Remove employee from state
          setEmployees(employees.filter((emp) => emp.employeeID !== id))
        } else {
          alert("Failed to delete employee")
        }
      } catch (error) {
        console.error("Error deleting employee:", error)
        alert("An error occurred while deleting the employee")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="manage-employees">
      <div className="manage-header">
        <div className="header-title">
          <FaUserTie className="header-icon" />
          <h1>Manage Employees</h1>
        </div>
        <Link to="/dashboard" className="back-link">
          <FaArrowLeft className="back-icon" />
          <span>Back </span>
        </Link>
      </div>

      <div className="manage-actions">
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
        <div className="action-buttons">
          <select
            className="filter-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <button className="filter-btn">
            <FaFilter className="filter-icon" />
            <span>Filter</span>
          </button>
          <Link to="/register" className="btn btn-primary">
            <FaPlus className="add-icon" />
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading employees...</p>
        </div>
      ) : (
        <div className="employees-table-container">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.employeeID}>
                  <td className="employee-cell">
                    <img
                      src={employee.capturedImage || `/images/avatars/default.jpg`}
                      alt={`${employee.fname} ${employee.lname}`}
                      className="avatar sm"
                    />
                    <div className="employee-info">
                      <span className="employee-name">
                        {employee.fname} {employee.lname}
                      </span>
                      <span className="employee-id">{employee.employeeID}</span>
                    </div>
                  </td>
                  <td>{employee.department}</td>
                  <td>{employee.position}</td>
                  <td>
                    <div
                      className={`status-badge ${employee.status === "On Leave" ? "status-leave" : "status-active"}`}
                    >
                      {employee.status || "Active"}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-icon delete-icon"
                      onClick={() => handleDelete(employee.employeeID)}
                      title="Delete Employee"
                    >
                      <FaTrashAlt />
                    </button>
                    <Link
                      to={`/employees/${employee.employeeID}`}
                      className="action-icon view-icon"
                      title="View Details"
                    >
                      <FaEye />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ManageEmployees


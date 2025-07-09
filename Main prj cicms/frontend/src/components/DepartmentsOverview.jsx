'use client'
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FaBuilding, FaSearch, FaPlus, FaArrowLeft, FaUsers, FaChartLine } from "react-icons/fa"
import "../styles/DepartmentsOverview.css"
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

const DepartmentsOverview = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false)
  const [newDepartment, setNewDepartment] = useState({ name: "", positions: [""] })

  // Calculate department attendance rate based on actual data
  const calculateDepartmentAttendanceRate = async (departmentName) => {
    try {
      // Fetch attendance data for the department from Firestore
      const attendanceRef = collection(db, "attendance")
      const attendanceQuery = query(attendanceRef, where("department", "==", departmentName))
      const attendanceSnapshot = await getDocs(attendanceQuery)

      if (!attendanceSnapshot.empty) {
        const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data())
        const presentCount = attendanceRecords.filter(
          (record) => record.status === "Present" || record.status === "Late",
        ).length

        return Math.round((presentCount / attendanceRecords.length) * 100)
      }

      return 0 // Default to 0 if no data
    } catch (error) {
      console.error(`Error calculating attendance rate for ${departmentName}:`, error)
      return 0
    }
  }

  // Get employee count for a department from Firestore
  const getEmployeeCount = async (departmentName) => {
    try {
      const employeesRef = collection(db, "employees")
      const employeeQuery = query(employeesRef, where("department", "==", departmentName))
      const employeeSnapshot = await getDocs(employeeQuery)

      return employeeSnapshot.size
    } catch (error) {
      console.error(`Error getting employee count for ${departmentName}:`, error)
      return 0
    }
  }

  // Fetch departments directly from the departments collection
  const fetchDepartments = async () => {
    try {
      setLoading(true)

      // Get departments from the departments collection
      const departmentsRef = collection(db, "departments")
      const departmentsSnapshot = await getDocs(departmentsRef)

      if (!departmentsSnapshot.empty) {
        // Create department objects with calculated data
        const departmentArray = await Promise.all(
          departmentsSnapshot.docs.map(async (doc) => {
            const deptData = doc.data()
            const deptName = deptData.name
            const attendanceRate = await calculateDepartmentAttendanceRate(deptName)
            const employeeCount = await getEmployeeCount(deptName)

            return {
              id: doc.id,
              name: deptName,
              positions: deptData.positions || [],
              employeeCount,
              attendanceRate: attendanceRate || 0,
            }
          }),
        )

        setDepartments(departmentArray)
      } else {
        // Fallback to getting unique departments from employees collection
        const employeesRef = collection(db, "employees")
        const employeeSnapshot = await getDocs(employeesRef)

        const departmentSet = new Set()
        employeeSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.department) {
            departmentSet.add(data.department)
          }
        })

        // Create department objects with calculated data
        const departmentArray = await Promise.all(
          Array.from(departmentSet).map(async (deptName) => {
            const attendanceRate = await calculateDepartmentAttendanceRate(deptName)
            const employeeCount = await getEmployeeCount(deptName)

            return {
              id: deptName.replace(/\s+/g, "-").toLowerCase(),
              name: deptName,
              employeeCount,
              attendanceRate: attendanceRate || 0,
            }
          }),
        )

        setDepartments(departmentArray)
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  // Filter departments based on search term
  const filteredDepartments = departments.filter((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Handle adding a new position field
  const addPositionField = () => {
    setNewDepartment({
      ...newDepartment,
      positions: [...newDepartment.positions, ""],
    })
  }

  // Handle removing a position field
  const removePositionField = (index) => {
    const updatedPositions = [...newDepartment.positions]
    updatedPositions.splice(index, 1)
    setNewDepartment({
      ...newDepartment,
      positions: updatedPositions,
    })
  }

  // Handle input change for department form
  const handleDepartmentInputChange = (e) => {
    setNewDepartment({
      ...newDepartment,
      name: e.target.value,
    })
  }

  // Handle input change for position fields
  const handlePositionInputChange = (index, value) => {
    const updatedPositions = [...newDepartment.positions]
    updatedPositions[index] = value
    setNewDepartment({
      ...newDepartment,
      positions: updatedPositions,
    })
  }

  // Handle adding a new department
  const handleAddDepartment = async () => {
    try {
      setLoading(true)

      // Validate inputs
      if (!newDepartment.name.trim()) {
        alert("Please enter a department name")
        setLoading(false)
        return
      }

      if (newDepartment.positions.some((pos) => !pos.trim())) {
        alert("Please fill in all position fields")
        setLoading(false)
        return
      }

      // Check if department already exists
      const departmentExists = departments.some((dept) => dept.name.toLowerCase() === newDepartment.name.toLowerCase())

      if (departmentExists) {
        alert("Department with this name already exists")
        setLoading(false)
        return
      }

      // Add department to Firestore
      const departmentsRef = collection(db, "departments")

      // Check in Firestore as well to be extra safe
      const q = query(departmentsRef, where("name", "==", newDepartment.name))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        alert("Department with this name already exists")
        setLoading(false)
        return
      }

      const docRef = await addDoc(departmentsRef, {
        name: newDepartment.name,
        positions: newDepartment.positions,
        createdAt: serverTimestamp(),
      })

      // Add to local state
      const newDeptObj = {
        id: docRef.id,
        name: newDepartment.name,
        positions: newDepartment.positions,
        employeeCount: 0,
        attendanceRate: 0,
      }

      setDepartments([...departments, newDeptObj])

      // Reset form and close modal
      setNewDepartment({ name: "", positions: [""] })
      setShowAddDepartmentModal(false)

      alert("Department added successfully!")

      // Refresh departments to ensure we have the latest data
      fetchDepartments()
    } catch (error) {
      console.error("Error adding department:", error)
      alert("Failed to add department")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="departments-overview">
      <div className="overview-header">
        <div className="header-title">
          <FaBuilding />
          <h1>Departments Overview</h1>
        </div>
        <Link to="/dashboard" className="back-link">
          <FaArrowLeft />
          <span>Back </span>
        </Link>
      </div>

      <div className="overview-actions">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddDepartmentModal(true)}>
          <FaPlus />
          <span>Add Department</span>
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading departments...</p>
        </div>
      ) : (
        <div className="departments-grid">
          {filteredDepartments.length > 0 ? (
            filteredDepartments.map((dept) => (
              <div key={dept.id} className="department-card">
                <div className="department-header">
                  <h3>{dept.name}</h3>
                  <button className="expand-btn">
                    <FaChartLine />
                  </button>
                </div>

                <div className="department-stats">
                  <div className="stat-item">
                    <FaUsers />
                    <div className="stat-content">
                      <span className="stat-label">Employees</span>
                      <span className="stat-value">{dept.employeeCount}</span>
                    </div>
                  </div>
                </div>

                <div className="department-attendance">
                  <div className="attendance-label">
                    <span>Attendance Rate</span>
                    <span>{dept.attendanceRate}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${dept.attendanceRate >= 95 ? "green" : "yellow"}`}
                      style={{ width: `${dept.attendanceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-departments">
              <p>No departments found. Add a new department to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="add-department-overlay">
          <div className="add-department-card">
            <div className="add-department-header">
              <h3>Add Department</h3>
              <button className="close-btn" onClick={() => setShowAddDepartmentModal(false)}>
                ×
              </button>
            </div>

            <div className="add-department-form">
              <div className="form-group">
                <label htmlFor="departmentName">Department Name</label>
                <input
                  type="text"
                  id="departmentName"
                  value={newDepartment.name}
                  onChange={handleDepartmentInputChange}
                  placeholder="Enter department name"
                />
              </div>

              <div className="form-group">
                <label>Positions</label>
                {newDepartment.positions.map((position, index) => (
                  <div key={index} className="position-input-group">
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => handlePositionInputChange(index, e.target.value)}
                      placeholder={`Position ${index + 1}`}
                    />
                    {newDepartment.positions.length > 1 && (
                      <button type="button" className="remove-position-btn" onClick={() => removePositionField(index)}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="add-position-btn" onClick={addPositionField}>
                  <FaPlus /> Add Position
                </button>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDepartmentModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAddDepartment} disabled={loading}>
                  {loading ? "Adding..." : "Add Department"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentsOverview




// import { useState, useEffect } from "react"
// import { Link } from "react-router-dom"
// import "../styles/EmployeeOverview.css"
// import { FaArrowLeft } from "react-icons/fa"

// const EmployeeOverview = () => {
//   const [employees, setEmployees] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState("")

//   useEffect(() => {
//     // Fetch employees data
//     const fetchEmployees = async () => {
//       try {
//         const response = await fetch("http://localhost:5000/employees")
//         const data = await response.json()

//         if (data.status === "success") {
//           setEmployees(data.employees)
//         } else {
//           console.error("Failed to fetch employees")
//         }
//       } catch (error) {
//         console.error("Error fetching employees:", error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchEmployees()
//   }, [])

//   // Filter employees based on search term
//   const filteredEmployees = employees.filter(
//     (employee) =>
//       employee.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       employee.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       employee.position.toLowerCase().includes(searchTerm.toLowerCase()),
//   )

//   return (
//     <div className="employee-overview">
//       <div className="overview-header">
//         <div className="header-title">
//           <i className="fas fa-users"></i>
//           <h1>Employees Overview</h1>
//         </div>
//         <Link to="/dashboard" className="back-link">
//           <FaArrowLeft />
//           <span>Back </span>
//         </Link>
//       </div>

//       <div className="overview-actions">
//         <div className="search-container">
//           <i className="fas fa-search search-icon"></i>
//           <input
//             type="text"
//             className="search-input"
//             placeholder="Search employees..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>
//         <div className="action-buttons">
//           <button className="filter-btn">
//             <i className="fas fa-filter"></i>
//             <span>Filter</span>
//           </button>
//           <Link to="/register" className="btn btn-primary">
//             <i className="fas fa-plus"></i>
//             <span>Add Employee</span>
//           </Link>
//         </div>
//       </div>

//       {loading ? (
//         <div className="loading">Loading employees...</div>
//       ) : (
//         <div className="employee-cards">
//           {filteredEmployees.map((employee) => (
//             <div key={employee.employeeID} className="employee-card">
//               <div className="employee-card-header">
//                 <img
//                   src={employee.capturedImage || `/images/avatars/default.jpg`}
//                   alt={`${employee.fname} ${employee.lname}`}
//                   className="avatar md"
//                 />
//                 <div className="employee-info">
//                   <h3>
//                     {employee.fname} {employee.lname}
//                   </h3>
//                   <p className="employee-position">{employee.position}</p>
//                 </div>
//               </div>

//               <div className="employee-details">
//                 <div className="detail-item">
//                   <i className="fas fa-building"></i>
//                   <span>{employee.department}</span>
//                 </div>
//                 <div className="detail-item">
//                   <i className="fas fa-envelope"></i>
//                   <span>{employee.email}</span>
//                 </div>
//                 <div className="detail-item">
//                   <i className="fas fa-phone"></i>
//                   <span>+91 {employee.phone}</span>
//                 </div>
//                 <div className="detail-item">
//                   <i className="fas fa-calendar-alt"></i>
//                   <span>Joined {new Date(employee.startDate).toLocaleDateString()}</span>
//                 </div>
//               </div>

//               <div className="employee-card-footer">
//                 <div className={`status-badge ${employee.status === "On Leave" ? "status-leave" : "status-active"}`}>
//                   {employee.status || "Active"}
//                 </div>
//                 <Link to={`/employees/${employee.employeeID}`} className="view-details-btn">
//                   View Details
//                 </Link>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// export default EmployeeOverview

"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "../styles/EmployeeOverview.css"
import { FaArrowLeft, FaSearch, FaPlus, FaBuilding, FaEnvelope, FaPhone, FaCalendarAlt, FaEye } from "react-icons/fa"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase"

const EmployeeOverview = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Fetch employees data from Firestore
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        const employeesRef = collection(db, "employees")
        const querySnapshot = await getDocs(employeesRef)

        const employeesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setEmployees(employeesData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching employees:", error)
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // Filter employees based on search term
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="employee-overview">
      <div className="overview-header">
        <div className="header-title">
          <FaBuilding />
          <h1>Employees Overview</h1>
        </div>
        <Link to="/dashboard" className="back-link">
          <FaArrowLeft />
          <span className="sr-only">Back</span>
        </Link>
      </div>

      <div className="overview-actions">
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
          <Link to="/register" className="btn btn-primary">
            <FaPlus />
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading employees...</div>
      ) : (
        <div className="employee-cards">
          {filteredEmployees.map((employee) => (
            <div key={employee.employeeID} className="employee-card">
              <div className="employee-card-header">
                <img
                  src={employee.capturedImage || "/images/avatars/default.jpg"}
                  alt={`${employee.fname} ${employee.lname}`}
                  className="avatar md"
                />
                <div className="employee-info">
                  <h3>
                    {employee.fname} {employee.lname}
                  </h3>
                  <p className="employee-position">{employee.position}</p>
                </div>
              </div>

              <div className="employee-details">
                <div className="detail-item">
                  <FaBuilding />
                  <span>{employee.department}</span>
                </div>
                <div className="detail-item">
                  <FaEnvelope />
                  <span>{employee.email}</span>
                </div>
                <div className="detail-item">
                  <FaPhone />
                  <span>+91 {employee.phone}</span>
                </div>
                <div className="detail-item">
                  <FaCalendarAlt />
                  <span>Joined {new Date(employee.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="employee-card-footer">
                <div className={`status-badge ${employee.status === "On Leave" ? "status-leave" : "status-active"}`}>
                  {employee.status || "Active"}
                </div>
                <Link to={`/employees/${employee.employeeID}`} className="view-details-btn">
                  <FaEye /> View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EmployeeOverview

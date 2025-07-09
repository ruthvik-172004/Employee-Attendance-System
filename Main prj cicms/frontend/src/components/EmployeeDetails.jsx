// "use client"

// import { useState, useEffect } from "react"
// import { Link, useParams } from "react-router-dom"
// import "../styles/EmployeeDetails.css"
// import { FaArrowLeft } from "react-icons/fa"

// const EmployeeDetails = () => {
//   const { id } = useParams()
//   const [employee, setEmployee] = useState(null)
//   const [attendance, setAttendance] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)

//   // Calculate attendance rate based on actual data
//   const calculateAttendanceRate = (employeeAttendance) => {
//     if (!employeeAttendance || employeeAttendance.length === 0) {
//       return { overall: 0, thisYear: 0 }
//     }

//     const totalDays = employeeAttendance.length
//     const presentDays = employeeAttendance.filter(
//       (record) => record.status === "Present" || record.status === "Late",
//     ).length

//     // Calculate this year's attendance
//     const today = new Date()
//     const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString()

//     const thisYearAttendance = employeeAttendance.filter((record) => record.timestamp >= startOfYear)

//     const thisYearTotalDays = thisYearAttendance.length
//     const thisYearPresentDays = thisYearAttendance.filter(
//       (record) => record.status === "Present" || record.status === "Late",
//     ).length

//     const overallRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
//     const thisYearRate = thisYearTotalDays > 0 ? Math.round((thisYearPresentDays / thisYearTotalDays) * 100) : 0

//     return { overall: overallRate, thisYear: thisYearRate }
//   }

//   useEffect(() => {
//     const fetchEmployeeDetails = async () => {
//       try {
//         // Fetch employee details
//         const employeeResponse = await fetch(`http://localhost:5000/employee/${id}`)
//         const employeeData = await employeeResponse.json()

//         if (employeeData.status === "success") {
//           setEmployee(employeeData.employee)

//           // Fetch attendance records
//           const attendanceResponse = await fetch(`http://localhost:5000/attendance?employeeID=${id}`)
//           const attendanceData = await attendanceResponse.json()

//           if (attendanceData.status === "success") {
//             setAttendance(attendanceData.attendance)
//           }
//         } else {
//           setError("Failed to fetch employee details")
//         }
//       } catch (error) {
//         console.error("Error fetching employee details:", error)
//         setError("An error occurred while fetching employee details")
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchEmployeeDetails()
//   }, [id])

//   if (loading) {
//     return <div className="loading">Loading employee details...</div>
//   }

//   if (error || !employee) {
//     return <div className="error">{error || "Employee not found"}</div>
//   }

//   // Recent activity
//   const recentActivity = [{ type: "attendance", description: "Checked in", time: "9:30 AM", date: "Today" }]

//   return (
//     <div className="employee-details">
//       <div className="details-header">
//         <div className="header-title">
//           <i className="fas fa-id-card"></i>
//           <h1>Employee Details</h1>
//         </div>
//         <Link to="/employees" className="back-link">
//           <FaArrowLeft />
//           <i className="fas fa-arrow-left"></i>
//           <span>Back </span>
//         </Link>
//       </div>

//       <div className="details-content">
//         {/* Left section with employee details */}
//         <div className="left-section">
//           <div className="profile-card">
//             <div className="profile-image">
//               <img
//                 src={employee.capturedImage || `/images/avatars/default.jpg`}
//                 alt={`${employee.fname} ${employee.lname}`}
//                 className="avatar lg"
//               />
//             </div>
//             <h2 className="profile-name">
//               {employee.fname} {employee.lname}
//             </h2>
//             <p className="profile-position">{employee.position}</p>

//             <div className="profile-details">
//               <div className="detail-item">
//                 <i className="fas fa-envelope"></i>
//                 <div className="detail-content">
//                   <span className="detail-label">Email:</span>
//                   <span className="detail-value">{employee.email}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <i className="fas fa-phone"></i>
//                 <div className="detail-content">
//                   <span className="detail-label">Phone:</span>
//                   <span className="detail-value">+91 {employee.phone}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <i className="fas fa-calendar-alt"></i>
//                 <div className="detail-content">
//                   <span className="detail-label">Joined:</span>
//                   <span className="detail-value">{new Date(employee.startDate).toLocaleDateString()}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <i className="fas fa-map-marker-alt"></i>
//                 <div className="detail-content">
//                   <span className="detail-label">Location:</span>
//                   <span className="detail-value">{employee.location || "Location not specified"}</span>
//                 </div>
//               </div>
//               <div className="detail-item">
//                 <i className="fas fa-building"></i>
//                 <div className="detail-content">
//                   <span className="detail-label">Department:</span>
//                   <span className="detail-value">{employee.department}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right section with attendance stats and activity */}
//         <div className="right-section">
//           <div className="stats-card">
//             <div className="stats-header">
//               <i className="fas fa-calendar-check"></i>
//               <h3>Attendance Statistics</h3>
//             </div>

//             <div className="stats-item">
//               <div className="stats-label">
//                 <span>Overall Rate</span>
//                 <span>{calculateAttendanceRate(attendance).overall}%</span>
//               </div>
//               <div className="progress-bar">
//                 <div
//                   className="progress-fill green"
//                   style={{ width: `${calculateAttendanceRate(attendance).overall}%` }}
//                 ></div>
//               </div>
//             </div>

//             <div className="stats-item">
//               <div className="stats-label">
//                 <span>This Year Rate</span>
//                 <span>{calculateAttendanceRate(attendance).thisYear}%</span>
//               </div>
//               <div className="progress-bar">
//                 <div
//                   className="progress-fill yellow"
//                   style={{ width: `${calculateAttendanceRate(attendance).thisYear}%` }}
//                 ></div>
//               </div>
//             </div>
//           </div>

//           <div className="activity-card">
//             <div className="activity-header">
//               <i className="fas fa-history"></i>
//               <h3>Recent Activity</h3>
//             </div>

//             <div className="activity-list">
//               {recentActivity.map((activity, index) => (
//                 <div key={index} className="activity-item">
//                   <div className="activity-content">
//                     <p className="activity-description">{activity.description}</p>
//                     <p className="activity-time">
//                       {activity.time} {activity.date}
//                     </p>
//                   </div>
//                   <div className={`activity-type ${activity.type}`}>{activity.type}</div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default EmployeeDetails

"use client"

import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import "../styles/EmployeeDetails.css"
import {
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBuilding,
  FaHistory,
  FaCalendarCheck,
} from "react-icons/fa"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "../firebase"

const EmployeeDetails = () => {
  const { id } = useParams()
  const [employee, setEmployee] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])

  // Calculate attendance rate based on actual data
  const calculateAttendanceRate = (employeeAttendance) => {
    if (!employeeAttendance || employeeAttendance.length === 0) {
      return { overall: 0, thisYear: 0 }
    }

    const totalDays = employeeAttendance.length
    const presentDays = employeeAttendance.filter(
      (record) => record.status === "Present" || record.status === "Late",
    ).length

    // Calculate this year's attendance
    const today = new Date()
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString()

    const thisYearAttendance = employeeAttendance.filter((record) => record.timestamp >= startOfYear)

    const thisYearTotalDays = thisYearAttendance.length
    const thisYearPresentDays = thisYearAttendance.filter(
      (record) => record.status === "Present" || record.status === "Late",
    ).length

    const overallRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    const thisYearRate = thisYearTotalDays > 0 ? Math.round((thisYearPresentDays / thisYearTotalDays) * 100) : 0

    return { overall: overallRate, thisYear: thisYearRate }
  }

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true)

        // Fetch employee from Firestore
        const employeesRef = collection(db, "employees")
        const q = query(employeesRef, where("employeeID", "==", id))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          setError("Employee not found")
          setLoading(false)
          return
        }

        // Get the first matching document
        const employeeData = querySnapshot.docs[0].data()
        setEmployee(employeeData)

        // Fetch attendance records from Firestore
        const attendanceRef = collection(db, "attendance")
        const attendanceQuery = query(attendanceRef, where("employeeID", "==", id), orderBy("timestamp", "desc"))

        const attendanceSnapshot = await getDocs(attendanceQuery)
        const attendanceData = attendanceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setAttendance(attendanceData)

        // Set recent activity based on attendance
        if (attendanceData.length > 0) {
          // Use the most recent attendance records for activity
          const recentAttendanceActivities = attendanceData.slice(0, 5).map((record) => ({
            type: "attendance",
            description: record.checkIn ? "Checked in" : "Checked out",
            time: new Date(record.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            date: new Date(record.timestamp).toLocaleDateString(),
          }))
          setRecentActivity(recentAttendanceActivities)
        } else {
          // If no attendance records, show "newly joined"
          setRecentActivity([
            {
              type: "attendance",
              description: "Newly joined",
              time: "",
              date: new Date(employeeData.registrationDate?.toDate() || new Date()).toLocaleDateString(),
            },
          ])
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching employee details:", error)
        setError("An error occurred while fetching employee details")
        setLoading(false)
      }
    }

    if (id) {
      fetchEmployeeDetails()
    }
  }, [id])

  if (loading) {
    return <div className="loading">Loading employee details...</div>
  }

  if (error || !employee) {
    return <div className="error">{error || "Employee not found"}</div>
  }

  return (
    <div className="employee-details">
      <div className="details-header">
        <div className="header-title">
          <FaCalendarCheck />
          <h1>Employee Details</h1>
        </div>
        <Link to="/employees" className="back-link">
          <FaArrowLeft />
          <span className="sr-only">Back</span>
        </Link>
      </div>

      <div className="details-content">
        {/* Left section with employee details */}
        <div className="left-section">
          <div className="profile-card">
            <div className="profile-image">
              <img
                src={employee.capturedImage || "/images/avatars/default.jpg"}
                alt={`${employee.fname} ${employee.lname}`}
                className="avatar lg"
              />
            </div>
            <h2 className="profile-name">
              {employee.fname} {employee.lname}
            </h2>
            <p className="profile-position">{employee.position}</p>

            <div className="profile-details">
              <div className="detail-item">
                <FaEnvelope />
                <div className="detail-content">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{employee.email}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaPhone />
                <div className="detail-content">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">+91 {employee.phone}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaCalendarAlt />
                <div className="detail-content">
                  <span className="detail-label">Joined:</span>
                  <span className="detail-value">{new Date(employee.startDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaMapMarkerAlt />
                <div className="detail-content">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{employee.location || "Location not specified"}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaBuilding />
                <div className="detail-content">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{employee.department}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right section with attendance stats and activity */}
        <div className="right-section">
          <div className="stats-card">
            <div className="stats-header">
              <FaCalendarCheck />
              <h3>Attendance Statistics</h3>
            </div>

            <div className="stats-item">
              <div className="stats-label">
                <span>Overall Rate</span>
                <span>{calculateAttendanceRate(attendance).overall}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill green"
                  style={{ width: `${calculateAttendanceRate(attendance).overall}%` }}
                ></div>
              </div>
            </div>

            <div className="stats-item">
              <div className="stats-label">
                <span>This Year Rate</span>
                <span>{calculateAttendanceRate(attendance).thisYear}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill yellow"
                  style={{ width: `${calculateAttendanceRate(attendance).thisYear}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="activity-card">
            <div className="activity-header">
              <FaHistory />
              <h3>Recent Activity</h3>
            </div>

            <div className="activity-list">
              {recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-content">
                    <p className="activity-description">{activity.description}</p>
                    <p className="activity-time">
                      {activity.time && `${activity.time} `}
                      {activity.date}
                    </p>
                  </div>
                  <div className={`activity-type ${activity.type}`}>{activity.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDetails

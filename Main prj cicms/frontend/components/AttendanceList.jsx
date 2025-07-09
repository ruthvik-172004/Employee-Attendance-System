const AttendanceList = ({ records }) => {
    // Format date and time
    const formatDateTime = (timestamp) => {
      if (!timestamp) return "N/A"
  
      const date = new Date(timestamp)
      return date.toLocaleString()
    }
  
    return (
      <div className="attendance-list-container">
        <h2>Attendance Records</h2>
  
        {records.length === 0 ? (
          <div className="no-records">
            <p>No attendance records found for the selected filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Date & Time</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employeeID}</td>
                    <td>{record.name}</td>
                    <td>{record.department}</td>
                    <td>{record.position}</td>
                    <td>{formatDateTime(record.timestamp)}</td>
                    <td>{record.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }
  
  export default AttendanceList
  
  
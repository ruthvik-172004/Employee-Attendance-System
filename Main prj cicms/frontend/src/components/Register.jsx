"use client"

import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import Webcam from "react-webcam"
import { FaArrowLeft, FaCamera, FaCheck, FaRedo, FaUserPlus, FaUpload, FaImage } from "react-icons/fa"
import "../styles/Register.css"
import axios from "axios"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase"

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState(25)
  const [isLoading, setIsLoading] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [employeeData, setEmployeeData] = useState(null)

  // Form state
  const [personalInfo, setPersonalInfo] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    location: "",
  })

  const [capturedImages, setCapturedImages] = useState([null, null, null, null, null])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedProfileImage, setSelectedProfileImage] = useState(0)
  const [captureMethod, setCaptureMethod] = useState("webcam")

  const [departmentInfo, setDepartmentInfo] = useState({
    department: "",
    position: "",
    startDate: "",
  })

  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState({})

  const webcamRef = useRef(null)
  const fileInputRef = useRef(null)
  const today = new Date().toISOString().split("T")[0]

  // Fetch departments and positions
  useEffect(() => {
    const fetchDepartmentsAndPositions = async () => {
      try {
        const departmentsRef = collection(db, "departments")
        const departmentsSnapshot = await getDocs(departmentsRef)

        if (!departmentsSnapshot.empty) {
          const departmentData = {}
          const departmentNames = []

          departmentsSnapshot.forEach((doc) => {
            const data = doc.data()
            departmentNames.push(data.name)
            departmentData[data.name] = data.positions || []
          })

          setDepartments(departmentNames)
          setPositions(departmentData)
        }
      } catch (error) {
        console.error("Error fetching departments:", error)
      }
    }

    fetchDepartmentsAndPositions()
  }, [])

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target
    setPersonalInfo({ ...personalInfo, [name]: value })
  }

  const handleDepartmentInfoChange = (e) => {
    const { name, value } = e.target
    setDepartmentInfo({ ...departmentInfo, [name]: value })
  }

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot()
    const newCapturedImages = [...capturedImages]
    newCapturedImages[currentImageIndex] = imageSrc
    setCapturedImages(newCapturedImages)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newCapturedImages = [...capturedImages]
        newCapturedImages[currentImageIndex] = event.target.result
        setCapturedImages(newCapturedImages)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const resetPhoto = () => {
    const newCapturedImages = [...capturedImages]
    newCapturedImages[currentImageIndex] = null
    setCapturedImages(newCapturedImages)
  }

  const nextImage = () => {
    if (currentImageIndex < 4) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const setAsProfileImage = () => {
    setSelectedProfileImage(currentImageIndex)
  }

  const hasMinimumImages = () => {
    return capturedImages.some((img) => img !== null)
  }

  const capturedImageCount = () => {
    return capturedImages.filter((img) => img !== null).length
  }

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isValidPhone = (phone) => {
    return /^[0-9]{10}$/.test(phone)
  }

  const checkPhoneExists = async (phone) => {
    try {
      const response = await axios.post("http://localhost:5000/check-phone", { phone })
      return response.data.exists
    } catch (error) {
      console.error("Error checking phone:", error)
      return false
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!personalInfo.fname.trim()) {
        alert("Please enter your first name")
        return
      }
      if (!personalInfo.lname.trim()) {
        alert("Please enter your last name")
        return
      }
      if (!isValidEmail(personalInfo.email)) {
        alert("Please enter a valid email address")
        return
      }
      if (!isValidPhone(personalInfo.phone)) {
        alert("Please enter a valid 10-digit phone number")
        return
      }

      setIsLoading(true)
      try {
        const phoneExists = await checkPhoneExists(personalInfo.phone)
        if (phoneExists) {
          alert("This phone number is already registered")
          return
        }
      } catch (error) {
        console.error("Error checking phone:", error)
        alert("Error checking phone number. Please try again.")
        return
      } finally {
        setIsLoading(false)
      }
    } else if (currentStep === 2) {
      if (!hasMinimumImages()) {
        alert("Please capture or upload at least one photo")
        return
      }

      if (capturedImages[selectedProfileImage] === null) {
        const firstImageIndex = capturedImages.findIndex((img) => img !== null)
        if (firstImageIndex !== -1) {
          setSelectedProfileImage(firstImageIndex)
        } else {
          alert("Please capture or upload at least one photo")
          return
        }
      }
    } else if (currentStep === 3) {
      if (!departmentInfo.department) {
        alert("Please select a department")
        return
      }
      if (!departmentInfo.position) {
        alert("Please select a position")
        return
      }
      if (!departmentInfo.startDate) {
        alert("Please select a start date")
        return
      }

      // Call handleSubmit and return early to prevent step increment
      await handleSubmit()
      return
    }

    // Only increment step if we're not on the final step
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      setProgress(currentStep === 1 ? 50 : currentStep === 2 ? 75 : 100)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setProgress(currentStep === 2 ? 25 : currentStep === 3 ? 50 : 75)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      // Validate that we have images
      const validImages = capturedImages.filter((img) => img !== null)
      if (validImages.length === 0) {
        alert("Please capture at least one photo before submitting")
        return
      }

      const profileImage = capturedImages[selectedProfileImage]
      if (!profileImage) {
        alert("Please select a profile image")
        return
      }

      const additionalImages = validImages.filter((img) => img !== profileImage)

      const formData = {
        ...personalInfo,
        ...departmentInfo,
        capturedImage: profileImage,
        additionalImages: additionalImages,
        status: "Active",
      }

      console.log("Submitting registration data:", {
        ...formData,
        capturedImage: "IMAGE_DATA_PRESENT",
        additionalImages: `${additionalImages.length} additional images`,
      })

      const response = await axios.post("http://localhost:5000/register", formData, {
        timeout: 30000, // 30 second timeout
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Registration response:", response.data)

      if (response.data.status === "success") {
        setEmployeeData({
          ...formData,
          employeeID: response.data.employeeID,
          encodingInfo: response.data.encoding_info,
        })
        setRegistrationComplete(true)
        setCurrentStep(4) // Move to success step
      } else {
        alert(response.data.message || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting form:", error)

      let errorMessage = "Registration failed. "

      if (error.code === "ECONNABORTED") {
        errorMessage += "Request timed out. Please check your connection and try again."
      } else if (error.response) {
        // Server responded with error status
        errorMessage += error.response.data?.message || error.response.statusText || "Server error occurred."
        console.error("Server error response:", error.response.data)
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += "No response from server. Please check if the backend is running on http://localhost:5000"
        console.error("No response received:", error.request)
      } else {
        // Something else happened
        errorMessage += error.message || "An unexpected error occurred."
      }

      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="header-title">
          <FaUserPlus />
          {/* <h1>High-Accuracy Employee Registration</h1> */}
          {/* <span className="accuracy-badge">99.2% Accuracy</span> */}
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="back-link">
            <FaArrowLeft />
            <span>Back</span>
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-container">
        <div className="progress-circles">
          {[1, 2, 3].map((step) => (
            <div key={step} className={`progress-circle ${currentStep >= step ? "active" : ""}`}>
              {step}
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Registration form */}
      <div className="register-card">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            {/* <p>Processing with dlib 128D face alignment...</p> */}
            {/* <small>Achieving 99.2% accuracy</small> */}
          </div>
        ) : registrationComplete && employeeData ? (
          <div className="success-container">
            <div className="success-icon">✓</div>
            <h2>Registration Successful!</h2>
            <div className="accuracy-info">
              {/* <span className="accuracy-badge">99.2% Accuracy Achieved</span> */}
              {/* <p>dlib ResNet 128D encoding with face alignment</p> */}
            </div>
            <div className="employee-photo">
              <img src={employeeData.capturedImage || "/placeholder.svg"} alt="Employee" />
            </div>
            <div className="employee-details">
              <p>
                <strong>Employee ID:</strong> {employeeData.employeeID}
              </p>
              <p>
                <strong>Name:</strong> {employeeData.fname} {employeeData.lname}
              </p>
              <p>
                <strong>Department:</strong> {employeeData.department}
              </p>
              <p>
                <strong>Position:</strong> {employeeData.position}
              </p>
              {employeeData.encodingInfo && (
                <div className="encoding-info">
                  <p>
                    <strong>Encoding Method:</strong> {employeeData.encodingInfo.method}
                  </p>
                  <p>
                    <strong>Dimensions:</strong> {employeeData.encodingInfo.dimensions}D
                  </p>
                  <p>
                    <strong>Additional Images:</strong> {employeeData.encodingInfo.additional_encodings}
                  </p>
                </div>
              )}
            </div>
            <div className="success-actions">
              <Link to="/employees" className="btn btn-primary">
                View All Employees
              </Link>
              <Link to="/register" className="btn btn-secondary" onClick={() => window.location.reload()}>
                Register Another
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="form-step">
                <h2>Personal Information</h2>
                <div className="form-group">
                  <label htmlFor="fname">First Name</label>
                  <input
                    type="text"
                    id="fname"
                    name="fname"
                    value={personalInfo.fname}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lname">Last Name</label>
                  <input
                    type="text"
                    id="lname"
                    name="lname"
                    value={personalInfo.lname}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={personalInfo.email}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <div className="phone-input-wrapper">
                    <div className="phone-prefix">+91</div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={personalInfo.phone}
                      onChange={handlePersonalInfoChange}
                      placeholder="Enter your 10-digit phone number"
                      maxLength="10"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={personalInfo.location}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your location/city"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Photo Capture */}
            {currentStep === 2 && (
              <div className="form-step">
                {/* <h2>High-Accuracy Facial Recognition</h2> */}
                <div className="accuracy-info">
                  {/* <span className="accuracy-badge">99.2% Accuracy</span> */}
                  {/* <p>Using dlib ResNet 128D encoding with face alignment</p> */}
                </div>
                <p className="photo-instruction">
                  Please capture or upload at least 1 photo (maximum 5). Photos will be processed with advanced face
                  alignment for maximum accuracy.
                </p>

                <div className="capture-method-toggle">
                  <button
                    className={`method-btn ${captureMethod === "webcam" ? "active" : ""}`}
                    onClick={() => setCaptureMethod("webcam")}
                  >
                    <FaCamera /> Use Webcam
                  </button>
                  <button
                    className={`method-btn ${captureMethod === "upload" ? "active" : ""}`}
                    onClick={() => setCaptureMethod("upload")}
                  >
                    <FaUpload /> Upload Photos
                  </button>
                </div>

                <div className="image-navigation">
                  <div className="image-indicators">
                    {capturedImages.map((img, index) => (
                      <div
                        key={index}
                        className={`image-indicator ${index === currentImageIndex ? "active" : ""} ${img ? "captured" : ""} ${index === selectedProfileImage ? "profile" : ""}`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="webcam-container">
                  {capturedImages[currentImageIndex] ? (
                    <div className="captured-photo-container">
                      <img
                        src={capturedImages[currentImageIndex] || "/placeholder.svg"}
                        alt={`Captured ${currentImageIndex + 1}`}
                        className="webcam-feed"
                      />
                      <div className="photo-actions">
                        <button className="photo-action-btn" onClick={resetPhoto}>
                          <FaRedo /> Retake
                        </button>
                        <button
                          className={`photo-action-btn ${selectedProfileImage === currentImageIndex ? "active" : ""}`}
                          onClick={setAsProfileImage}
                        >
                          <FaCheck /> Set as Profile
                        </button>
                      </div>
                    </div>
                  ) : captureMethod === "webcam" ? (
                    <>
                      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="webcam-feed" />
                      <button className="center-button" onClick={capturePhoto}>
                        <FaCamera /> Capture
                      </button>
                    </>
                  ) : (
                    <div className="upload-container">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        style={{ display: "none" }}
                      />
                      <div className="upload-placeholder">
                        <FaImage className="upload-icon" />
                        <p>Click to upload a photo</p>
                        <button className="upload-btn" onClick={triggerFileInput}>
                          <FaUpload /> Select Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="image-navigation-buttons">
                  <button className="nav-button" onClick={previousImage} disabled={currentImageIndex === 0}>
                    Previous
                  </button>
                  <button
                    className="nav-button"
                    onClick={nextImage}
                    disabled={currentImageIndex === 4 || capturedImageCount() >= 5}
                  >
                    Next
                  </button>
                </div>

                <div className="capture-progress">
                  <p>{capturedImageCount()} of 5 images captured (minimum 1 required)</p>
                  {capturedImageCount() >= 5 && <p className="max-images-note">Maximum number of images reached</p>}
                </div>
              </div>
            )}

            {/* Step 3: Department Details */}
            {currentStep === 3 && (
              <div className="form-step">
                <h2>Department Details</h2>
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <select
                    id="department"
                    name="department"
                    value={departmentInfo.department}
                    onChange={handleDepartmentInfoChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="position">Position</label>
                  <select
                    id="position"
                    name="position"
                    value={departmentInfo.position}
                    onChange={handleDepartmentInfoChange}
                    disabled={!departmentInfo.department}
                  >
                    <option value="">Select Position</option>
                    {departmentInfo.department &&
                      positions[departmentInfo.department]?.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={departmentInfo.startDate}
                    onChange={handleDepartmentInfoChange}
                    min={today}
                  />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="navigation-buttons">
              {currentStep > 1 && (
                <button className="btn btn-secondary" onClick={handlePrevious}>
                  Previous
                </button>
              )}
              <button className="btn btn-primary" onClick={handleNext}>
                {currentStep === 3 ? "submit" : "Next"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Register

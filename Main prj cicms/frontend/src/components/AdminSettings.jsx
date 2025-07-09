"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { doc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { db } from "../firebase"
import { FaCamera, FaUser, FaUpload, FaTimes, FaTrash } from "react-icons/fa"
import "../styles/AdminSettings.css"
import Webcam from "react-webcam"

const AdminSettings = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState("profile")

  // State for profile form
  const [profileForm, setProfileForm] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "",
    phone: "",
    role: "Admin",
  })

  // State for security form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    sessionTimeout: 30,
  })

  // State for profile image
  const [profileImage, setProfileImage] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // File input ref
  const fileInputRef = useRef(null)
  const webcamRef = useRef(null)
  const [showWebcam, setShowWebcam] = useState(false)

  // State for loading and error messages
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const auth = getAuth()

  // Fetch admin profile data
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail")
        if (!userEmail) return

        // Query Firestore for admin profile
        const adminsRef = collection(db, "admins")
        const q = query(adminsRef, where("email", "==", userEmail))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const adminData = querySnapshot.docs[0].data()
          setProfileForm({
            firstName: adminData.firstName || "Admin",
            lastName: adminData.lastName || "User",
            email: adminData.email || userEmail,
            phone: adminData.phone || "",
            role: adminData.role || "Admin",
          })

          // Set profile image if exists
          if (adminData.profileImage) {
            setProfileImage(adminData.profileImage)
          }
        } else {
          // Set default values with the email from localStorage
          setProfileForm((prev) => ({
            ...prev,
            email: userEmail,
          }))
        }
      } catch (err) {
        console.error("Error fetching admin profile:", err)
        setError("Failed to load profile data")
      }
    }

    fetchAdminProfile()
  }, [])

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileForm({
      ...profileForm,
      [name]: value,
    })
  }

  // Handle security form changes
  const handleSecurityChange = (e) => {
    const { name, value } = e.target
    setSecurityForm({
      ...securityForm,
      [name]: value,
    })
  }

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const imageDataUrl = event.target.result
        setProfileImage(imageDataUrl)
        setIsUploading(false)
      } catch (error) {
        console.error("Error processing image:", error)
        setError("Failed to process image")
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // Capture image from webcam
  const captureFromWebcam = async () => {
    if (webcamRef.current) {
      try {
        setIsUploading(true)
        const imageSrc = webcamRef.current.getScreenshot()
        setProfileImage(imageSrc)
        setShowWebcam(false)
        setIsUploading(false)
      } catch (error) {
        console.error("Error capturing from webcam:", error)
        setError("Failed to capture image")
        setIsUploading(false)
      }
    }
  }

  // Remove profile image
  const removeProfileImage = () => {
    setProfileImage(null)
    setSuccess("Profile image removed. Click Save Changes to confirm.")
  }

  // Trigger file input click
  const triggerFileInput = () => {
    // Close webcam if open
    if (showWebcam) {
      setShowWebcam(false)
    }
    fileInputRef.current.click()
  }

  // Toggle webcam
  const toggleWebcam = () => {
    setShowWebcam(!showWebcam)
  }

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const userEmail = localStorage.getItem("userEmail")
      if (!userEmail) {
        setError("User not authenticated")
        setLoading(false)
        return
      }

      // Prepare data for API
      const adminData = {
        email: userEmail,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        profileImage: profileImage,
        removeImage: profileImage === null,
      }

      // Send to backend API
      const response = await fetch("http://localhost:5000/update-admin-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminData),
      })

      const data = await response.json()

      if (data.status === "success") {
        setSuccess("Profile updated successfully")
      } else {
        setError(data.message || "Failed to update profile")
      }

      // Also update Firestore directly as a backup
      const adminsRef = collection(db, "admins")
      const q = query(adminsRef, where("email", "==", userEmail))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // Update existing admin document
        const adminDoc = querySnapshot.docs[0]

        if (profileImage === null) {
          // Remove profile image field
          await updateDoc(doc(db, "admins", adminDoc.id), {
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
            phone: profileForm.phone,
            profileImage: null,
            updatedAt: new Date(),
          })
        } else {
          // Update with new profile image
          await updateDoc(doc(db, "admins", adminDoc.id), {
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
            phone: profileForm.phone,
            profileImage: profileImage,
            updatedAt: new Date(),
          })
        }
      } else {
        // Create new admin document
        await addDoc(collection(db, "admins"), {
          email: userEmail,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
          profileImage: profileImage,
          role: "Admin",
          createdAt: new Date(),
        })
      }

      setSuccess("Profile updated successfully")
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Handle security form submission
  const handleSecuritySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validate passwords match
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError("New passwords do not match")
      setLoading(false)
      return
    }

    try {
      const user = auth.currentUser
      if (!user) {
        setError("User not authenticated")
        setLoading(false)
        return
      }

      // Re-authenticate user before changing password
      if (securityForm.currentPassword && securityForm.newPassword) {
        const credential = EmailAuthProvider.credential(user.email, securityForm.currentPassword)

        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, securityForm.newPassword)
      }

      // Update session timeout in localStorage
      localStorage.setItem("sessionTimeout", securityForm.sessionTimeout.toString())

      setSuccess("Security settings updated successfully")

      // Reset password fields
      setSecurityForm({
        ...securityForm,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (err) {
      console.error("Error updating security settings:", err)
      if (err.code === "auth/wrong-password") {
        setError("Current password is incorrect")
      } else {
        setError("Failed to update security settings")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-settings-container">
      <header className="settings-header">
        <div className="settings-title">
          <span className="settings-icon">⚙</span>
          <h1>Admin Settings</h1>
        </div>
        <Link to="/dashboard" className="back-button">
          <span>←</span> Back to Dashboard
        </Link>
      </header>

      <div className="settings-content">
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="tab-icon">👤</span> Profile
          </button>
          <button
            className={`tab-button ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <span className="tab-icon">🔒</span> Security
          </button>
        </div>

        <div className="settings-panel">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {activeTab === "profile" && (
            <div className="profile-settings">
              <h2>Profile Settings</h2>

              <div className="profile-photo-section">
                <div className="profile-photo-container">
                  {profileImage ? (
                    <img src={profileImage || "/placeholder.svg"} alt="Profile" className="profile-photo" />
                  ) : (
                    <div className="profile-placeholder">
                      <FaUser />
                    </div>
                  )}
                  {isUploading && <div className="upload-overlay">Uploading...</div>}
                </div>

                <div className="profile-photo-actions">
                  <h3>Set Profile Pic</h3>
                  <div className="photo-action-buttons">
                    <button className="photo-action-btn upload" onClick={triggerFileInput}>
                      <FaUpload /> Upload Pic
                    </button>
                    <button className="photo-action-btn capture" onClick={toggleWebcam}>
                      <FaCamera /> Capture
                    </button>
                    {profileImage && (
                      <button className="photo-action-btn remove" onClick={removeProfileImage}>
                        <FaTrash /> Remove
                      </button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                  </div>

                  {showWebcam && (
                    <div className="webcam-container">
                      <button className="webcam-close-btn" onClick={() => setShowWebcam(false)}>
                        <FaTimes />
                      </button>
                      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="webcam-feed" />
                      <button className="capture-btn" onClick={captureFromWebcam}>
                        <FaCamera /> Take Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={profileForm.role}
                    onChange={handleProfileChange}
                    readOnly
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={loading}>
                    <span className="save-icon">💾</span> {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="security-settings">
              <h2>Security Settings</h2>

              <form onSubmit={handleSecuritySubmit} className="security-form">
                <div className="password-section">
                  <h3>Change Password</h3>

                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={securityForm.currentPassword}
                      onChange={handleSecurityChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={securityForm.newPassword}
                      onChange={handleSecurityChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={securityForm.confirmPassword}
                      onChange={handleSecurityChange}
                      required
                    />
                  </div>
                </div>

                <div className="session-section">
                  <h3>Session Timeout (minutes)</h3>

                  <div className="form-group">
                    <input
                      type="number"
                      id="sessionTimeout"
                      name="sessionTimeout"
                      value={securityForm.sessionTimeout}
                      onChange={handleSecurityChange}
                      min="1"
                      max="120"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={loading}>
                    <span className="save-icon">💾</span> {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSettings



import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { getAuth, sendPasswordResetEmail } from "firebase/auth"
import "../styles/ForgotPassword.css"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const auth = getAuth()

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!email) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    try {
      // Use Firebase's built-in password reset functionality
      await sendPasswordResetEmail(auth, email)

      setSuccess(`Password reset link sent to ${email}! Please check your email.`)

      // Optional: Redirect to login after a delay
      setTimeout(() => {
        navigate("/login")
      }, 5000)
    } catch (err) {
      console.error("Password reset error:", err)
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address")
      } else {
        setError("Failed to send reset link. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>FACE APP</h1>
          <h2>Reset Password</h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleResetPassword} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <button type="submit" className={`submit-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
            {isLoading ? "Sending..." : "Reset Password"}
          </button>

          <div className="back-to-login">
            <Link to="/login">Back </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword


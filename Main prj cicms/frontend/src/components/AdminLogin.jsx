// "use client"

// import { useState } from "react"
// import { useNavigate, Link } from "react-router-dom"
// import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
// import "../styles/AdminLogin.css"

// const AdminLogin = ({ setIsAuthenticated }) => {
//   const [username, setUsername] = useState("")
//   const [password, setPassword] = useState("")
//   const [error, setError] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const navigate = useNavigate()
//   const auth = getAuth()

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setIsLoading(true)
//     setError("")

//     if (!username || !password) {
//       setError("Please enter both username and password")
//       setIsLoading(false)
//       return
//     }

//     try {
//       // Assuming username is email for Firebase auth
//       const userCredential = await signInWithEmailAndPassword(auth, username, password)

//       if (userCredential.user) {
//         // Set authentication status
//         localStorage.setItem("isAuthenticated", "true")
//         localStorage.setItem("userEmail", userCredential.user.email)
//         setIsAuthenticated(true)

//         // Redirect to home page
//         navigate("/home")
//       }
//     } catch (err) {
//       console.error("Login error:", err)
//       if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
//         setError("Invalid email or password")
//       } else if (err.code === "auth/too-many-requests") {
//         setError("Too many failed login attempts. Please try again later.")
//       } else {
//         setError("Failed to login. Please try again.")
//       }
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="admin-login-container">
//       <div className="login-card">
//         <div className="login-header">
//           <h1>FACE APP</h1>
//           <h2>Admin Login</h2>
//         </div>

//         {error && <div className="error-message">{error}</div>}

//         <form onSubmit={handleSubmit} className="login-form">
//           <div className="form-group">
//             <label htmlFor="username">Admin Username</label>
//             <input
//               type="text"
//               id="username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               placeholder="Enter your username"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="password">Password</label>
//             <input
//               type="password"
//               id="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Enter your password"
//               required
//             />
//           </div>

//           <div className="forgot-password">
//             <Link to="/forgot-password">Forgot Password?</Link>
//           </div>

//           <button type="submit" className={`login-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
//             {isLoading ? "Logging in..." : "Login"}
//           </button>
//         </form>
//       </div>
//     </div>
//   )
// }

// export default AdminLogin

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';
import '../styles/AdminLogin.css';

const AdminLogin = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      // Assuming username is email for Firebase auth
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      
      if (userCredential.user) {
        // Set authentication status
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', userCredential.user.email);
        setIsAuthenticated(true);
        
        // Redirect to home page
        navigate('/home');
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('Failed to login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCardClick = () => {
    if (!showLoginForm) {
      setShowLoginForm(true);
    }
  };

  return (
    <div className="admin-login-container">
      <div className={`login-cards-wrapper ${showLoginForm ? 'show-login' : ''}`}>
        {/* Admin Profile Card */}
        <div 
          className={`admin-profile-card ${showLoginForm ? 'moved-up' : ''}`} 
          onClick={handleCardClick}
        >
          <div className="admin-profile-image">
            <FaUser />
          </div>
          <h2>Admin Portal</h2>
          <p>Click to login</p>
        </div>
        
        {/* Login Form Card */}
        <div className={`login-card ${showLoginForm ? 'visible' : ''}`}>
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="form-group password-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                  tabIndex="-1"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div className="forgot-password">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
            
            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;




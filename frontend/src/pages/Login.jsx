import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [activeTab, setActiveTab] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')      // to show error messages
  const [loading, setLoading] = useState(false) // to disable button while waiting

  async function handleSubmit() {
    // clear previous errors
    setError('')

    // validation
    if (email === '' || password === '') {
      setError('Please fill in all fields')
      return
    }
    if (activeTab === 'register' && name === '') {
      setError('Please enter your name')
      return
    }

    setLoading(true)  // disable button, show loading

    try {
      if (activeTab === 'register') {
        // send POST request to backend register route
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          name,
          email,
          password
        })
        // if successful, switch to login tab
        setActiveTab('login')
        setEmail('')
        setPassword('')
        setError('Account created! Please login.')

      } else {
        // send POST request to backend login route
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email,
          password
        })
        // save token in localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
 

        // add this inside the Login function, above handleSubmit
        const navigate = useNavigate()
        navigate('/dashboard')
      }

    } catch (err) {
      // backend sends error in err.response.data.message
      setError(err.response?.data?.message || 'Something went wrong')
    }

    setLoading(false)  // re-enable button
  }

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-header">
          <h1>SplitSmart</h1>
          <p>Split expenses. Stay friends.</p>
        </div>

        <div className="auth-tabs">
          <button
            className={activeTab === 'login' ? 'tab active' : 'tab'}
            onClick={() => { setActiveTab('login'); setName(''); setEmail(''); setPassword(''); setError('') }}
          >
            Login
          </button>
          <button
            className={activeTab === 'register' ? 'tab active' : 'tab'}
            onClick={() => { setActiveTab('register'); setName(''); setEmail(''); setPassword(''); setError('') }}
          >
            Register
          </button>
        </div>

        <div className="auth-form">

          {activeTab === 'register' && (
            <input
              type="text"
              placeholder="Full Name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* show error message if any */}
          {error && <p className="error-text">{error}</p>}

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Please wait...' : activeTab === 'login' ? 'Login' : 'Create Account'}
          </button>

        </div>
      </div>
    </div>
  )
}

export default Login
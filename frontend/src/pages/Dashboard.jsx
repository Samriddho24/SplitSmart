import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  // get user from localStorage
  const user = JSON.parse(localStorage.getItem('user'))

  function handleLogout() {
    // clear everything from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // redirect to login
    navigate('/')
  }

  return (
    <div className="dashboard-container">

      <div className="sidebar">
        <h2 className="logo">SplitSmart</h2>
        <nav className="nav-links">
          <button className="nav-item active">Dashboard</button>
          <button className="nav-item">My Groups</button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <h1>Welcome back, {user?.name} 👋</h1>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <p className="stat-label">Total Groups</p>
            <h2 className="stat-number">0</h2>
          </div>
          <div className="stat-card">
            <p className="stat-label">You Owe</p>
            <h2 className="stat-number red">₹0</h2>
          </div>
          <div className="stat-card">
            <p className="stat-label">Owed to You</p>
            <h2 className="stat-number green">₹0</h2>
          </div>
        </div>

        <div className="empty-state">
          <p>No groups yet. Create one to get started.</p>
          <button className="btn-primary">+ Create Group</button>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
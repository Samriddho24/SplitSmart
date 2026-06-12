import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import API from '../api'

function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  const [groups, setGroups] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)

  // fetch groups when page loads
  useEffect(() => {
    fetchGroups()
  }, [])

  async function fetchGroups() {
    try {
      const response = await API.get('/groups')
      setGroups(response.data.groups)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCreateGroup() {
    if (!groupName) return
    setLoading(true)
    try {
      await API.post('/groups/create', { name: groupName })
      setGroupName('')
      setShowModal(false)
      fetchGroups()  // refresh list
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'  // full page reload instead of navigate
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2 className="logo">SplitSmart</h2>
        <nav className="nav-links">
          <button className="nav-item active">Dashboard</button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <h1>Welcome back, {user?.name} 👋</h1>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <p className="stat-label">Total Groups</p>
            <h2 className="stat-number">{groups.length}</h2>
          </div>
        </div>

        <div className="groups-section">
          <div className="section-header">
            <h2>My Groups</h2>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              + Create Group
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="empty-state">
              <p>No groups yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="groups-list">
              {groups.map(group => (
                <div
                  key={group.id}
                  className="group-card"
                  onClick={() => navigate(`/group/${group.id}`)}
                >
                  <h3>{group.name}</h3>
                  <p>Created {new Date(group.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Create New Group</h2>
              <input
                type="text"
                placeholder="Group name e.g. Goa Trip"
                className="input"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <div className="modal-buttons">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleCreateGroup} disabled={loading}>
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
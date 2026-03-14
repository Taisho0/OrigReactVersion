export default function DashboardSidebar() {
  const navItems = [
    { icon: '📊', label: 'Dashboard', active: true },
    { icon: '📈', label: 'Analytics' },
    { icon: '📋', label: 'Masterfiles' },
    { icon: '👥', label: 'Users' },
    { icon: '⚙️', label: 'Settings' },
    { icon: '📑', label: 'Reports' },
  ]

  return (
    <aside className="dashboard-sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => (
          <div key={idx} className={`nav-item ${item.active ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  )
}

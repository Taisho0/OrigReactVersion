import React from 'react'
import { userAuth } from '../auth/AuthContext.jsx'
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import DashboardSidebar from '../components/DashboardSidebar.jsx'
import '../styles/Dashboard.css'


const Home = () => {
  const { session, signOut } = userAuth();
  const navigate =  useNavigate();
  console.log(session);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const masterRecords = [
    { id: '10001', name: 'Team Name', date: '02/09/2023', status: 'Status', actions: '✎ 🗑' },
    { id: '10002', name: 'Team Name', date: '02/09/2023', status: 'Status', actions: '✎ 🗑' },
    { id: '10003', name: 'Amorn John', date: '09/18/2022', status: 'New', actions: '✎ 🗑' },
    { id: '10004', name: 'Boren Name', date: '12-08-2023', status: 'Status', actions: '✎ 🗑' }
  ]

  const recentActivityItems = [
    { icon: '👤', text: 'Recent decoded', time: '2 hours ago' },
    { icon: '📊', text: 'Millned calomorth activity', time: '1 hour ago' },
    { icon: '📋', text: 'Recent print inrecet', time: '1 hour ago' }
  ]

  const teamMembers = [
    { icon: '👤', name: 'Alerson Anner', role: 'Team Member' },
    { icon: '👤', name: 'Jiann Danner', role: 'Team Member' },
    { icon: '👤', name: 'Jean Smith', role: 'Team Member' }
  ]

  return (
    <div className="dashboard-wrapper">
      <SiteHeader />
      <div className="dashboard-container">
        <DashboardSidebar />
        <div>
          <h2>Welcome, {session?.user?.email}</h2>
          <p className='hover:cursor-pointer border inline-block px-4 py-3 mt-4' onClick={handleSignOut}>
            Signout
          </p>
        </div>
        <main className="dashboard-main">
          <div className="dashboard-top">
            {/* Data Analytics Section */}
            <section className="analytics-section">
              <div className="section-header">
                <h2>Data Analytics</h2>
                <div className="controls">
                  <button className="btn-small">All ▼</button>
                  <button className="btn-small">Filters ▼</button>
                </div>
              </div>
              
              <div className="metrics-row">
                <div className="metric">
                  <div className="metric-label">Total</div>
                  <div className="metric-value">$12.9B</div>
                  <div className="metric-change positive">↑ 8.8%</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Average</div>
                  <div className="metric-value">$24.6K</div>
                  <div className="metric-change positive">↑ 28.7%</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Earnings analysis</div>
                  <div className="metric-value">$1.00%</div>
                  <div className="metric-change positive">↑ 4.88%</div>
                </div>
              </div>

              <div className="charts-row">
                <div className="chart-placeholder">
                  <div className="chart-title">Line Chart</div>
                  <svg viewBox="0 0 300 150" style={{width: '100%', height: '120px'}}>
                    <polyline points="10,100 60,80 110,70 160,85 210,60 260,75" fill="none" stroke="#00d4ff" strokeWidth="2"/>
                    <polyline points="10,110 60,95 110,90 160,105 210,85 260,95" fill="none" stroke="#a78bfa" strokeWidth="2" opacity="0.6"/>
                  </svg>
                </div>
                <div className="chart-placeholder">
                  <div className="chart-title">Bar Chart</div>
                  <svg viewBox="0 0 300 150" style={{width: '100%', height: '120px'}}>
                    <rect x="40" y="80" width="30" height="50" fill="#00d4ff"/>
                    <rect x="80" y="60" width="30" height="70" fill="#a78bfa"/>
                    <rect x="120" y="70" width="30" height="60" fill="#06b6d4"/>
                    <rect x="160" y="40" width="30" height="90" fill="#10b981"/>
                    <rect x="200" y="65" width="30" height="65" fill="#f59e0b"/>
                  </svg>
                </div>
                <div className="chart-placeholder pie-chart">
                  <div className="chart-title">Pie Chart</div>
                  <svg viewBox="0 0 120 120" style={{width: '100%', height: '120px'}}>
                    <circle cx="60" cy="60" r="45" fill="none" stroke="#00d4ff" strokeWidth="20" strokeDasharray="70.7 141.4"/>
                    <circle cx="60" cy="60" r="45" fill="none" stroke="#a78bfa" strokeWidth="20" strokeDasharray="70.7 141.4" style={{transform: 'rotate(180deg)', transformOrigin: '60px 60px'}}/>
                  </svg>
                  <div className="pie-legend">
                    <div><span style={{color: '#00d4ff'}}>●</span> Real from - 55%</div>
                    <div><span style={{color: '#a78bfa'}}>●</span> Alternatives - 65%</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="dashboard-bottom">
            {/* Master Record Section */}
            <section className="master-section">
              <div className="section-header">
                <h2>Master Record</h2>
                <button className="btn-add">+ Add New</button>
              </div>
              <div className="master-controls">
                <input type="search" placeholder="Search..." className="search-input"/>
                <div className="controls-right">
                  <span className="control-dots">⋯</span>
                </div>
              </div>
              <div className="table-scroll">
                <table className="master-table">
                  <thead>
                    <tr>
                      <th>ID ↑</th>
                      <th>Name</th>
                      <th>Date ↓</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.id}</td>
                        <td>{record.name}</td>
                        <td>{record.date}</td>
                        <td><span className="status-badge">{record.status}</span></td>
                        <td>{record.actions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Right Sidebar Widgets */}
            <div className="dashboard-widgets">
              {/* Recent Activity */}
              <section className="widget">
                <div className="widget-header">
                  <h3>Recent Activity</h3>
                  <span className="widget-menu">⋯</span>
                </div>
                <div className="activity-list">
                  {recentActivityItems.map((item, idx) => (
                    <div key={idx} className="activity-item">
                      <span className="activity-icon">{item.icon}</span>
                      <div className="activity-info">
                        <p>{item.text}</p>
                        <small>{item.time}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* System Status */}
              <section className="widget">
                <div className="widget-header">
                  <h3>System Status</h3>
                  <span className="widget-menu">⋯</span>
                </div>
                <div className="status-gauge">
                  <svg viewBox="0 0 200 120" style={{width: '100%', height: '100px'}}>
                    <path d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round"/>
                    <path d="M 30 100 A 70 70 0 0 1 130 50" fill="none" stroke="#00d4ff" strokeWidth="8" strokeLinecap="round"/>
                  </svg>
                  <p className="status-text">Status</p>
                </div>
              </section>

              {/* Team Members */}
              <section className="widget">
                <div className="widget-header">
                  <h3>Team Members</h3>
                  <span className="widget-menu">⋯</span>
                </div>
                <div className="members-list">
                  {teamMembers.map((member, idx) => (
                    <div key={idx} className="member-item">
                      <span className="member-icon">{member.icon}</span>
                      <div>
                        <p className="member-name">{member.name}</p>
                        <small>{member.role}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}

export default Home ;
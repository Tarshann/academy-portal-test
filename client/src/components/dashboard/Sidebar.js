// client/src/components/dashboard/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Get active menu item based on current location
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img 
          src="/images/logo.svg" 
          alt="The Academy Logo" 
          className="sidebar-logo" 
        />
        {!isCollapsed && <h1>The Academy</h1>}
        
        <button 
          className="collapse-button" 
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`fas fa-${isCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="user-profile">
          <img 
            src={user.profileImage} 
            alt={user.name} 
            className="profile-image" 
          />
          <div className="profile-info">
            <h3>{user.name}</h3>
            <span className="role-badge">{user.role}</span>
          </div>
        </div>
      )}
      
      <nav className="sidebar-nav">
        <ul>
          <li className={isActive('/dashboard')}>
            <Link to="/dashboard">
              <i className="fas fa-home"></i>
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          </li>
          
          <li className={isActive('/messages')}>
            <Link to="/messages">
              <i className="fas fa-comments"></i>
              {!isCollapsed && <span>Messages</span>}
            </Link>
          </li>
          
          <li className={isActive('/programs')}>
            <Link to="/programs">
              <i className="fas fa-basketball-ball"></i>
              {!isCollapsed && <span>Programs</span>}
            </Link>
          </li>
          
          <li className={isActive('/schedule')}>
            <Link to="/schedule">
              <i className="fas fa-calendar-alt"></i>
              {!isCollapsed && <span>Schedule</span>}
            </Link>
          </li>
          
          {user.role === 'admin' && (
            <li className={isActive('/admin')}>
              <Link to="/admin">
                <i className="fas fa-users-cog"></i>
                {!isCollapsed && <span>Admin</span>}
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <ul>
          <li className={isActive('/profile')}>
            <Link to="/profile">
              <i className="fas fa-user-cog"></i>
              {!isCollapsed && <span>Profile</span>}
            </Link>
          </li>
          
          <li>
            <button className="logout-button" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
              {!isCollapsed && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;

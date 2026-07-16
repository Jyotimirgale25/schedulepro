import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  return (
    <div className="container mt-5">
      <div className="alert alert-success">
        <h2>Welcome {user?.fullName || user?.username}!</h2>
        <p>You have successfully logged in to the Employee Scheduling System.</p>
        <button 
          className="btn btn-danger mt-3"
          onClick={() => {
            localStorage.removeItem('user');
            navigate('/login');
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
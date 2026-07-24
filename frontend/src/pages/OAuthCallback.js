import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const OAuthCallback = () => {
    const navigate = useNavigate();
    
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const token = searchParams.get('token');
    const role = searchParams.get('role');

    useEffect(() => {
        console.log('OAuth Callback - Token:', token);
        console.log('OAuth Callback - Role:', role);
        
        if (!token || !role) {
            console.log('No token or role found, redirecting to login');
            navigate('/login');
            return;
        }

        // Store token immediately
        localStorage.setItem('accessToken', token);
        console.log('Token stored in localStorage');

        // Fetch user details
        fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            console.log('Response status:', res.status);
            if (!res.ok) {
                throw new Error('Failed to fetch user');
            }
            return res.json();
        })
        .then(user => {
            console.log('User data received:', user);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Redirect based on role
            const userRole = user.role || role;
            console.log('Redirecting based on role:', userRole);
            
            if (userRole === 'ADMIN') {
                window.location.href = '/admin/dashboard';
            } else if (userRole === 'MANAGER') {
                window.location.href = '/manager/dashboard';
            } else {
                window.location.href = '/employee/dashboard';
            }
        })
        .catch(err => {
            console.error('Error fetching user:', err);
            setError('Failed to load user data. Please try again.');
            setTimeout(() => navigate('/login'), 3000);
        });
    }, [token, role, navigate]);

    if (error) {
        return (
            <div className="container mt-5 text-center">
                <h2 className="text-danger">Error</h2>
                <p>{error}</p>
                <p>Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="container mt-5 text-center">
            <h2>Logging you in...</h2>
            <div className="spinner-border text-primary mt-3" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Please wait while we redirect you...</p>
        </div>
    );
};

export default OAuthCallback;
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuth2Redirect = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // ✅ Get BOTH token and role from URL
    const token = searchParams.get('token');
    const role = searchParams.get('role');

    useEffect(() => {
        console.log('🔐 OAuth2 Redirect Page Loaded');
        console.log('🔐 Full URL:', window.location.href);
        console.log('🔐 Token:', token ? 'YES' : 'NO');
        console.log('🔐 Role:', role);

        if (!token || !role) {
            console.log('❌ Missing token or role, redirecting to login');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            return;
        }

        // ✅ Store token
        localStorage.setItem('accessToken', token);
        localStorage.setItem('token', token);
        console.log('✅ Token stored in localStorage');

        // ✅ Fetch user details
        fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            console.log('📡 Response status:', res.status);
            if (!res.ok) {
                throw new Error('Failed to fetch user');
            }
            return res.json();
        })
        .then(user => {
            console.log('👤 User data received:', user);
            localStorage.setItem('user', JSON.stringify(user));
            
            // ✅ Use role from URL or from user data
            const userRole = user.role || role;
            console.log('🎯 Redirecting based on role:', userRole);
            
            setTimeout(() => {
            
                    window.location.href = '/employee/dashboard';
                
            }, 1000);
        })
        .catch(err => {
            console.error('❌ Error fetching user:', err);
            // ✅ If fetch fails, use role from URL
            setTimeout(() => {
                if (role === 'ADMIN') {
                    window.location.href = '/admin/dashboard';
                } else if (role === 'MANAGER') {
                    window.location.href = '/manager/dashboard';
                } else {
                    window.location.href = '/employee/dashboard';
                }
            }, 1000);
        });
    }, [token, role, navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
        }}>
            <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }}></div>
            <p style={{ marginTop: '20px', fontSize: '18px' }}>
                {token ? '✅ Logging you in...' : '⏳ Processing...'}
            </p>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default OAuth2Redirect;
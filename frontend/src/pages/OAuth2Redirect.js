import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuth2Redirect = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        console.log('🔑 OAuth2 Redirect Page Loaded');
        console.log('🔑 Full URL:', window.location.href);
        console.log('🔑 Location Search:', location.search);

        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        console.log('🔑 Token from URL:', token ? 'YES' : 'NO');
        console.log('🔑 Token value:', token);

        if (token) {
            localStorage.setItem('accessToken', token);
            console.log('✅ Token stored in localStorage');
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const role = user.role || 'EMPLOYEE';

            setTimeout(() => {
                if (role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else if (role === 'MANAGER') {
                    navigate('/manager/dashboard');
                } else {
                    navigate('/employee/dashboard');
                }
            }, 1000);
        } else {
            console.log('❌ No token found, redirecting to login');
            setTimeout(() => {
                navigate('/login');
            }, 1000);
        }
    }, [location, navigate]);

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
                {localStorage.getItem('accessToken') ? '✅ Logging you in...' : '⏳ Processing...'}
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
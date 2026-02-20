import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const isDashboard = router.pathname === '/dashboard';

    useEffect(() => {
        const name = localStorage.getItem('userFirstName') || '';
        setFirstName(name);

        const handler = () => setFirstName(localStorage.getItem('userFirstName') || '');
        window.addEventListener('user-info-updated', handler);
        return () => window.removeEventListener('user-info-updated', handler);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    if (!isDashboard) return null;

    return (
        <nav style={{ background: '#4a0404', borderBottom: '3px solid #2b0202' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🌸</span>
                    <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '16px', letterSpacing: '0.5px' }}>Women's Wellness</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {firstName && (
                        <span style={{ color: '#ffcccc', fontSize: '14px' }}>Hello, <strong>{firstName}</strong></span>
                    )}
                    <button
                        onClick={handleLogout}
                        style={{ background: '#2b0202', color: '#ffcccc', border: '1px solid #800000', padding: '6px 14px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

import React from 'react';

const Spinner: React.FC = () => (
    <div style={{
        width: '20px', height: '20px', border: '2px solid rgba(0, 0, 0, 0.1)',
        borderLeftColor: '#22c55e', borderRadius: '50%', display: 'inline-block',
        animation: 'spin 1s linear infinite'
    }}></div>
);
export default Spinner;

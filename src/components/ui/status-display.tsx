import React from 'react';
import Spinner from './spinner';

interface StatusDisplayProps {
    userId: string;
    statusMessage: string;
    isConnecting: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ userId, statusMessage, isConnecting }) => (
    <div className="mb-6 text-center">
        <p className="text-sm font-medium text-gray-500">Your User ID</p>
        <p className="text-base font-mono text-gray-600 bg-gray-100 rounded-lg p-2 break-all my-1">{userId || 'Initializing...'}</p>
        <div className="mt-2 text-base font-semibold text-green-600 flex items-center justify-center gap-2">
            {isConnecting && <Spinner />}
            <p>{statusMessage}</p>
        </div>
    </div>
);

export default StatusDisplay;
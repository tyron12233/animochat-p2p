"use client";

import { useState, useEffect, useCallback } from 'react';
import { Server, Users, MessageSquare, Database, RefreshCw, AlertTriangle, Warehouse, ServerCrash, Cpu, MemoryStick, Activity, ChevronDown } from 'lucide-react';

// =================================================================================
// --- Type Definitions ---
// Updated types to include OS, memory, and CPU metrics from your services.
// =================================================================================

interface ServiceInstance {
    serviceName: string;
    version: string;
    url: string;
    timestamp: number;
    status: string;
}

interface ServiceDiscoveryResponse {
    [serviceName: string]: {
        [version: string]: ServiceInstance[];
    };
}

interface OsInfo {
    hostname: string;
    platform: string;
    totalMemory: string;
    freeMemory: string;
    cpuCount: number;
    loadAverage: number[];
}

interface ProcessMemory {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
}

interface CpuUsage {
    user: number;
    system: number;
}

interface MatchmakingMetrics {
    activeSessions: number;
    usersInQueue: number;
}

interface MatchmakingStatus {
    serviceState: 'ACTIVE' | 'MAINTENANCE';
    timestamp: string;
    redis: {
        commands: string;
        subscriber: string;
    };
    metrics: MatchmakingMetrics;
    serviceInfo: {
        serviceName: string;
        version: string;
    };
    // Optional system metrics
    os?: OsInfo;
    processMemory?: ProcessMemory;
    cpuUsage?: CpuUsage;
}

interface ChatRoom {
    chatId: string;
    participants: number;
    totalConnections: number;
}

interface ChatServerStatus {
    totalRooms: number;
    rooms: ChatRoom[];
    serviceInfo: { 
        serviceName: string;
        version: string;
    };
    serviceState: string;
    // Optional system metrics
    os?: OsInfo;
    processMemory?: ProcessMemory;
    cpuUsage?: CpuUsage;
}

type ServiceStatus =
    | { type: 'matchmaking'; data: MatchmakingStatus }
    | { type: 'chat'; data: ChatServerStatus }
    | { type: 'error'; message: string; serviceInfo: Partial<ServiceInstance> };

// =================================================================================
// --- Reusable UI Components ---
// =================================================================================

const StatusIndicator = ({ status }: { status: 'ACTIVE' | 'MAINTENANCE' | 'ERROR' | 'RUNNING' | string }) => {
    let displayStatus: 'ACTIVE' | 'MAINTENANCE' | 'ERROR' = 'ERROR';
    if (status === 'ACTIVE' || status === 'RUNNING' || status === 'ready') {
        displayStatus = 'ACTIVE';
    } else if (status === 'MAINTENANCE') {
        displayStatus = 'MAINTENANCE';
    }

    const color = displayStatus === 'ACTIVE' ? 'bg-green-500' : displayStatus === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-red-500';
    const text = displayStatus.charAt(0) + displayStatus.slice(1).toLowerCase();

    return (
        <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${color}`}></span>
            <span className="text-sm font-semibold text-gray-700">{text}</span>
        </div>
    );
};

const StatCard = ({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) => (
    <div className="bg-green-50/50 p-4 rounded-lg flex items-center gap-4">
        <div className="bg-green-100 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const SystemMetric = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | undefined }) => (
    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
        <div className="text-gray-500">{icon}</div>
        <div>
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm font-semibold text-gray-800">{value ?? 'N/A'}</div>
        </div>
    </div>
);

const SystemMetricsCard = ({ os, processMemory }: { os?: OsInfo, processMemory?: ProcessMemory }) => {
    if (!os && !processMemory) {
        return null;
    }

    return (
        <div className="px-4 pb-4">
             <details className="group">
                <summary className="list-none flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-600 hover:text-gray-900">
                    <span>System Metrics</span>
                    <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                    {os && (
                        <>
                            <SystemMetric icon={<Cpu size={16} />} label="CPUs" value={os.cpuCount} />
                            <SystemMetric icon={<Activity size={16} />} label="Load (1m)" value={os.loadAverage?.[0]?.toFixed(2)} />
                            <SystemMetric icon={<MemoryStick size={16} />} label="Total Memory" value={os.totalMemory} />
                            <SystemMetric icon={<MemoryStick size={16} />} label="Free Memory" value={os.freeMemory} />
                        </>
                    )}
                    {processMemory && (
                        <>
                           <SystemMetric icon={<Warehouse size={16} />} label="RSS" value={processMemory.rss.split(' ')[0]} />
                           <SystemMetric icon={<Warehouse size={16} />} label="Heap Used" value={processMemory.heapUsed.split(' ')[0]} />
                        </>
                    )}
                </div>
            </details>
        </div>
    );
};


// =================================================================================
// --- Service-Specific Cards ---
// =================================================================================

const MatchmakingServiceCard = ({ status }: { status: MatchmakingStatus }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className='flex items-center gap-3'>
                <Server className="text-gray-500" />
                <h3 className="font-bold text-lg text-gray-800">{status.serviceInfo.serviceName}</h3>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-mono">{status.serviceInfo.version}</span>
            </div>
            <StatusIndicator status={status.serviceState} />
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard icon={<Users size={20} className="text-green-700" />} title="Users in Queue" value={status.metrics.usersInQueue} />
            <StatCard icon={<MessageSquare size={20} className="text-green-700" />} title="Active Sessions" value={status.metrics.activeSessions} />
            <StatCard icon={<Database size={20} className="text-green-700" />} title="Redis Commands" value={status.redis.commands} />
            <StatCard icon={<Database size={20} className="text-green-700" />} title="Redis Subscriber" value={status.redis.subscriber} />
        </div>
        <div className="flex-grow"></div>
        <SystemMetricsCard os={status.os} processMemory={status.processMemory} />
        <div className="p-2 bg-gray-50 border-t text-right text-xs text-gray-400">
            Last updated: {new Date(status.timestamp).toLocaleTimeString()}
        </div>
    </div>
);

const ChatServiceCard = ({ status }: { status: ChatServerStatus }) => (
     <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <div className='flex items-center gap-3'>
                <Server className="text-gray-500" />
                <h3 className="font-bold text-lg text-gray-800">{status.serviceInfo.serviceName}</h3>
                 <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-mono">{status.serviceInfo.version}</span>
            </div>
            <StatusIndicator status={status.serviceState} />
        </div>
        <div className="p-4">
             <StatCard icon={<Warehouse size={20} className="text-green-700" />} title="Total Rooms" value={status.totalRooms} />
             {status.totalRooms > 0 && (
                 <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-gray-700">Active Rooms</h4>
                    <div className="max-h-40 overflow-y-auto rounded-md border">
                         <table className="w-full text-sm text-left">
                             <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-2 font-semibold">Chat ID</th>
                                    <th className="p-2 font-semibold">Participants</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {status.rooms.map(room => (
                                    <tr key={room.chatId}>
                                        <td className="p-2 font-mono text-xs truncate" title={room.chatId}>{room.chatId.substring(0, 12)}...</td>
                                        <td className="p-2">{room.participants}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
        <div className="flex-grow"></div>
        <SystemMetricsCard os={status.os} processMemory={status.processMemory} />
    </div>
);

const ErrorCard = ({ error }: { error: ServiceStatus & { type: 'error' } }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
        <ServerCrash className="text-red-500 h-8 w-8" />
        <div>
            <h3 className="font-bold text-red-800">{error.serviceInfo.serviceName || 'Unknown Service'}</h3>
            <p className="text-sm text-red-700">{error.message}</p>
            <p className="text-xs text-red-600 font-mono">{error.serviceInfo.url}</p>
        </div>
    </div>
);

// =================================================================================
// --- Main Status Page Component ---
// =================================================================================

export default function StatusPage() {
    const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const DISCOVERY_SERVER_URL = 'https://animochat-service-discovery.onrender.com/services';

    const fetchStatuses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch the list of services from the discovery server
            const discoveryResponse = await fetch(DISCOVERY_SERVER_URL);
            if (!discoveryResponse.ok) {
                throw new Error(`Failed to fetch from discovery server. Status: ${discoveryResponse.status}`);
            }
            const services: ServiceDiscoveryResponse = await discoveryResponse.json();

            // 2. Flatten the list of all service instances from the nested structure
            const allInstances = Object.values(services)
                .map(versionObject => Object.values(versionObject))
                .flat(2);

            if (allInstances.length === 0) {
                 setStatuses([]);
                 setLastUpdated(new Date());
                 setIsLoading(false);
                 return;
            }

            // 3. Fetch the status for each service instance concurrently
            const statusPromises = allInstances.map(async (instance) => {
                try {
                    const statusResponse = await fetch(`${instance.url}/status`);
                    if (!statusResponse.ok) {
                        throw new Error(`Request failed with status ${statusResponse.status}`);
                    }
                    const data = await statusResponse.json();
                    
                    // Determine the service type based on the response structure
                    if (data.metrics && data.metrics.usersInQueue !== undefined) {
                        return { type: 'matchmaking' as const, data: data as MatchmakingStatus };
                    } else if (data.totalRooms !== undefined) {
                        return { 
                            type: 'chat' as const, 
                            data: { 
                                ...data,
                                serviceInfo: { serviceName: instance.serviceName, version: instance.version },
                                serviceState: instance.status 
                            } as ChatServerStatus 
                        };
                    } else {
                        throw new Error("Unknown status response format");
                    }
                } catch (e: any) {
                    return { type: 'error' as const, message: e.message || 'Failed to fetch status', serviceInfo: instance };
                }
            });

            const results = await Promise.all(statusPromises);
            setStatuses(results);
            setLastUpdated(new Date());

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch and set up auto-refresh interval
    useEffect(() => {
        fetchStatuses();
        const interval = setInterval(fetchStatuses, 15000); // Refresh every 15 seconds
        return () => clearInterval(interval);
    }, [fetchStatuses]);

    return (
        <div className="bg-gray-50 min-h-screen text-gray-800">
            <div className="container mx-auto px-4 py-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-green-700">Service Status</h1>
                        <p className="text-gray-500 mt-1">
                            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading status...'}
                        </p>
                    </div>
                    <button
                        onClick={fetchStatuses}
                        disabled={isLoading}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Refresh Status"
                    >
                        <RefreshCw className={`h-6 w-6 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </header>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 flex items-center gap-3">
                        <AlertTriangle />
                        <div>
                            <p className="font-bold">Discovery Error</p>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {statuses.map((status, index) => {
                        switch (status.type) {
                            case 'matchmaking':
                                return <MatchmakingServiceCard key={`${status.data.serviceInfo.serviceName}-${index}`} status={status.data} />;
                            case 'chat':
                                return <ChatServiceCard key={`${status.data.serviceInfo.serviceName}-${index}`} status={status.data} />;
                            case 'error':
                                return <ErrorCard key={`${status.serviceInfo.serviceName}-${index}`} error={status} />;
                            default:
                                return null;
                        }
                    })}
                </div>
                 { !isLoading && statuses.length === 0 && !error && (
                    <div className="text-center py-16 text-gray-500">
                        <Server className="mx-auto h-12 w-12 mb-4" />
                        <h2 className="text-xl font-semibold">No services found</h2>
                        <p>The discovery server did not return any active services.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

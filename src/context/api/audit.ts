import api from './axios';

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    module: string;
    details: string;
    severity: 'info' | 'warning' | 'critical';
    ipAddress: string;
    userAgent: string;
}

export interface AuditLogsResponse {
    data: AuditLog[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage: number;
    };
}

const auditApi = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        severity?: string;
        module?: string;
        searchTerm?: string;
    }): Promise<AuditLogsResponse> => {
        const response = await api.get('/system/audit/logs', { params });
        return response.data;
    },
};

export default auditApi;

import api from './axios';

export enum RequestType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    ACTIVATION = 'ACTIVATION',
    DEACTIVATION = 'DEACTIVATION',
}

export enum RequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    IN_ACCOUNTING = 'IN_ACCOUNTING',
    IN_LITIGATION = 'IN_LITIGATION',
    IN_FINANCE = 'IN_FINANCE',
    AUDITED = 'AUDITED',
}

export interface Request {
    id: string;
    type: RequestType;
    status: RequestStatus;
    amount?: number;
    description?: string;
    receiptUrl?: string;
    reviewerNotes?: string;
    headquarterId: string;
    headquarter?: { id: string; name: string };
    requesterId: string;
    requester?: { id: string; fullName: string; userCode?: string };
    user?: { id: string; fullName: string; userCode?: string }; // Alias for UI
    reviewerId?: string;
    reviewer?: { id: string; fullName: string };
    enterpriseId: string;
    enterprise?: { id: string; name: string };
    createdAt: string;
    updatedAt: string;
}

const requestApi = {
    getAll: async (params?: { headquarterId?: string; status?: RequestStatus; type?: RequestType; enterpriseId?: string; page?: number; limit?: number }): Promise<{ data: Request[]; meta: any }> => {
        const response = await api.get('/request', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Request> => {
        const response = await api.get(`/request/${id}`);
        return response.data;
    },

    create: async (data: { type: RequestType; amount?: number; description?: string; headquarterId: string; enterpriseId: string }): Promise<Request> => {
        const response = await api.post('/request', data);
        return response.data;
    },

    createWithReceipt: async (formData: FormData): Promise<Request> => {
        const response = await api.post('/request', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    approve: async (id: string, data?: { reviewerNotes?: string }): Promise<Request> => {
        const response = await api.patch(`/request/${id}/approve`, data);
        return response.data;
    },

    reject: async (id: string, data: { reviewerNotes: string }): Promise<Request> => {
        const response = await api.patch(`/request/${id}/reject`, data);
        return response.data;
    },

    cancel: async (id: string): Promise<void> => {
        await api.delete(`/request/${id}/cancel`);
    },

    accounting: async (id: string): Promise<Request> => {
        const response = await api.patch(`/request/${id}/accounting`);
        return response.data;
    },

    complete: async (id: string, data?: { reviewerNotes?: string }): Promise<Request> => {
        const response = await api.patch(`/request/${id}/complete`, data);
        return response.data;
    },

    litigate: async (id: string, data?: { reviewerNotes?: string }): Promise<Request> => {
        const response = await api.patch(`/request/${id}/litigate`, data);
        return response.data;
    },
    finance: async (id: string, data?: { reviewerNotes?: string }): Promise<Request> => {
        const response = await api.patch(`/request/${id}/finance`, data);
        return response.data;
    },
    audit: async (id: string, data?: { reviewerNotes?: string }): Promise<Request> => {
        const response = await api.patch(`/request/${id}/audit`, data);
        return response.data;
    },
};

export default requestApi;

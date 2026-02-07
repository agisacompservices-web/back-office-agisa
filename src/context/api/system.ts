import api from "./axios";

const systemApi = {
    getSettings: async () => {
        const response = await api.get('/system/settings');
        return response.data;
    },
    updateSettings: async (settings: Record<string, any>) => {
        const response = await api.patch('/system/settings', settings);
        return response.data;
    },
    getPublicSettings: async () => {
        const response = await api.get('/system/public');
        return response.data;
    },
    sendBroadcast: async (message: string, subject?: string, scheduledAt?: string, targetRoles?: string[], targetEnterpriseIds?: string[], targetUserIds?: string[]) => {
        const response = await api.post('/system/broadcast', { message, subject, scheduledAt, targetRoles, targetEnterpriseIds, targetUserIds });
        return response.data;
    }
};

export default systemApi;

import api from './axios';

export interface Permission {
    id: string;
    key: string;
    module: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

const permissionsApi = {
    /**
     * Récupérer toutes les permissions
     */
    getAll: async (params?: { page?: number; limit?: number; module?: string }): Promise<{ data: Permission[]; meta: any }> => {
        const response = await api.get('/permissions/all-permissions', { params });
        return response.data;
    },

    /**
     * Récupérer une permission par son ID
     */
    getById: async (id: string): Promise<Permission> => {
        const response = await api.get(`/permissions/get-permission/${id}`);
        return response.data;
    },

    /**
     * Créer une nouvelle permission
     */
    create: async (data: { key: string; module: string; description?: string }): Promise<Permission> => {
        const response = await api.post('/permissions/add-permission', data);
        return response.data;
    },
};

export default permissionsApi;

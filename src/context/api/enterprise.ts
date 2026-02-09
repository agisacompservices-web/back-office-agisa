import api from './axios';

export interface Enterprise {
    id: string;
    name: string;
    enterpriseCode?: string;
    isActive?: boolean;
    description?: string;
    memberships?: any[];
    category?: { id: string; name: string };
    isMaintenance?: boolean;
    createdAt: string;
    updatedAt: string;
}

const enterpriseApi = {
    /**
     * Récupérer toutes les entreprises
     */
    getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<{ data: Enterprise[]; meta: any }> => {
        const response = await api.get('/enterprise', { params });
        return response.data;
    },

    /**
     * Créer une entreprise
     */
    create: async (data: { name: string; enterpriseCode?: string; description?: string; categoryId: string }): Promise<Enterprise> => {
        const response = await api.post('/enterprise', data);
        return response.data;
    },

    /**
     * Mettre à jour des catégories
     */
    getCategories: async (): Promise<{ id: string; name: string }[]> => {
        const response = await api.get('/enterprise/categories');
        return response.data;
    },

    /**
     * Créer une catégorie
     */
    createCategory: async (name: string): Promise<{ id: string; name: string }> => {
        const response = await api.post('/enterprise/categories', { name });
        return response.data;
    },

    /**
     * Mettre à jour une entreprise
     */
    update: async (id: string, data: { name?: string; description?: string; categoryId?: string; isActive?: boolean; isMaintenance?: boolean }): Promise<Enterprise> => {
        const response = await api.patch(`/enterprise/${id}`, data);
        return response.data;
    },
};

export default enterpriseApi;

import api from './axios';

export interface Headquarter {
    id: string;
    name: string;
    type: 'SILVER' | 'GOLD' | 'DIAMOND' | 'BLACK_DIAMOND';
    isActive: boolean;
    enterpriseId: string;
    enterprise?: { id: string; name: string };
    config?: any;
    commission?: number;
    managerId?: string;
    manager?: { id: string; fullName: string };
    startedBalance?: number;
    balance?: number;
    createdAt: string;
    updatedAt: string;
}

const headquartersApi = {
    /**
     * Récupérer tous les headquarters
     */
    getAll: async (params?: { page?: number; limit?: number; search?: string; enterpriseId?: string }): Promise<{ data: Headquarter[]; meta: any }> => {
        const response = await api.get('/headquarters', { params });
        return response.data;
    },

    /**
     * Récupérer un headquarter par ID
     */
    getById: async (id: string): Promise<Headquarter> => {
        const response = await api.get(`/headquarters/${id}`);
        return response.data;
    },

    /**
     * Créer un headquarter
     */
    create: async (data: { name: string; type?: string; enterpriseId: string; config?: any; commission?: number; managerId?: string; startedBalance?: number; balance?: number }): Promise<Headquarter> => {
        const response = await api.post('/headquarters', data);
        return response.data;
    },

    /**
     * Mettre à jour un headquarter
     */
    update: async (id: string, data: { name?: string; type?: string; isActive?: boolean; config?: any; commission?: number; managerId?: string; startedBalance?: number; balance?: number }): Promise<Headquarter> => {
        const response = await api.patch(`/headquarters/${id}`, data);
        return response.data;
    },

    /**
     * Supprimer un headquarter
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/headquarters/${id}`);
    },
};

export default headquartersApi;

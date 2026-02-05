import api from './axios';
import { Enterprise } from './enterprise';

export interface Role {
    id: string;
    name: string;
    level: string;
    isSystem: boolean;
    description?: string;
    enterprise?: Enterprise;
    permissions?: any[];
    createdAt: string;
    updatedAt: string;
}

const rolesApi = {
    /**
     * Récupérer tous les rôles (pour peupler les listes déroulantes)
     */
    getAll: async (): Promise<Role[]> => {
        const response = await api.get('/roles/all-roles');
        return response.data;
    },

    /**
     * Créer un nouveau rôle
     */
    create: async (data: {
        name: string;
        enterpriseId?: string;
        level: string;
        description?: string;
        isSystem?: boolean;
    }): Promise<Role> => {
        const response = await api.post('/roles/add-role', data);
        return response.data;
    },

    /**
     * Récupérer un rôle par son ID
     */
    /**
     * Mettre à jour un rôle
     */
    update: async (id: string, data: Partial<Role> & { enterpriseId?: string | null }): Promise<Role> => {
        const response = await api.patch(`/roles/${id}`, data);
        return response.data;
    },

    getById: async (id: string): Promise<Role> => {
        const response = await api.get(`/roles/${id}`);
        return response.data;
    },
};

export default rolesApi;

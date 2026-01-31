import api from './axios';

export interface Role {
    id: string;
    name: string;
    isSystem: boolean;
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
    create: async (data: { name: string; isSystem?: boolean }): Promise<Role> => {
        const response = await api.post('/roles/add-role', data);
        return response.data;
    },

    /**
     * Récupérer un rôle par son ID
     */
    getById: async (id: string): Promise<Role> => {
        const response = await api.get(`/roles/${id}`);
        return response.data;
    },
};

export default rolesApi;

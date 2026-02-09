import api from './axios';

export interface Membership {
    id: string;
    userId: string;
    enterpriseId: string;
    status: string;
    membershipRoles?: any[];
}

const membershipApi = {
    create: async (data: { userId: string; roleIds: string[]; enterpriseId?: string }) => {
        const response = await api.post('/membership', data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/membership/${id}`);
    },

    getByEnterprise: async (enterpriseId: string): Promise<any[]> => {
        const response = await api.get('/membership', {
            params: { enterpriseId }
        });
        return response.data;
    }
};

export default membershipApi;

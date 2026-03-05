import api from './axios';

export enum PlanTarget {
    SELLER = 'SELLER',
    HQ = 'HQ',
}

export interface Plan {
    id: string;
    name: string;
    target: PlanTarget;
    startingBalance: number;
    level: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePlanDto {
    name: string;
    target: PlanTarget;
    startingBalance: number;
    level?: number;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> { }

export const plansApi = {
    getAll: async (target?: PlanTarget): Promise<Plan[]> => {
        const url = target ? `/plans?target=${target}` : `/plans`;
        const response = await api.get(url, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    },

    getById: async (id: string): Promise<Plan> => {
        const response = await api.get(`/plans/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    },

    create: async (data: CreatePlanDto): Promise<Plan> => {
        const response = await api.post(`/plans`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    },

    update: async (id: string, data: UpdatePlanDto): Promise<Plan> => {
        const response = await api.patch(`/plans/${id}`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/plans/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },
};

export default plansApi;

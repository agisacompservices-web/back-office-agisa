import api from './axios';
import { Enterprise } from './enterprise';

export type SellerType = string;

export interface Address {
    adresseLigne1: string;
    departement: string;
    commune: string;
    sectionCommunale?: string;
}

export interface Seller {
    id: string;
    name: string;
    code?: string;
    type: SellerType;
    isActive: boolean;
    enterpriseId: string;
    commission: number;
    sellerId: string | null;
    startedBalance: number;
    balance: number;
    withdrawalBalance: number;
    adresse: Address;
    enterprise?: Enterprise;
    createdAt: string;
    updatedAt: string;
    seller?: {
        id: string;
        fullName: string;
        email: string;
        twoFactorEnabled: boolean;
    };
}

export interface CreateSellerRequest {
    name: string;
    type?: SellerType;
    enterpriseId: string;
    commission?: number;
    sellerId?: string | null;
    startedBalance?: number;
    balance?: number;
    adresse: {
        adresseLigne1: string;
        departement: string;
        commune: string;
        sectionCommunale: string;
    };
}

export interface UpdateSellerRequest extends Partial<Omit<CreateSellerRequest, 'enterpriseId'>> {
    isActive?: boolean;
}

const sellerApi = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        enterpriseId?: string;
        sellerId?: string;
    }) => {
        const response = await api.get('/seller', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Seller> => {
        const response = await api.get(`/seller/${id}`);
        return response.data;
    },

    create: async (data: CreateSellerRequest): Promise<Seller> => {
        const response = await api.post('/seller', data);
        return response.data;
    },

    update: async (id: string, data: UpdateSellerRequest): Promise<Seller> => {
        const response = await api.patch(`/seller/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/seller/${id}`);
    },

    register: async (formData: FormData): Promise<any> => {
        const response = await api.post('/seller/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};

export default sellerApi;

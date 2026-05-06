import api from './axios';

export enum SettingKey {
    MAINTENANCE_MODE = 'MAINTENANCE_MODE',
    SELLER_DEPOSIT_COMMISSION_RATE = 'SELLER_DEPOSIT_COMMISSION_RATE',
    HQ_DEPOSIT_COMMISSION_RATE = 'HQ_DEPOSIT_COMMISSION_RATE',
    SELLER_WITHDRAWAL_COMMISSION_RATE = 'SELLER_WITHDRAWAL_COMMISSION_RATE',
    HQ_WITHDRAWAL_COMMISSION_RATE = 'HQ_WITHDRAWAL_COMMISSION_RATE',
    ENTERPRISE_WITHDRAWAL_COMMISSION_RATE = 'ENTERPRISE_WITHDRAWAL_COMMISSION_RATE',
    // Felcash (Fintech) integration
    SELLER_FINTECH_DEPOSIT_RATE = 'SELLER_FINTECH_DEPOSIT_RATE',
    SELLER_FINTECH_WITHDRAWAL_COMMISSION_RATE = 'SELLER_FINTECH_WITHDRAWAL_COMMISSION_RATE',
}

export interface Setting {
    id: string;
    key: SettingKey;
    value: string;
    label: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

const commissionApi = {
    /**
     * Get a setting by its key
     */
    getByKey: async (key: SettingKey): Promise<Setting> => {
        const response = await api.get(`/settings/key/${key}`);
        return response.data;
    },

    /**
     * Update a setting by its key
     */
    updateByKey: async (key: SettingKey, data: { value: string; label?: string; description?: string }): Promise<Setting> => {
        const response = await api.patch(`/settings/key/${key}`, data);
        return response.data;
    },

    /**
     * Get all settings (paginated)
     */
    getAll: async (params?: { page?: number; limit?: number }): Promise<{ data: Setting[]; meta: any }> => {
        const response = await api.get('/settings/all-settings', { params });
        return response.data;
    }
}

export default commissionApi;
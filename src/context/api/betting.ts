import api from './axios';

export interface ExternalDepositRequest {
    playerId: string;
    amount: number;
    enterpriseId: string;
    description?: string;
}

const bettingApi = {
    /**
     * Send a manual deposit to the external betting system
     */
    deposit: async (data: ExternalDepositRequest) => {
        const response = await api.post('/integrations/betting/deposit', data);
        return response.data;
    },

    /**
     * Confirm a player-initiated withdrawal request
     */
    confirmWithdrawal: async (transactionId: string) => {
        const response = await api.post(`/integrations/betting/withdrawal/${transactionId}/confirm`);
        return response.data;
    },

    /**
     * Look up a player account by phone number in the external system
     */
    getPlayerByPhone: async (phone: string, enterpriseId: string) => {
        const response = await api.post(`/integrations/betting/player/${phone}`, {}, {
            headers: { 'x-enterprise-id': enterpriseId }
        });
        return response.data;
    }
};

export default bettingApi;

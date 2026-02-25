import api from './axios';

export interface ExternalDepositRequest {
    playerId: string;
    amount: number;
    enterpriseId: string;
    description?: string;
}

export interface BettingReportingQuery {
    startDate?: string;
    endDate?: string;
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
    },

    /**
     * Reporting methods
     */
    getOngoingBetsTotal: async (query?: BettingReportingQuery) => {
        const response = await api.get('/integrations/betting/reporting/ongoing-bets', { params: query });
        return response.data;
    },

    getLosingBetsTotal: async (query?: BettingReportingQuery) => {
        const response = await api.get('/integrations/betting/reporting/losing-bets', { params: query });
        return response.data;
    },

    getWinningBetsTotal: async (query?: BettingReportingQuery) => {
        const response = await api.get('/integrations/betting/reporting/winning-bets', { params: query });
        return response.data;
    },

    getWinningStakesSum: async (query?: BettingReportingQuery) => {
        const response = await api.get('/integrations/betting/reporting/total-apayer', { params: query });
        return response.data;
    },

    getStakesSum: async (query?: BettingReportingQuery) => {
        const response = await api.get('/integrations/betting/reporting/total-money', { params: query });
        return response.data;
    },

    getTotalDeposits: async (query?: BettingReportingQuery) => {
        const response = await api.get('/integrations/betting/reporting/total-depot', { params: query });
        return response.data;
    },

    getTotalWithdrawals: async (query?: BettingReportingQuery) => {
        const response = await api.get('/integrations/betting/reporting/total-retrait', { params: query });
        return response.data;
    },

    getTotalUsers: async (query?: BettingReportingQuery) => {
        const response = await api.get('/integrations/betting/reporting/total-users', { params: query });
        return response.data;
    }
};

export default bettingApi;

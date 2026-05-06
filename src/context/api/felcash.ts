import api from './axios';

export interface FelcashReportingQuery {
    startDate?: string;
    endDate?: string;
}

export interface FelcashDepositRequest {
    accountNumber: string;
    amount: number;
    currency: 'HTG' | 'USD';
    enterpriseId: string;
    description?: string;
}

const felcashApi = {
    lookupAccount: async (accountNumber: string) => {
        const response = await api.get(`/integrations/fintech/account/${accountNumber}`);
        return response.data;
    },

    initiateDeposit: async (data: FelcashDepositRequest) => {
        const response = await api.post('/integrations/fintech/deposit', data);
        return response.data;
    },

    getExchangeRate: async () => {
        const response = await api.get('/integrations/fintech/exchange-rate');
        return response.data;
    },
 
    updateExchangeRate: async (data: { vente: number; achat: number; reference: number }) => {
        const response = await api.patch('/integrations/fintech/exchange-rate', data);
        return response.data;
    },

    getUsers: async (page?: number, limit?: number, search?: string) => {
        const response = await api.get('/integrations/fintech/users', {
            params: { page, limit, search }
        });
        return response.data;
    },

    getUserAccounts: async (userId: string) => {
        const response = await api.get(`/integrations/fintech/users/${userId}/accounts`);
        return response.data;
    },

    getUserTransactions: async (userId: string, page?: number, limit?: number, accountId?: string) => {
        const response = await api.get(`/integrations/fintech/users/${userId}/transactions`, {
            params: { page, limit, accountId }
        });
        return response.data;
    },

    getTotalDeposits: async (query?: FelcashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-deposit', { params: query });
        return response.data;
    },

    getTotalWithdrawals: async (query?: FelcashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-withdrawal', { params: query });
        return response.data;
    },

    getTotalUsers: async (query?: FelcashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-users', { params: query });
        return response.data;
    },

    getTotalMoney: async (query?: FelcashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-money', { params: query });
        return response.data;
    },
    
    getTotalProfits: async (query?: FelcashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-profits', { params: query });
        return response.data;
    },

    getProfitDetails: async (query?: FelcashReportingQuery & { page?: number; limit?: number }) => {
        const response = await api.get('/integrations/fintech/reporting/profit-details', { params: query });
        return response.data;
    },
};

export default felcashApi;

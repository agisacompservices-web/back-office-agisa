import api from './axios';

export interface ZoneCashReportingQuery {
    startDate?: string;
    endDate?: string;
}

export interface ZoneCashDepositRequest {
    accountNumber: string;
    amount: number;
    currency: 'HTG' | 'USD';
    enterpriseId: string;
    description?: string;
    isRemote?: boolean;
    otpCode?: string;
}

const zonecashApi = {
    requestDepositOtp: async (data: { accountNumber: string, amount: number, currency: string, sellerCode?: string }) => {
        const response = await api.post('/integrations/fintech/deposit/request-otp', data);
        return response.data;
    },
    cancelDepositOtp: async (data: { accountNumber: string, amount: number, sellerCode?: string }) => {
        const response = await api.post('/integrations/fintech/deposit/cancel', data);
        return response.data;
    },
    lookupAccount: async (accountNumber: string) => {
        const response = await api.get(`/integrations/fintech/account/${accountNumber}`);
        return response.data;
    },

    initiateDeposit: async (data: ZoneCashDepositRequest) => {
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

    getTotalDeposits: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-deposit', { params: query });
        return response.data;
    },

    getTotalWithdrawals: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-withdrawal', { params: query });
        return response.data;
    },

    getTotalUsers: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-users', { params: query });
        return response.data;
    },

    getTotalMoney: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-money', { params: query });
        return response.data;
    },
    
    getTotalProfits: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-profits', { params: query });
        return response.data;
    },

    getProfitDetails: async (query?: ZoneCashReportingQuery & { page?: number; limit?: number }) => {
        const response = await api.get('/integrations/fintech/reporting/profit-details', { params: query });
        return response.data;
    },
};

export default zonecashApi;

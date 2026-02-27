import api from './axios';

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    enterpriseCode?: string;
    deviceId?: string;
}

export interface ServiceSelectionRequiredResponse {
    serviceSelectionRequired: boolean;
    userId: string;
    services: {
        id: string;
        name: string;
        enterpriseCode: string;
        isMaintenance: boolean;
        isActive: boolean;
        canBypass: boolean;
    }[];
}

const authApi = {
    /**
     * Connect a user
     */
    login: async (email: string, password: string, deviceId?: string): Promise<LoginResponse | { twoFactorRequired: boolean; userId: string } | ServiceSelectionRequiredResponse> => {
        const response = await api.post('/auth/login', { email, password, deviceId });
        return response.data;
    },

    /**
     * Finalize login by selecting a service
     */
    selectService: async (userId: string, enterpriseId: string): Promise<LoginResponse> => {
        const response = await api.post('/auth/login/select-service', { userId, enterpriseId });
        return response.data;
    },

    /**
     * Finalize login with 2FA code
     */
    twoFactorLogin: async (userId: string, twoFactorCode: string, trustDevice?: boolean, deviceId?: string): Promise<LoginResponse | ServiceSelectionRequiredResponse> => {
        const response = await api.post('/auth/2fa/login', { userId, twoFactorCode, trustDevice, deviceId });
        return response.data;
    },

    /**
     * Refresh the token
     */
    refresh: async (refreshToken: string): Promise<{ access_token: string; refresh_token: string }> => {
        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        return response.data;
    },

    /**
     * End the session (Client-side logout)
     */
    logout: () => {
        localStorage.removeItem('agisa_token');
        localStorage.removeItem('agisa_refresh_token');
        localStorage.removeItem('agisa_user');
        localStorage.removeItem('agisa_current_service');
        window.location.href = '/';
    },

    /**
     * Generate a QR code for 2FA configuration
     */
    setup2FA: async (): Promise<{ qrCodeDataUrl: string; backupCodes: string[] }> => {
        const response = await api.get('/auth/2fa/setup');
        return response.data;
    },

    /**
     * Enable 2FA for a user
     */
    enable2FA: async (twoFactorCode: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/2fa/enable', { twoFactorCode });
        return response.data;
    },

    /**
     * Disable 2FA for a user
     */
    disable2FA: async (): Promise<{ message: string }> => {
        const response = await api.post('/auth/2fa/disable');
        return response.data;
    },

    /**
     * Send a password reset email
     */
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    /**
     * Reset password with a token
     */
    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/reset-password', { token, newPassword });
        return response.data;
    },

    /**
     * Verify email address
     */
    verifyEmail: async (token: string): Promise<{ message: string }> => {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        return response.data;
    },
};

export default authApi;

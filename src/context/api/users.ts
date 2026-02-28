import api from './axios';

/**
 * User data interfaces
 */
export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    userCode: string;
    bio?: string;
    role: {
        id: string;
        name: string;
        level: string;
    };
    roleId?: string;
    isActive: boolean;
    isVerified: boolean;
    loginAttempts: number;
    lockoutUntil?: string | null;
    createdAt: string;
    updatedAt: string;
    memberships?: {
        membershipRoles: {
            role: { id: string; name: string; level: string };
        }[];
        enterprise: {
            id: string;
            name: string;
            enterpriseCode: string;
            isActive: boolean;
            isMaintenance: boolean;
            createdAt: string;
            updatedAt: string;
        };
        headquarter?: {
            id: string;
            name: string;
            address?: string;
        };
        sellerId?: string;
        seller?: any;
    }[];
}

export interface TrustedDevice {
    id: string;
    userAgent: string;
    ipAddress: string;
    location?: string;
    lastUsedAt: string;
    expiresAt: string;
}

export interface CreateUserRequest {
    fullName: string;
    email: string;
    role?: string;
    roleId?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    headquarterId?: string;
}

export interface UpdateProfileRequest {
    fullName?: string;
    phone?: string;
    bio?: string;
    avatar?: File;
}

export interface UpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

/**
 * API Service for user management
 */
const usersApi = {
    /**
     * Get the profile of the connected user
     */
    getMe: async (): Promise<UserProfile> => {
        const response = await api.get('/users/me');
        return response.data;
    },

    /**
     * Update the profile of the connected user (supports multipart for avatar)
     */
    updateMe: async (data: UpdateProfileRequest): Promise<UserProfile> => {
        const formData = new FormData();
        if (data.fullName) formData.append('fullName', data.fullName);
        if (data.phone) formData.append('phone', data.phone);
        if (data.bio) formData.append('bio', data.bio);
        if (data.avatar) formData.append('avatar', data.avatar);

        const response = await api.patch('/users/me', formData);
        return response.data;
    },

    /**
     * Create a new user (Admin only)
     */
    addUser: async (userData: CreateUserRequest): Promise<UserProfile> => {
        const response = await api.post('/users/add-user', userData);
        return response.data;
    },

    /**
     * Get all users (Admin only)
     */
    getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<{ data: UserProfile[]; total: number; meta?: any }> => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    /**
     * Get a specific user (Admin only)
     */
    getById: async (id: string): Promise<UserProfile> => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    /**
     * Delete a user (Admin only)
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    /**
     * Unlock an account (Admin only)
     */
    unlock: async (id: string): Promise<{ message: string }> => {
        const response = await api.post(`/users/${id}/unlock`);
        return response.data;
    },

    /**
     * Get trusted devices for the connected user
     */
    getTrustedDevices: async (): Promise<TrustedDevice[]> => {
        const response = await api.get('/users/me/trusted-devices');
        return response.data;
    },

    /**
     * Delete a specific trusted device
     */
    removeTrustedDevice: async (deviceId: string): Promise<TrustedDevice[]> => {
        const response = await api.delete(`/users/me/trusted-devices/${deviceId}`);
        return response.data;
    },

    /**
     * Delete all trusted devices
     */
    clearTrustedDevices: async (): Promise<void> => {
        await api.delete('/users/me/trusted-devices');
    },

    /**
     * Update the password of the connected user
     */
    updateMyPassword: async (data: UpdatePasswordRequest): Promise<{ message: string }> => {
        const response = await api.patch('/users/me/password', data);
        return response.data;
    },

    /**
     * Update a user (Admin only)
     */
    update: async (id: string, data: Partial<UserProfile>): Promise<UserProfile> => {
        const response = await api.patch(`/users/${id}`, data);
        return response.data;
    },
};

export default usersApi;


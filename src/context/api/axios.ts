import axios from 'axios';

/**
 * Token Refresh Handling
 * Prevents multiple simultaneous calls to /refresh-token in case of multiple expirations.
 */
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string | null) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const api = axios.create({
    // Utilise la variable d'environnement si disponible (Create React App utilise REACT_APP_)
    baseURL: 'http://localhost:3000',
    // process.env.REACT_APP_API_URL,
    // baseURL: 'https://back-office-agisa-backend-dev.up.railway.app',
    timeout: 15000, // 15 seconds before timeout
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // To avoid ngrok warning screen in dev
    },
});

/**
 * Request Interceptor: Automatically adds the JWT token
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('agisa_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // If sending FormData (e.g., file upload),
        // we let the browser define the Content-Type with the boundary.
        if (config.data instanceof FormData) {
            if (config.headers.set) {
                config.headers.set('Content-Type', undefined);
            } else {
                delete config.headers['Content-Type'];
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Handles global errors and token refreshing
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        /**
         * Case 1: Network Problem (Server unreachable)
         */
        if (!error.response) {
            console.error('Network/Server Error:', error);
            const { toast } = await import('sonner');
            toast.error("Connection Error", {
                description: "Check your internet connection or server status."
            });
            return Promise.reject(error);
        }

        /**
         * Case 2: 401 Error (Unauthorized / Token expired)
         */
        if (error.response.status === 401 && !originalRequest._retry) {
            // Do not attempt refresh if the error already comes from an auth endpoint
            const isAuthRequest = originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/2fa/login') ||
                originalRequest.url?.includes('/auth/refresh');

            if (isAuthRequest) {
                return Promise.reject(error);
            }

            // If we are already refreshing the token, we put the request in wait queue
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('agisa_refresh_token');
                if (!refreshToken) throw new Error('No refresh token available');

                // We use a clean axios instance for refresh to avoid infinite loops
                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                const { access_token, refresh_token: newRefreshToken } = response.data;

                // Storage update
                localStorage.setItem('agisa_token', access_token);
                if (newRefreshToken) {
                    localStorage.setItem('agisa_refresh_token', newRefreshToken);
                }

                // Optional: Update global instance
                api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                processQueue(null, access_token);
                return api(originalRequest);

            } catch (authError: any) {
                processQueue(authError, null);

                const publicPaths = ['/', '/login', '/forgot-password', '/reset-password', '/verify-email'];
                const isPublicPath = publicPaths.includes(window.location.pathname);

                const isRevoked = authError.response?.data?.message === 'MEMBERSHIP_REVOKED' ||
                    error.response?.data?.message === 'MEMBERSHIP_REVOKED';

                // SPECIAL: If membership was deleted during session
                if (isRevoked) {
                    localStorage.removeItem('agisa_current_service');
                    if (!isPublicPath) {
                        window.location.href = '/';
                    }
                    return Promise.reject(authError);
                }

                // Full cleanup and redirection if refresh fails (session expired)
                localStorage.removeItem('agisa_token');
                localStorage.removeItem('agisa_refresh_token');
                localStorage.removeItem('agisa_user');
                localStorage.removeItem('agisa_current_service');

                if (!isPublicPath) {
                    window.location.href = '/';
                }
                return Promise.reject(authError);
            } finally {
                isRefreshing = false;
            }
        }

        /**
         * Case 3: Server errors (500+)
         */
        if (error.response.status >= 500) {
            const { toast } = await import('sonner');
            const errorMessage = error.response.data?.message || "An internal error occurred.";

            toast.error("Server Error", {
                description: errorMessage
            });
        }

        return Promise.reject(error);
    }
);

export default api;
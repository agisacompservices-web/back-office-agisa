import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "../../components/ui/input-otp";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import authApi, { LoginResponse } from "../../context/api/auth";
import usersApi from "../../context/api/users";
import ServiceSelectionDialog from "../../components/auth/ServiceSelectionDialog";
import { useService } from "../../context/ServiceContext";

const TwoFactor: React.FC = () => {
    const { setCurrentService } = useService();
    const [otp, setOtp] = useState("");
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [trustDevice, setTrustDevice] = useState(false);
    const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
    const [selectionServices, setSelectionServices] = useState<any[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    // Retrieve userId from navigation state
    const userId = location.state?.userId;

    useEffect(() => {
        if (!userId) {
            toast.error("Session Expire", {
                description: "Please login again."
            });
            navigate("/", { replace: true });
        }
    }, [userId, navigate]);

    const finalizeLogin = useCallback(async (access_token: string, refresh_token: string, enterpriseCode?: string, deviceId?: string) => {
        // Store tokens first (needed for subsequent API calls)
        localStorage.setItem('agisa_token', access_token);
        localStorage.setItem('agisa_refresh_token', refresh_token);

        if (deviceId) {
            localStorage.setItem('agisa_device_id', deviceId);
        }

        // Fetch user profile separately
        try {
            const userProfile = await usersApi.getMe();

            if (!userProfile || !userProfile.role) {
                throw new Error('User information is incomplete.');
            }

            localStorage.setItem('agisa_user', JSON.stringify(userProfile));
            setStatus('success');

            toast.success(`Welcome back, ${userProfile.fullName}`);

            // If a service was selected (or auto-detected for single-service users)
            if (enterpriseCode) {
                const memberships = (userProfile as any).memberships || [];
                const activeMembership = memberships.find((m: any) => m.enterprise?.enterpriseCode === enterpriseCode);

                if (activeMembership) {
                    setCurrentService(activeMembership.enterprise);

                    // Detect effective role for this membership
                    let effectiveRole = userProfile.role?.level?.toUpperCase();
                    if (activeMembership.membershipRoles && activeMembership.membershipRoles.length > 0) {
                        effectiveRole = activeMembership.membershipRoles[0].role?.level?.toUpperCase();
                    }

                    setTimeout(() => {
                        if (effectiveRole === 'MANAGER_HEADQUARTER_LOCAL') {
                            navigate(`/${enterpriseCode}/headquaterlocal`, { replace: true });
                        } else if (effectiveRole === 'SELLER') {
                            if (activeMembership.sellerId) {
                                navigate(`/${enterpriseCode}`, { replace: true });
                            } else {
                                toast.error('Access Denied', {
                                    description: 'You are not assigned to a seller account for this service.',
                                    duration: 6000
                                });
                                localStorage.removeItem('agisa_token');
                                localStorage.removeItem('agisa_refresh_token');
                                localStorage.removeItem('agisa_user');
                                navigate("/", { replace: true });
                            }
                        } else {
                            navigate(`/${enterpriseCode}`, { replace: true });
                        }
                    }, 800);
                    return;
                }
            }

            // Detect global status via role level
            const roleLevel = userProfile.role.level?.toUpperCase();
            const isGlobalRole = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTING', 'LITIGATION'].includes(roleLevel);

            // Redirect to dashboard for global roles
            if (isGlobalRole) {
                setTimeout(() => {
                    navigate("/dashboard", { replace: true });
                }, 800);
                return;
            }

            // For regular users with no specific service redirected yet, check if they have memberships
            const memberships = (userProfile as any).memberships || [];
            if (memberships.length > 0) {
                const firstService = memberships[0].enterprise;

                // Check if this single enterprise is accessible
                // Detect effective role for this membership
                let effRole = roleLevel;
                if (memberships[0].membershipRoles && memberships[0].membershipRoles.length > 0) {
                    effRole = memberships[0].membershipRoles[0].role?.level?.toUpperCase();
                }

                // Accessible if: Active AND Not Maintenance AND (if SELLER, must have sellerId) AND (if Local Manager, must have hqId)
                const isAccessible = firstService?.isActive && !firstService?.isMaintenance &&
                    (effRole !== 'SELLER' || !!memberships[0].sellerId) &&
                    (effRole !== 'MANAGER_HEADQUARTER_LOCAL' || !!memberships[0].headquarterId);

                if (isAccessible) {
                    setCurrentService(firstService);
                    setTimeout(() => {
                        // Specific redirect for Local Manager/Seller
                        if (effRole === 'MANAGER_HEADQUARTER_LOCAL') {
                            navigate(`/${firstService.enterpriseCode}/headquaterlocal`, { replace: true });
                        } else if (effRole === 'SELLER') {
                            navigate(`/${firstService.enterpriseCode}/sellerlocal`, { replace: true });
                        } else {
                            navigate(`/${firstService.enterpriseCode}`, { replace: true });
                        }
                    }, 800);
                } else {
                    // BLOCK ACCESS: Enterprise is inactive, in maintenance, or missing specific assignment
                    let reason = !firstService?.isActive ? 'inactive' : 'under maintenance';

                    if (effRole === 'SELLER' && !memberships[0].sellerId) {
                        reason = 'missing a seller account assignment';
                    } else if (effRole === 'MANAGER_HEADQUARTER_LOCAL' && !memberships[0].headquarterId) {
                        reason = 'missing a headquarter assignment';
                    }

                    toast.error('Service Unavailable', {
                        description: `The enterprise "${firstService?.name}" is currently ${reason}.`,
                        duration: 6000
                    });
                    localStorage.removeItem('agisa_token');
                    localStorage.removeItem('agisa_refresh_token');
                    localStorage.removeItem('agisa_user');
                    localStorage.removeItem('agisa_current_service');
                    setTimeout(() => {
                        navigate("/", { replace: true });
                    }, 800);
                }
            } else {
                // BLOCK ACCESS: No global role AND no memberships
                toast.error('Access Denied', {
                    description: 'You are not assigned to any enterprise. Please contact an administrator.',
                    duration: 6000
                });
                localStorage.removeItem('agisa_token');
                localStorage.removeItem('agisa_refresh_token');
                localStorage.removeItem('agisa_user');
                localStorage.removeItem('agisa_current_service');
                setTimeout(() => {
                    navigate("/", { replace: true });
                }, 800);
            }
        } catch (profileError) {
            console.error('Failed to fetch profile after 2FA:', profileError);
            // Cleanup tokens if profile fetch fails
            localStorage.removeItem('agisa_token');
            localStorage.removeItem('agisa_refresh_token');
            localStorage.removeItem('agisa_user');
            localStorage.removeItem('agisa_current_service');
            throw new Error('Unable to retrieve your profile.');
        }
    }, [navigate, setCurrentService]);

    const handleVerify = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (otp.length !== 6) return;

        setStatus('verifying');
        try {
            const storedDeviceId = localStorage.getItem('agisa_device_id') || undefined;
            const data = await authApi.twoFactorLogin(userId, otp, trustDevice, storedDeviceId);

            // Handle Service Selection if required
            if ('serviceSelectionRequired' in data && data.serviceSelectionRequired) {
                setSelectionServices(data.services);
                setIsSelectionDialogOpen(true);
                return;
            }

            const loginData = data as LoginResponse;
            const { access_token, refresh_token, enterpriseCode, deviceId: returnedDeviceId } = loginData;
            await finalizeLogin(access_token, refresh_token, enterpriseCode, returnedDeviceId);

        } catch (error: any) {
            console.error('2FA error:', error);
            setStatus('error');
            const message = error.response?.data?.message || "Invalid code or expired code.";
            toast.error("Verification error", {
                description: message,
            });

            // Reset after animation
            setTimeout(() => {
                setOtp("");
                setStatus('idle');
            }, 500);
        }
    }, [otp, userId, trustDevice, finalizeLogin]);

    const handleSelectService = useCallback(async (enterpriseId: string) => {
        setStatus('verifying');
        try {
            // Find selected service in list to get enterpriseCode
            const selectedService = selectionServices.find(s => s.id === enterpriseId);
            const enterpriseCode = selectedService?.enterpriseCode;

            const data = await authApi.selectService(userId, enterpriseId);
            const loginData = data as LoginResponse;
            const { access_token, refresh_token, deviceId } = loginData;
            await finalizeLogin(access_token, refresh_token, enterpriseCode, deviceId);
            setIsSelectionDialogOpen(false);
        } catch (error: any) {
            console.error('Service selection error:', error);
            const message = error.response?.data?.message || 'Failed to select service';
            toast.error('This service is currently in maintenance', {
                description: message,
            });
            setStatus('idle');
        }
    }, [userId, finalizeLogin, selectionServices]);

    // Auto-submit when 6 digits are reached
    useEffect(() => {
        if (otp.length === 6 && status === 'idle') {
            handleVerify();
        }
    }, [otp, status, handleVerify]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800 uppercase tracking-widest">2FA Security</CardTitle>
                    <CardDescription className="text-slate-500 font-bold">
                        Please enter the 6-digit code from your authenticator app.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6">
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className={`flex justify-center transition-all duration-300 ${status === 'error' ? 'animate-shake' : ''}`}>
                            <InputOTP
                                maxLength={6}
                                value={otp}
                                onChange={(value) => setOtp(value)}
                                pattern="^[0-9]*$"
                                disabled={status === 'verifying' || status === 'success'}
                                autoFocus
                            >
                                <InputOTPGroup className="gap-2">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <InputOTPSlot
                                            key={index}
                                            index={index}
                                            className={`h-14 w-12 text-xl font-bold bg-slate-50 border-slate-200 transition-all duration-300
                                                ${status === 'success' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}
                                                ${status === 'error' ? 'border-red-500 text-red-500 bg-red-500/10' : ''}
                                                ${status === 'idle' && otp.length > index ? 'text-blue-400 border-blue-400/50' : 'text-slate-600'}
                                                ${status === 'verifying' ? 'opacity-50' : ''}
                                            `}
                                        />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>
                        </div>

                        <div className="flex items-center space-x-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <input
                                type="checkbox"
                                id="trustDevice"
                                checked={trustDevice}
                                onChange={(e) => setTrustDevice(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <label
                                htmlFor="trustDevice"
                                className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                            >
                                Trust this device for 30 days
                            </label>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-slate-500 hover:text-black hover:bg-slate-50"
                        onClick={() => navigate("/", { replace: true })}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to login
                    </Button>
                </CardFooter>
            </Card>

            <ServiceSelectionDialog
                isOpen={isSelectionDialogOpen}
                onOpenChange={setIsSelectionDialogOpen}
                services={selectionServices}
                onSelect={handleSelectService}
                isLoading={status === 'verifying'}
            />
        </div>
    );
};

export default TwoFactor;

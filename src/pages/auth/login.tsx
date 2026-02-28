import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import authApi, { LoginResponse } from "../../context/api/auth";
import usersApi from "../../context/api/users";
import { Loader2, Eye, EyeOff } from "lucide-react";
import ServiceSelectionDialog from "../../components/auth/ServiceSelectionDialog";
import { useService } from "../../context/ServiceContext";

const Login: React.FC = () => {
    const { setCurrentService } = useService();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
    const [selectionServices, setSelectionServices] = useState<any[]>([]);
    const [userIdForSelection, setUserIdForSelection] = useState('');
    const navigate = useNavigate();

    React.useEffect(() => {
        const token = localStorage.getItem('agisa_token');
        if (token) {
            navigate('/dashboard', { replace: true });
        }

        // Check if email was remembered
        const rememberedEmail = localStorage.getItem('agisa_remembered_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, [navigate]);

    const handleLogin = async () => {
        // Check if fields are empty
        if (!email.trim() || !password.trim()) {
            toast.error('All field are required', {
                description: 'Please fill all field.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const deviceId = localStorage.getItem('agisa_device_id') || undefined;
            const data = await authApi.login(email, password, deviceId);

            // Handle 2FA if required
            if ('twoFactorRequired' in data && (data as any).twoFactorRequired) {
                toast.info('2FA Authentication are required', {
                    description: 'Please enter your 2FA code.'
                });
                navigate("/two-factor", { state: { userId: (data as any).userId }, replace: true });
                return;
            }

            // Handle Service Selection if required
            if ('serviceSelectionRequired' in data && data.serviceSelectionRequired) {
                setUserIdForSelection(data.userId);
                setSelectionServices(data.services);
                setIsSelectionDialogOpen(true);
                return;
            }

            const loginData = data as LoginResponse;
            const { access_token, refresh_token, enterpriseCode, deviceId: returnedDeviceId } = loginData;
            await finalizeLogin(access_token, refresh_token, enterpriseCode, returnedDeviceId);

        } catch (error: any) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || 'Invalid credentials';

            if (message.includes('maintenance')) {
                toast.error('System Maintenance', {
                    description: message,
                    duration: 5000,
                });
            } else {
                toast.error('Connection error', {
                    description: message,
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleSelectService = async (enterpriseId: string) => {
        setIsLoading(true);
        try {
            // Find selected service in list to get enterpriseCode
            const selectedService = selectionServices.find(s => s.id === enterpriseId);
            const enterpriseCode = selectedService?.enterpriseCode;

            const data = await authApi.selectService(userIdForSelection, enterpriseId);
            const { access_token, refresh_token } = data;
            await finalizeLogin(access_token, refresh_token, enterpriseCode);
            setIsSelectionDialogOpen(false);
        } catch (error: any) {
            console.error('Service selection error:', error);
            const message = error.response?.data?.message || 'Failed to select service';
            toast.error('This service is currently in maintenance', {
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    }

    const finalizeLogin = async (access_token: string, refresh_token: string, enterpriseCode?: string, deviceId?: string) => {
        // Store tokens first (needed for subsequent API calls)
        localStorage.setItem('agisa_token', access_token);
        localStorage.setItem('agisa_refresh_token', refresh_token);

        if (deviceId) {
            localStorage.setItem('agisa_device_id', deviceId);
        }

        // Handle "Remember me"
        if (rememberMe) {
            localStorage.setItem('agisa_remembered_email', email);
        } else {
            localStorage.removeItem('agisa_remembered_email');
        }

        // Fetch user profile separately as requested
        try {
            const userProfile = await usersApi.getMe();

            if (!userProfile || !userProfile.role) {
                throw new Error('User profile is incomplete.');
            }

            localStorage.setItem('agisa_user', JSON.stringify(userProfile));

            toast.success(`Welcome, ${userProfile.fullName}`);

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

                    if (effectiveRole === 'MANAGER_HEADQUARTER_LOCAL') {
                        navigate(`/${enterpriseCode}/headquaterlocal`, { replace: true });
                    } else if (effectiveRole === 'SELLER') {
                        // For SELLER, check if assigned to a seller account
                        if (activeMembership.sellerId) {
                            navigate(`/${enterpriseCode}/`, { replace: true });
                        } else {
                            toast.error('Access Denied', {
                                description: 'You are not assigned to a seller account for this service.',
                                duration: 6000
                            });
                            // Cleanup and stay on login
                            localStorage.removeItem('agisa_token');
                            localStorage.removeItem('agisa_refresh_token');
                            localStorage.removeItem('agisa_user');
                        }
                    } else {
                        navigate(`/${enterpriseCode}/`, { replace: true });
                    }
                    return;
                }
            }

            // Detect global status via role level (True Global Admins/Staff)
            const roleLevel = userProfile.role.level?.toUpperCase();
            const isGlobalRole = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTING', 'LITIGATION'].includes(roleLevel);

            // Redirect to dashboard for global roles
            if (isGlobalRole) {
                navigate("/dashboard", { replace: true });
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

                    // Specific redirect for Local Manager/Seller
                    if (effRole === 'MANAGER_HEADQUARTER_LOCAL') {
                        navigate(`/${firstService.enterpriseCode}/headquaterlocal`, { replace: true });
                    } else if (effRole === 'SELLER') {
                        navigate(`/${firstService.enterpriseCode}/sellerlocal`, { replace: true });
                    } else {
                        navigate(`/${firstService.enterpriseCode}/`, { replace: true });
                    }
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
                // No navigation happens, user stays on Login page
            }
        } catch (profileError) {
            console.error('Failed to fetch profile after login:', profileError);
            // Cleanup tokens if profile fetch fails
            localStorage.removeItem('agisa_token');
            localStorage.removeItem('agisa_refresh_token');
            throw new Error('Unable to retrieve your profile.');
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-5xl items-stretch gap-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-0">
                {/* Left Column */}
                <div className="hidden w-1/2 flex-col items-center justify-center md:flex">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-emerald-600 lg:text-5xl">
                            <span className="uppercase">Agisa</span>
                        </h1>
                        <p className="mt-1 text-lg text-slate-500">
                            Welcome back to your workspace.
                        </p>
                    </div>
                </div>

                {/* Separator */}
                <div className="hidden w-[1px] shrink-0 bg-gray-200 dark:bg-gray-800 md:block"></div>

                {/* Right Column */}
                <div className="flex w-full items-center justify-center md:w-1/2">
                    <Card className="w-full max-w-md border-0 shadow-none md:shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl font-bold text-slate-800">Log in to <span className="uppercase">Agisa</span></CardTitle>
                            <CardDescription className="text-slate-500">
                                Enter your email and password to access your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
                                <Input id="email" type="email" placeholder="m@example.com"
                                    value={email}
                                    className="text-black bg-slate-50"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        className="text-black bg-slate-50"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={rememberMe}
                                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="text-sm text-slate-600 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Remember me
                                    </Label>
                                </div>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                                >
                                    Forgot your password?
                                </Link>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest h-11"
                                onClick={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {isLoading ? "Connecting..." : "Login"}
                            </Button>
                            {/* <div className="text-center text-sm text-gray-500">
                                Don't have an account?{" "}
                                <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                                    Sign up
                                </Link>
                            </div> */}
                        </CardFooter>
                    </Card>
                </div>
            </div>

            <ServiceSelectionDialog
                isOpen={isSelectionDialogOpen}
                onOpenChange={setIsSelectionDialogOpen}
                services={selectionServices}
                onSelect={handleSelectService}
                isLoading={isLoading}
            />
        </div>
    );
}

export default Login;
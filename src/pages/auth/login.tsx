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
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import authApi, { LoginResponse } from "../../context/api/auth";
import usersApi from "../../context/api/users";
import { Loader2 } from "lucide-react";

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
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
            const data = await authApi.login(email, password);

            // Handle 2FA if required
            if ('twoFactorRequired' in data && data.twoFactorRequired) {
                toast.info('2FA Authentication are required', {
                    description: 'Please enter your 2FA code.'
                });
                navigate("/two-factor", { state: { userId: data.userId } });
                return;
            }

            const { access_token, refresh_token } = data as LoginResponse;

            // Store tokens first (needed for subsequent API calls)
            localStorage.setItem('agisa_token', access_token);
            localStorage.setItem('agisa_refresh_token', refresh_token);

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
                const roleName = userProfile.role.name.toLowerCase();
                localStorage.setItem('userRole', roleName);

                console.log('Login successful. Role:', roleName);
                toast.success(`Byenveni, ${userProfile.fullName}`);

                // Redirect to dashboard
                navigate("/dashboard");
            } catch (profileError) {
                console.error('Failed to fetch profile after login:', profileError);
                // Cleanup tokens if profile fetch fails
                localStorage.removeItem('agisa_token');
                localStorage.removeItem('agisa_refresh_token');
                throw new Error('Impossible de récupérer votre profil.');
            }

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

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-slate-900 px-4 py-12 dark dark:bg-gradient-to-br from-black via-gray-900 to-slate-900 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-5xl items-stretch gap-8 border border-gray-200 dark:border-gray-800 rounded-lg">
                {/* Left Column */}
                <div className="hidden w-1/2 flex-col items-center justify-center md:flex">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-emerald-600 lg:text-5xl">
                            Agisa
                        </h1>
                        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
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
                            <CardTitle className="text-2xl font-bold text-gray-500 dark:text-gray-400">Log in to Agisa</CardTitle>
                            <CardDescription className="text-gray-500 dark:text-gray-400">
                                Enter your email and password to access your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-gray-500 dark:text-gray-400">Email</Label>
                                <Input id="email" type="email" placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-gray-500 dark:text-gray-400">Password</Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                                        className="text-sm text-gray-500 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
        </div>
    );
}

export default Login;
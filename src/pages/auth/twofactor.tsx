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

const TwoFactor: React.FC = () => {
    const [otp, setOtp] = useState("");
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const navigate = useNavigate();
    const location = useLocation();

    // Retrieve userId from navigation state
    const userId = location.state?.userId;

    useEffect(() => {
        if (!userId) {
            toast.error("Session Expire", {
                description: "Please login again."
            });
            navigate("/");
        }
    }, [userId, navigate]);

    const handleVerify = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (otp.length !== 6) return;

        setStatus('verifying');
        try {
            const data = await authApi.twoFactorLogin(userId, otp);

            const { access_token, refresh_token } = data as LoginResponse;

            // Store tokens first (needed for subsequent API calls)
            localStorage.setItem('agisa_token', access_token);
            localStorage.setItem('agisa_refresh_token', refresh_token);

            // Fetch user profile separately
            try {
                const userProfile = await usersApi.getMe();

                if (!userProfile || !userProfile.role) {
                    throw new Error('Enfòmasyon itilizatè a pa nèt.');
                }

                localStorage.setItem('agisa_user', JSON.stringify(userProfile));
                setStatus('success');
                const roleName = userProfile.role.name.toLowerCase();
                localStorage.setItem('userRole', roleName);

                console.log('2FA Login successful. Role:', roleName);
                toast.success(`Welcome back, ${userProfile.fullName}`);

                setTimeout(() => {
                    navigate("/dashboard");
                }, 800);
            } catch (profileError) {
                console.error('Failed to fetch profile after 2FA:', profileError);
                // Cleanup tokens if profile fetch fails
                localStorage.removeItem('agisa_token');
                localStorage.removeItem('agisa_refresh_token');
                throw new Error('Impossible de récupérer votre profil.');
            }

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
    }, [otp, userId, navigate]);

    // Auto-submit when 6 digits are reached
    useEffect(() => {
        if (otp.length === 6 && status === 'idle') {
            handleVerify();
        }
    }, [otp, status, handleVerify]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-slate-900 px-4 py-12 dark sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white uppercase tracking-widest">2FA Security</CardTitle>
                    <CardDescription className="text-zinc-400 font-bold">
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
                                            className={`h-14 w-12 text-xl font-bold bg-white/5 border-white/10 transition-all duration-300
                                                ${status === 'success' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}
                                                ${status === 'error' ? 'border-red-500 text-red-500 bg-red-500/10' : ''}
                                                ${status === 'idle' && otp.length > index ? 'text-blue-400 border-blue-400/50' : 'text-slate-400'}
                                                ${status === 'verifying' ? 'opacity-50' : ''}
                                            `}
                                        />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-zinc-500 hover:text-white"
                        onClick={() => navigate("/")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to login
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default TwoFactor;

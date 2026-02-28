import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { ChevronLeft, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import authApi from "../../context/api/auth";

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error("Invalid link", {
                description: "The reset token is missing.",
            });
            return;
        }

        if (password.length < 8) {
            toast.error("Password too short", {
                description: "Password must be at least 8 characters long.",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match", {
                description: "Please make sure both passwords are the same.",
            });
            return;
        }

        setIsLoading(true);
        try {
            await authApi.resetPassword(token, password);
            setIsSuccess(true);
            toast.success("Password updated", {
                description: "Your password has been reset successfully.",
            });
        } catch (error: any) {
            console.error("Reset password error:", error);
            const message = error.response?.data?.message || "Failed to reset password.";
            toast.error("Error", {
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
                <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm text-center p-6">
                    <CardHeader>
                        <CardTitle className="text-red-500">Invalid Reset Link</CardTitle>
                        <CardDescription className="text-slate-500">
                            The link you used is invalid or has expired.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Button onClick={() => navigate("/")} variant="outline" className="border-slate-200 text-black hover:bg-slate-100">
                            Back to login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-5xl items-stretch gap-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-0">
                {/* Left Column */}
                <div className="hidden w-1/2 flex-col items-center justify-center md:flex">
                    <div className="text-center">
                        <div className="text-center">
                            <div className="flex items-center justify-center">
                                <img src="/ag1.webp" alt="Agisa" className="w-64 h-64" />
                            </div>
                            {/* <p className="mt-1 text-lg text-slate-500">
                            Welcome back to your workspace.
                        </p> */}
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="hidden w-[1px] shrink-0 bg-gray-200 dark:bg-gray-800 md:block"></div>

                {/* Right Column */}
                <div className="flex w-full items-center justify-center md:w-1/2">
                    <Card className="w-full max-w-md border-none shadow-none md:shadow-sm">
                        {!isSuccess ? (
                            <>
                                <CardHeader className="space-y-1">
                                    <CardTitle className="text-2xl font-bold text-slate-800">Set new password</CardTitle>
                                    <CardDescription className="text-slate-500">
                                        Choose a strong password to protect your account
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <form onSubmit={handleSubmit} className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password" className="text-slate-700 font-semibold">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                    className="bg-slate-50 border-slate-200 text-black pr-10 focus-visible:ring-emerald-500"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold">Confirm Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                disabled={isLoading}
                                                className="bg-slate-50 border-slate-200 text-black focus-visible:ring-emerald-500"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 font-bold uppercase tracking-widest mt-2"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            {isLoading ? "Resetting..." : "Reset Password"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </>
                        ) : (
                            <CardContent className="py-12 flex flex-col items-center text-center space-y-4">
                                <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                                    <CheckCircle2 className="h-12 w-12" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-slate-800">Success!</h3>
                                    <p className="text-sm text-slate-500 px-4">
                                        Your password has been changed successfully. You can now log in with your new credentials.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => navigate("/")}
                                    className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest"
                                >
                                    Login Now
                                </Button>
                            </CardContent>
                        )}
                        <CardFooter className="pt-0">
                            <Link
                                to="/"
                                className="flex w-full items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-700"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};
export default ResetPassword;
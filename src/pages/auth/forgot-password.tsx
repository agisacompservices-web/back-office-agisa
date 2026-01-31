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
import { ChevronLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import authApi from "../../context/api/auth";

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Email required", {
                description: "Please enter your email address.",
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.forgotPassword(email);
            setSuccessMessage(response.message);
            setIsSubmitted(true);

            // Si c'est un message de vérification, on prévient l'utilisateur via toast aussi
            if (response.message.includes("vérifié")) {
                toast.info("Verification required", {
                    description: "Your account is not verified. We sent you a verification link instead.",
                });
            } else {
                toast.success("Email sent", {
                    description: "If an account exists, you will receive a reset link.",
                });
            }
        } catch (error: any) {
            console.error("Forgot password error:", error);
            const message = error.response?.data?.message || "Failed to send reset link.";
            toast.error("Error", {
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-slate-900 px-4 py-12 dark dark:bg-gradient-to-br from-black via-gray-900 to-slate-900 py-12  sm:px-6 lg:px-8">
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
                    <Card className="w-full max-w-md border-none shadow-none md:shadow-sm">
                        {!isSubmitted ? (
                            <>
                                <CardHeader className="space-y-1">
                                    <CardTitle className="text-2xl font-bold text-gray-500 dark:text-gray-400">Forgot password?</CardTitle>
                                    <CardDescription className="text-gray-500 dark:text-gray-400">
                                        Enter your email address and we'll send you a link to reset your password
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <form onSubmit={handleSubmit} className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-gray-500 dark:text-gray-400">Email address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="m@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 font-bold uppercase tracking-widest"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            {isLoading ? "Sending..." : "Send reset link"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </>
                        ) : (
                            <CardContent className="py-12 flex flex-col items-center text-center space-y-4">
                                <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                                    {successMessage.includes("vérifié") ? (
                                        <MailCheck className="h-12 w-12" />
                                    ) : (
                                        <MailCheck className="h-12 w-12" />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">
                                        {successMessage.includes("vérifié") ? "Account Needs Verification" : "Check your email"}
                                    </h3>
                                    <p className="text-sm text-gray-400 px-4">
                                        {successMessage.includes("vérifié")
                                            ? "Your account is not verified yet. We've sent a verification link to your email instead of a password reset link. Please verify your email first."
                                            : `We've sent a password reset link to your email. If an account exists, you will receive it shortly.`
                                        }
                                        <br />
                                        <span className="font-bold text-emerald-500 mt-2 block">{email}</span>
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsSubmitted(false)}
                                    className="mt-4 border-gray-800 text-gray-400 hover:text-white hover:bg-white/5"
                                >
                                    Try another email
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
export default ForgotPassword;
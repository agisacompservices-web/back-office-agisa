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

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        // Check if fields are empty
        if (!email.trim() || !password.trim()) {
            toast.error('All fields are required', {
                description: 'Please fill in all fields',
            });
            return;
        }
        // Check credentials
        let role = '';
        if (email === 'pdg@agisa.com' && password === 'Pdg@123') {
            role = 'pdg';
        } else if (email === 'finance@agisa.com' && password === 'finance@123') {
            role = 'finance';
        } else if (email === 'accounting@agisa.com' && password === 'accounting@123') {
            role = 'accounting';
        } else if (email === 'litigation@agisa.com' && password === 'litigation@123') {
            role = 'litigation';
        }

        if (role) {
            localStorage.setItem('userRole', role);

            // Redirect based on role
            switch (role) {
                case 'finance':
                    navigate("/finance");
                    break;
                case 'accounting':
                    navigate("/accounting");
                    break;
                case 'litigation':
                    navigate("/litigation");
                    break;
                default:
                    navigate("/dashboard");
            }
        } else {
            toast.error('Email or password is incorrect', {
                description: 'Please try again.',
            });
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
                                    <Checkbox id="remember" />
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
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleLogin}>
                                Log in
                            </Button>
                            <div className="text-center text-sm text-gray-500">
                                Don't have an account?{" "}
                                <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                                    Sign up
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Login;
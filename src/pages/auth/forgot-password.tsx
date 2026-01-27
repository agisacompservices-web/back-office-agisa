import React from "react";
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
import { ChevronLeft } from "lucide-react";

const ForgotPassword: React.FC = () => {
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
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl font-bold text-gray-500 dark:text-gray-400">Forgot password?</CardTitle>
                            <CardDescription className="text-gray-500 dark:text-gray-400">
                                Enter your email address and we'll send you a link to reset your password
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-gray-500 dark:text-gray-400">Email address</Label>
                                <Input id="email" type="email" placeholder="m@example.com" required />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                                Send reset link
                            </Button>
                            <Link
                                to="/"
                                className="flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-700"
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
}
export default ForgotPassword;
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CheckCircle2, XCircle, Loader2, ChevronLeft } from "lucide-react";
import authApi from "../../context/api/auth";

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage("Token de vérification manquant.");
                return;
            }

            try {
                const response = await authApi.verifyEmail(token);
                setStatus('success');
                setMessage(response.message || "Your email has been verified successfully.");
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || "Failed to verify email.");
            }
        };

        verify();
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-slate-900 px-4 py-12">
            <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl text-center p-6">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        {status === 'loading' && <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />}
                        {status === 'success' && <CheckCircle2 className="h-12 w-12 text-emerald-500" />}
                        {status === 'error' && <XCircle className="h-12 w-12 text-red-500" />}
                    </div>
                    <CardTitle className={status === 'error' ? "text-red-500" : "text-white"}>
                        {status === 'loading' && "Vérification en cours..."}
                        {status === 'success' && "Compte vérifié !"}
                        {status === 'error' && "Erreur de vérification"}
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-2">
                        {message}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status === 'success' && (
                        <p className="text-gray-300 text-sm mb-6">
                            Your AGISA account is now verified
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => navigate("/")} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to login
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default VerifyEmail;

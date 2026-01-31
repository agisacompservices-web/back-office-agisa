import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { FileQuestion, ArrowLeft, Home, Lock } from 'lucide-react';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("agisa_token");

    console.error('404 NOT FOUND:', {
        path: window.location.pathname,
        isAuthenticated
    });

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-slate-900 px-4 text-white dark">
            <div className="relative mb-8 text-center">
                <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-2xl animate-pulse"></div>
                <FileQuestion className="relative h-24 w-24 text-emerald-500 mx-auto" />
            </div>

            <h1 className="mb-2 text-8xl font-black tracking-tighter text-white/10 select-none">404</h1>

            <div className="text-center space-y-4 max-w-md">
                <h2 className="text-3xl font-bold text-white uppercase tracking-widest">Page Not Found</h2>
                <p className="text-zinc-400 font-medium leading-relaxed">
                    The page you are looking for does not exist or has been moved.
                </p>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Button
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white h-12 uppercase font-bold tracking-widest"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 uppercase font-bold tracking-widest"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
                >
                    {isAuthenticated ? (
                        <>
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                        </>
                    ) : (
                        <>
                            <Lock className="mr-2 h-4 w-4" />
                            Login
                        </>
                    )}
                </Button>
            </div>

            <div className="mt-24 text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
                Agisa OS • Error Management
            </div>
        </div>
    );
};

export default NotFound;

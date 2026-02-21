import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { Loader2, User, Store, MapPin, FileText, ArrowRight, ArrowLeft } from "lucide-react";
import sellerApi from "../../context/api/seller";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";

const BecomeSeller: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        sellerName: "",
        sellerType: "SILVER",
        adresseLigne1: "",
        departement: "",
        commune: "",
        sectionCommunale: "",
        enterpriseId: "",
    });
    const [proofFile, setProofFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchEnterprises = async () => {
            try {
                const response = await enterpriseApi.getAll({ limit: 100 });
                setEnterprises(response.data.filter(e => e.isActive));
            } catch (error) {
                console.error("Failed to fetch enterprises", error);
                toast.error("Failed to load services. Please try again later.");
            }
        };
        fetchEnterprises();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const nextStep = () => {
        // Simple validation
        if (step === 1) {
            if (!formData.fullName || !formData.email) {
                toast.error("Please fill all required fields");
                return;
            }
        } else if (step === 2) {
            if (!formData.sellerName || !formData.enterpriseId || !formData.sellerType) {
                toast.error("Please fill all required fields");
                return;
            }
        }
        setStep((prev) => prev + 1);
    };

    const prevStep = () => setStep((prev) => prev - 1);

    const handleSubmit = async () => {
        if (!formData.adresseLigne1 || !formData.commune || !formData.departement || !formData.sectionCommunale || !proofFile) {
            toast.error("Please fill all fields and upload the proof file");
            return;
        }

        setIsLoading(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });
            data.append("proof", proofFile);

            await sellerApi.register(data);

            // Clear any existing session to prevent auto-login from a previous user
            localStorage.removeItem('agisa_token');
            localStorage.removeItem('agisa_refresh_token');
            localStorage.removeItem('agisa_user');
            localStorage.removeItem('agisa_current_service');

            toast.success("Application submitted successfully!", {
                description: "Your account is pending validation by the administrator. Check your email to set your password.",
            });
            navigate("/login");
        } catch (error: any) {
            console.error("Registration error:", error);
            const message = error.response?.data?.message || "Failed to submit application";
            toast.error("Registration error", { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex overflow-hidden flex-col items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-950 to-slate-950 px-4 py-12 dark sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
                    Agisa <span className="text-purple-400">Seller</span>
                </h1>
                <p className="mt-2 text-lg text-slate-300">
                    Join our network and start selling today.
                </p>
            </div>

            <Card className="w-full max-w-2xl border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 1 ? 'bg-emerald-600' : 'bg-slate-800'} text-white`}>
                            <User className="h-5 w-5" />
                        </div>
                        <div className={`h-[2px] flex-1 mx-2 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-800'}`}></div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-800'} text-white`}>
                            <Store className="h-5 w-5" />
                        </div>
                        <div className={`h-[2px] flex-1 mx-2 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-800'}`}></div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-800'} text-white`}>
                            <MapPin className="h-5 w-5" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-white">
                        {step === 1 && "Personal Information"}
                        {step === 2 && "Business Information"}
                        {step === 3 && "Location & Proof"}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        {step === 1 && "Tell us about yourself."}
                        {step === 2 && "Tell us about your point of sale."}
                        {step === 3 && "Finalize your registration."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                                <Input id="fullName" value={formData.fullName} onChange={handleChange} placeholder="Jean Pierre" className="bg-slate-800 border-slate-700 text-white focus:border-emerald-500" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="jean@example.com" className="bg-slate-800 border-slate-700 text-white focus:border-emerald-500" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone" className="text-slate-300">Phone (Optional)</Label>
                                <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="+509..." className="bg-slate-800 border-slate-700 text-white focus:border-emerald-500" />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="sellerName" className="text-slate-300">Point of Sale Name</Label>
                                <Input id="sellerName" value={formData.sellerName} onChange={handleChange} placeholder="Ma Boutique Agisa" className="bg-slate-800 border-slate-700 text-white focus:border-emerald-500" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sellerType" className="text-slate-300">Seller Level</Label>
                                <Select onValueChange={(val) => setFormData((prev) => ({ ...prev, sellerType: val }))} value={formData.sellerType}>
                                    <SelectTrigger id="sellerType" className="bg-slate-800 border-slate-700 text-white focus:ring-emerald-500">
                                        <SelectValue placeholder="Select Level" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="PLATINUM">💎 PLATINUM</SelectItem>
                                        <SelectItem value="SILVER">🥈 SILVER</SelectItem>
                                        <SelectItem value="GOLD">🥇 GOLD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="enterprise" className="text-slate-300">Select Service</Label>
                                <Select onValueChange={(val) => setFormData((prev) => ({ ...prev, enterpriseId: val }))} value={formData.enterpriseId}>
                                    <SelectTrigger id="enterprise" className="bg-slate-800 border-slate-700 text-white focus:ring-emerald-500">
                                        <SelectValue placeholder="Choose a service" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        {enterprises.map((ent) => (
                                            <SelectItem key={ent.id} value={ent.id}>{ent.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="departement" className="text-slate-300">State</Label>
                                    <Input id="departement" value={formData.departement} onChange={handleChange} placeholder="Nord" className="bg-slate-800 border-slate-700 text-white focus:border-emerald-500" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="commune" className="text-slate-300">City</Label>
                                    <Input id="commune" value={formData.commune} onChange={handleChange} placeholder="Saint-Raphaël" className="bg-slate-800 border-slate-700 text-white focus:border-emerald-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="adresseLigne1" className="text-slate-300">Street Address</Label>
                                    <Input id="adresseLigne1" value={formData.adresseLigne1} onChange={handleChange} placeholder="734, rue sylvestre" className="bg-slate-800 border-slate-700 text-white focus:border-emerald-500" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="sectionCommunale" className="text-slate-300">Section</Label>
                                    <Input id="sectionCommunale" value={formData.sectionCommunale} onChange={handleChange} placeholder="Sanyago" className="bg-slate-800 border-slate-700 text-white focus:border-emerald-500" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="proof" className="text-slate-300">Registration Proof (ID or Payment)</Label>
                                <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-lg hover:border-emerald-500 transition-colors">
                                    <FileText className="h-10 w-10 text-slate-500 mb-2" />
                                    <p className="text-sm text-slate-400">
                                        {proofFile ? proofFile.name : "Click to select or drag and drop"}
                                    </p>
                                    <Input id="proof" type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={prevStep} className="text-slate-300 hover:text-white hover:bg-slate-800">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    ) : (
                        <Link to="/login" className="text-sm text-slate-400 hover:text-white">
                            Already have an account? Login
                        </Link>
                    )}

                    {step < 3 ? (
                        <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                            Next <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {isLoading ? "Submitting..." : "Finish Registration"}
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <p className="mt-8 text-sm text-slate-500">
                © {new Date().getFullYear()} Agisa Technologies. All rights reserved.
            </p>
        </div>
    );
};

export default BecomeSeller;

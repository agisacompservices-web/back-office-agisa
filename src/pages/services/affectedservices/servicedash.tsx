import React from 'react';
import { useParams } from 'react-router-dom';
import { useService } from "../../../context/ServiceContext";

const ServiceDash: React.FC = () => {
    const { enterpriseCode } = useParams();
    const { currentService } = useService();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white uppercase tracking-widest">
                {currentService?.name || enterpriseCode || "Service Dashboard"}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">Status</h3>
                    <p className="text-2xl font-bold text-white">Active</p>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">Service Code</h3>
                    <p className="text-2xl font-bold text-white">{enterpriseCode}</p>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">Enterprise ID</h3>
                    <p className="text-sm font-mono text-gray-400 truncate">{currentService?.id || "N/A"}</p>
                </div>
            </div>
            <p className="text-gray-400 mt-8">
                Welcome to your enterprise-specific workspace. Use the sidebar to navigate through your services.
            </p>
        </div>
    );
};

export default ServiceDash;
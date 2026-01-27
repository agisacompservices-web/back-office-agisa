import React from "react";
import { litigationData } from "../../context/data/dataLitigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { ShieldAlert, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

const LitigationReport: React.FC = () => {
    // Summary Statistics
    const totalCases = litigationData.length;
    const validatedCases = litigationData.filter(c => c.status === "validated").length;
    const rejectedCases = litigationData.filter(c => c.status === "rejected").length;
    const pendingCases = litigationData.filter(c => c.status === "under_review" || c.status === "investigating").length;

    const totalAmount = litigationData.reduce((acc, curr) => acc + curr.amount, 0);

    // Status Distribution for Pie Chart
    const statusCounts = litigationData.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.keys(statusCounts).map(status => ({
        name: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: statusCounts[status]
    }));

    const COLORS = ['#F59E0B', '#10B981', '#EF4444', '#3B82F6'];

    // Volume by Service for Bar Chart
    const serviceVolume = litigationData.reduce((acc, curr) => {
        acc[curr.service] = (acc[curr.service] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const serviceData = Object.keys(serviceVolume).map(service => ({
        name: service,
        amount: serviceVolume[service]
    }));

    return (
        <div className="flex-1 space-y-4 pt-6">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Litigation Analytics</h2>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Cases</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCases}</div>
                        <p className="text-xs text-slate-500">Total volume: ${totalAmount.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Validated</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{validatedCases}</div>
                        <p className="text-xs text-slate-500">{((validatedCases / totalCases) * 100).toFixed(1)}% of total</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rejectedCases}</div>
                        <p className="text-xs text-slate-500">{((rejectedCases / totalCases) * 100).toFixed(1)}% of total</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Under Review</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCases}</div>
                        <p className="text-xs text-slate-500">Awaiting expert assessment</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            Financial Impact by Service
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={serviceData}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                                />
                                <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Case Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default LitigationReport;
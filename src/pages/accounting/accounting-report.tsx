import React from "react";
import { accountingData } from "../../context/data/dataAccounting";
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
import { Calculator, CheckCircle2, XCircle, Send, PieChart as PieChartIcon, TrendingUp } from "lucide-react";

const AccountingReport: React.FC = () => {
    // Summary Statistics
    const totalRequests = accountingData.length;
    const processedRequests = accountingData.filter(r => r.status === "processed").length;
    const rejectedRequests = accountingData.filter(r => r.status === "rejected").length;
    const inLitigation = accountingData.filter(r => r.status === "sent_to_litigation").length;

    const totalVolume = accountingData.reduce((acc, curr) => acc + curr.amount, 0);

    // Status Distribution for Pie Chart
    const statusCounts = accountingData.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.keys(statusCounts).map(status => ({
        name: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: statusCounts[status]
    }));

    const COLORS = ['#3B82F6', '#F97316', '#EF4444', '#10B981'];

    // Volume by Type for Bar Chart
    const typeVolume = accountingData.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const typeData = Object.keys(typeVolume).map(type => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        amount: typeVolume[type]
    }));

    return (
        <div className="flex-1 space-y-4 pt-6">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Accounting Analytics</h2>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Requests</CardTitle>
                        <Calculator className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRequests}</div>
                        <p className="text-xs text-slate-500">Volume: ${totalVolume.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Processed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{processedRequests}</div>
                        <p className="text-xs text-slate-500">Completed operations</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Sent to Litigation</CardTitle>
                        <Send className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inLitigation}</div>
                        <p className="text-xs text-slate-500">Escalated for review</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rejectedRequests}</div>
                        <p className="text-xs text-slate-500">Compliance failures</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                            Financial Volume by Request Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={typeData}>
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
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-blue-400" />
                            Request Status Status
                        </CardTitle>
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

export default AccountingReport;
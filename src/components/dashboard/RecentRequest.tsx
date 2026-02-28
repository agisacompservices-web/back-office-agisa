import {
    Avatar,
    AvatarFallback,
} from "../ui/avatar"

import { Request, RequestType } from "../../context/api/request"

interface RecentRequestsProps {
    requests: Request[];
}

export function RecentRequests({ requests }: RecentRequestsProps) {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="space-y-8">
            {requests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm uppercase font-bold tracking-widest">
                    No recent requests
                </div>
            )}
            {requests.map((request, index) => (
                <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9 border border-slate-200">
                        <AvatarFallback className="bg-slate-50 text-xs text-black">
                            {request.requester ? getInitials(request.requester.fullName) : "??"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-bold leading-none text-black">
                            {request.requester?.fullName || "System/Unknown"}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {request.requester?.userCode || "N/A"} • {request.enterprise?.name || "N/A"}
                        </p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                        <div className={`text-sm font-black ${request.type === RequestType.DEPOSIT ? 'text-emerald-500' : request.type === RequestType.WITHDRAWAL ? 'text-orange-500' : 'text-black'}`}>
                            {request.type}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground">
                            ${Number(request.amount).toLocaleString()}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

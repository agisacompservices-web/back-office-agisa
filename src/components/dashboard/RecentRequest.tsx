import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "../ui/avatar"

const requests = [
    {
        name: "Olivia Martin",
        code: "USR-8832",
        type: "Deposit",
        fallback: "OM",
        image: "/avatars/01.png"
    },
    {
        name: "Jackson Lee",
        code: "USR-1029",
        type: "Withdraw",
        fallback: "JL",
        image: "/avatars/02.png"
    },
    {
        name: "Isabella Nguyen",
        code: "USR-4721",
        type: "Correction",
        fallback: "IN",
        image: "/avatars/03.png"
    },
    {
        name: "William Kim",
        code: "USR-9912",
        type: "Signature",
        fallback: "WK",
        image: "/avatars/04.png"
    },
    {
        name: "Sofia Davis",
        code: "USR-2321",
        type: "Finnancing",
        fallback: "SD",
        image: "/avatars/05.png"
    }
]

export function RecentRequests() {
    return (
        <div className="space-y-8">
            {requests.map((request, index) => (
                <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={request.image} alt="Avatar" />
                        <AvatarFallback>{request.fallback}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none text-white">{request.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {request.code}
                        </p>
                    </div>
                    <div className="ml-auto font-medium text-white">{request.type}</div>
                </div>
            ))}
        </div>
    )
}

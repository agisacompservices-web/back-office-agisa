import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "../ui/avatar"
import { Button } from "../ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"

import { useSidebar } from "../../context/SidebarContext"
import { cn } from "../../lib/utils"

export function UserNav() {
    const { isSidebarOpen } = useSidebar()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("relative", isSidebarOpen ? "w-full justify-between px-2" : "h-8 w-8 rounded-full justify-center")}>
                    {isSidebarOpen && <p className="text-sm font-medium leading-none text-white whitespace-nowrap overflow-hidden text-ellipsis mr-2">John Doe</p>}
                    <Avatar className="h-8 w-8 border border-white/10 shrink-0">
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 bg-black/80 backdrop-blur-xl border-white/10 text-slate-400 [&_[role=menuitem]]:text-slate-400 [&_[role=menuitem]:focus]:bg-white/10 [&_[role=menuitem]:focus]:text-white"
                side="right"
                align="end"
                sideOffset={8}
                forceMount
            >
                <DropdownMenuLabel className="font-normal text-slate-400">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-white">shadcn</p>
                        <p className="text-xs leading-none text-slate-500">
                            m@example.com
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        Profile
                        <DropdownMenuShortcut className="text-slate-500">⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        Billing
                        <DropdownMenuShortcut className="text-slate-500">⌘B</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        Settings
                        <DropdownMenuShortcut className="text-slate-500">⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>New Team</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem>
                    Log out
                    <DropdownMenuShortcut className="text-slate-500">⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
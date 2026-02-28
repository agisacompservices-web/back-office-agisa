import {
    // useState, useEffect, 
    useContext
} from "react";
// import {
//     Command,
//     CommandEmpty,
//     CommandGroup,
//     CommandInput,
//     CommandItem,
//     CommandList,
//     CommandSeparator,
// } from "../../components/ui/command";
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger,
// } from "../../components/ui/popover";
import {
    // Calculator,
    // Calendar,
    // CreditCard,
    // Settings,
    // Smile,
    // User,
    PanelLeft,
    PanelRight,
} from "lucide-react";
import { Button } from "../../components/ui/button";
// import { cn } from "../../lib/utils";
import { SidebarContext } from "../../context/SidebarContext";
import { ServSidebarContext } from "../../context/ServSidebarContext";
import Language from "./Language";

export function Topbar() {
    const sidebarCtx = useContext(SidebarContext);
    const servSidebarCtx = useContext(ServSidebarContext);

    // Get state and toggle function based on which provider is active
    const isOpen = servSidebarCtx?.isServSidebarOpen ?? sidebarCtx?.isSidebarOpen ?? false;

    const handleToggle = () => {
        if (servSidebarCtx) {
            servSidebarCtx.toggleServSidebar();
        } else if (sidebarCtx) {
            sidebarCtx.toggleSidebar();
        }
    };

    // const [open, setOpen] = useState(false);

    // useEffect(() => {
    //     const down = (e: KeyboardEvent) => {
    //         if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
    //             e.preventDefault();
    //             setOpen((open) => !open);
    //         }
    //     }
    //     document.addEventListener("keydown", down)
    //     return () => document.removeEventListener("keydown", down)
    // }, [])

    return (
        <div className="bg-slate-50 backdrop-blur-xl border-b border-slate-200 text-black">
            <div className="flex h-16 items-center px-4 justify-between">
                <div className="flex-1 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleToggle} className="hover:bg-slate-100 hover:text-black">
                        {isOpen ? <PanelLeft className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
                    </Button>
                </div>
                {/* <div className="flex-1 flex justify-center">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "relative w-full max-w-lg justify-start text-sm text-slate-600 bg-slate-50 border-slate-200 sm:pr-12 md:w-40 lg:w-[500px] hover:bg-slate-100 hover:text-black"
                                )}>
                                <span>Search...</span>
                                <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                    <span className="text-xs">Ctrl</span>K
                                </kbd>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0 bg-white backdrop-blur-xl border-slate-200" align="start">
                            <Command className="bg-transparent text-slate-600 [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:text-slate-600 [&_[cmdk-item]]:text-slate-600 [&_[cmdk-item][data-selected='true']]:bg-slate-100 [&_[cmdk-item][data-selected='true']]:text-black">
                                <CommandInput placeholder="Type a command or search..." className="text-black placeholder:text-slate-600 border-slate-200" />
                                <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    <CommandEmpty>No results found.</CommandEmpty>
                                    <CommandGroup heading="Suggestions">
                                        <CommandItem>
                                            <Calendar className="mr-2 h-4 w-4" />
                                            <span>Calendar</span>
                                        </CommandItem>
                                        <CommandItem>
                                            <Smile className="mr-2 h-4 w-4" />
                                            <span>Search Emoji</span>
                                        </CommandItem>
                                        <CommandItem>
                                            <Calculator className="mr-2 h-4 w-4" />
                                            <span>Calculator</span>
                                        </CommandItem>
                                    </CommandGroup>
                                    <CommandSeparator />
                                    <CommandGroup heading="Settings">
                                        <CommandItem>
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                            <span className="ml-auto text-xs tracking-widest text-muted-foreground">⌘P</span>
                                        </CommandItem>
                                        <CommandItem>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            <span>Billing</span>
                                            <span className="ml-auto text-xs tracking-widest text-muted-foreground">⌘B</span>
                                        </CommandItem>
                                        <CommandItem>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                            <span className="ml-auto text-xs tracking-widest text-slate-600">⌘S</span>
                                        </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div> */}
                <div className="flex items-center space-x-4 flex-1 justify-end">
                    <Language />
                </div>
            </div>
        </div>
    );
}
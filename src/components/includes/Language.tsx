import { useState } from "react"
import { Button } from "../ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"

const languages = [
    { name: "Creole", code: "ht", flag: "https://flagcdn.com/ht.svg" },
    { name: "English", code: "en", flag: "https://flagcdn.com/us.svg" },
    { name: "French", code: "fr", flag: "https://flagcdn.com/fr.svg" },
]

const Language = () => {
    const [selectedLanguage, setSelectedLanguage] = useState(languages[1])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-6 w-6 rounded-full overflow-hidden p-0">
                    <img
                        src={selectedLanguage.flag}
                        alt={selectedLanguage.name}
                        className="h-full w-full object-cover"
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black/80 backdrop-blur-xl border-white/10 text-slate-400" align="end" forceMount>
                <DropdownMenuGroup>
                    {languages.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => setSelectedLanguage(lang)}
                            className="flex items-center gap-2 cursor-pointer focus:bg-white/10 focus:text-white"
                        >
                            <img
                                src={lang.flag}
                                alt={lang.name}
                                className="h-6 w-6 object-cover rounded-sm"
                            />
                            <span>{lang.name}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default Language
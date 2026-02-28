import { useTranslation } from "react-i18next"
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
    const { i18n } = useTranslation()
    const currentLangCode = i18n.language?.split('-')[0] || 'en'
    const selectedLanguage = languages.find(l => l.code === currentLangCode) || languages[1]

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
            <DropdownMenuContent className="w-56 bg-white backdrop-blur-xl border-slate-200 text-slate-600" align="end" forceMount>
                <DropdownMenuGroup>
                    {languages.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => i18n.changeLanguage(lang.code)}
                            className="flex items-center gap-2 cursor-pointer focus:bg-slate-100 focus:text-black"
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
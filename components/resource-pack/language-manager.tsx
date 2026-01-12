"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, FileJson } from "lucide-react"
import { LanguageFile } from "./types"

interface LanguageManagerProps {
    languages: LanguageFile[]
    onAdd: (lang: LanguageFile) => void
    onUpdate: (code: string, content: Record<string, string>) => void
    onDelete: (code: string) => void
}

const COMMON_LANGUAGES = [
    { code: "en_us", name: "English (US)" },
    { code: "ja_jp", name: "Japanese (Japan)" },
    { code: "fr_fr", name: "French (France)" },
    { code: "es_es", name: "Spanish (Spain)" },
    { code: "de_de", name: "German (Germany)" },
    { code: "ru_ru", name: "Russian (Russia)" },
    { code: "zh_cn", name: "Chinese (Simplified)" },
]

export function LanguageManager({ languages, onAdd, onUpdate, onDelete }: LanguageManagerProps) {
    const [selectedLang, setSelectedLang] = useState<string | null>(null)
    const [newLangCode, setNewLangCode] = useState("en_us")
    const [newKey, setNewKey] = useState("")
    const [newValue, setNewValue] = useState("")

    const activeLang = languages.find((l) => l.code === selectedLang)

    const handleAddLanguage = () => {
        if (languages.some((l) => l.code === newLangCode)) return
        const name = COMMON_LANGUAGES.find((l) => l.code === newLangCode)?.name || newLangCode
        onAdd({ code: newLangCode, name, content: {} })
        setSelectedLang(newLangCode)
    }

    const handleAddEntry = () => {
        if (!activeLang || !newKey) return
        onUpdate(activeLang.code, { ...activeLang.content, [newKey]: newValue })
        setNewKey("")
        setNewValue("")
    }

    const handleDeleteEntry = (key: string) => {
        if (!activeLang) return
        const newContent = { ...activeLang.content }
        delete newContent[key]
        onUpdate(activeLang.code, newContent)
    }

    return (
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Add Language</Label>
                    <div className="flex gap-2">
                        <Select value={newLangCode} onValueChange={setNewLangCode}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_LANGUAGES.map((l) => (
                                    <SelectItem key={l.code} value={l.code}>
                                        {l.name}
                                    </SelectItem>
                                ))}
                                <SelectItem value="custom">Custom...</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button size="icon" onClick={handleAddLanguage}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-1">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setSelectedLang(lang.code)}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${selectedLang === lang.code
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                }`}
                        >
                            <span>{lang.name}</span>
                            <Trash2
                                className="h-4 w-4 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(lang.code)
                                    if (selectedLang === lang.code) setSelectedLang(null)
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {activeLang ? (
                    <>
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="text-lg font-medium">{activeLang.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    assets/minecraft/lang/{activeLang.code}.json
                                </p>
                            </div>
                            <Button variant="outline" size="sm">
                                <FileJson className="mr-2 h-4 w-4" />
                                Import JSON
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                                <div className="space-y-2">
                                    <Label>Translation Key</Label>
                                    <Input
                                        placeholder="item.minecraft.diamond_sword"
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Translation Value</Label>
                                    <Input
                                        placeholder="Super Sword"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={handleAddEntry}>Add</Button>
                                </div>
                            </div>

                            <div className="rounded-md border">
                                <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b bg-muted/50 px-4 py-2 text-sm font-medium">
                                    <div>Key</div>
                                    <div>Value</div>
                                    <div></div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {Object.entries(activeLang.content).length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No translations yet
                                        </div>
                                    ) : (
                                        Object.entries(activeLang.content).map(([key, value]) => (
                                            <div
                                                key={key}
                                                className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b px-4 py-2 text-sm last:border-0 hover:bg-muted/50"
                                            >
                                                <div className="font-mono text-xs flex items-center">{key}</div>
                                                <div className="flex items-center">{value}</div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => handleDeleteEntry(key)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                        Select or add a language to start editing
                    </div>
                )}
            </div>
        </div>
    )
}

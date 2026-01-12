"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, FileCode } from "lucide-react"
import { ShaderFile } from "./types"

interface ShaderManagerProps {
    shaders: ShaderFile[]
    onAdd: (file: File, type: "vertex" | "fragment" | "program") => void
    onDelete: (id: string) => void
}

export function ShaderManager({ shaders, onAdd, onDelete }: ShaderManagerProps) {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "vertex" | "fragment" | "program") => {
        const file = e.target.files?.[0]
        if (file) {
            onAdd(file, type)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
                <div className="relative">
                    <input
                        type="file"
                        accept=".vsh"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileUpload(e, "vertex")}
                    />
                    <Button variant="secondary">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Vertex Shader (.vsh)
                    </Button>
                </div>
                <div className="relative">
                    <input
                        type="file"
                        accept=".fsh"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileUpload(e, "fragment")}
                    />
                    <Button variant="secondary">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Fragment Shader (.fsh)
                    </Button>
                </div>
                <div className="relative">
                    <input
                        type="file"
                        accept=".json"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileUpload(e, "program")}
                    />
                    <Button variant="secondary">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Program (.json)
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {shaders.map((shader) => (
                    <Card key={shader.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <FileCode className="h-4 w-4" />
                                    {shader.name}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => onDelete(shader.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="uppercase px-2 py-0.5 rounded bg-muted text-xs font-semibold">
                                    {shader.type}
                                </span>
                                <span>{shader.file ? `${shader.file.size} bytes` : shader.content ? `${shader.content.length} chars` : 'Empty'}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {shaders.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    No shaders added yet.
                </div>
            )}
        </div>
    )
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

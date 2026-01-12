"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useState } from "react"

interface ResourcePack {
  name: string
  description: string
  version: string
  format: number
  models: any[]
  textures: any[]
}

interface ResourcePackPreviewProps {
  resourcePack: ResourcePack
  language: string
}

export function ResourcePackPreview({ resourcePack, language }: ResourcePackPreviewProps) {
  const [copiedFile, setCopiedFile] = useState<string | null>(null)

  const generatePackMcmeta = () => {
    return {
      pack: {
        pack_format: resourcePack.format,
        description: resourcePack.description || resourcePack.name,
      },
    }
  }

  const generateModelFiles = () => {
    return resourcePack.models.map((model) => ({
      path: `assets/minecraft/models/item/${model.name.toLowerCase().replace(/\s+/g, "_")}.json`,
      content: {
        parent: model.parent,
        textures: model.textures,
        ...(model.elements && { elements: model.elements }),
      },
    }))
  }

  const copyToClipboard = async (content: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedFile(fileName)
      setTimeout(() => setCopiedFile(null), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  const packMcmeta = generatePackMcmeta()
  const modelFiles = generateModelFiles()

  return (
    <div className="space-y-6">
      <Card className="border-2 border-border bg-card">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-primary">
            {language === "ja" ? "リソースパックプレビュー" : "Resource Pack Preview"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-primary">pack.mcmeta</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(packMcmeta, null, 2), "pack.mcmeta")}
                className="border-2 border-border"
              >
                {copiedFile === "pack.mcmeta" ? (
                  <span className="text-secondary">{language === "ja" ? "コピー済み" : "Copied"}</span>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    {language === "ja" ? "コピー" : "Copy"}
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border-2 border-border font-mono">
              {JSON.stringify(packMcmeta, null, 2)}
            </pre>
          </div>

          <Separator className="bg-border" />

          <div>
            <h3 className="font-semibold mb-4 text-primary">{language === "ja" ? "モデルファイル" : "Model Files"}</h3>
            {modelFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border-2 border-border">
                <p>{language === "ja" ? "プレビューするモデルがありません" : "No models to preview"}</p>
                <p className="text-sm mt-1">
                  {language === "ja" ? "「モデル」タブでモデルを追加してください" : "Add models in the Models tab"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {modelFiles.map((file, index) => (
                  <div key={index} className="border-2 border-border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-muted border-b-2 border-border">
                      <Badge variant="outline" className="font-mono text-xs border-primary/30">
                        {file.path}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(file.content, null, 2), file.path)}
                        className="border-2 border-border"
                      >
                        {copiedFile === file.path ? (
                          <span className="text-secondary">{language === "ja" ? "コピー済み" : "Copied"}</span>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            {language === "ja" ? "コピー" : "Copy"}
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="bg-muted/30 p-4 text-sm overflow-x-auto font-mono">
                      {JSON.stringify(file.content, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          <div>
            <h3 className="font-semibold mb-4 text-primary">{language === "ja" ? "ファイル構造" : "File Structure"}</h3>
            <div className="bg-muted/30 p-4 rounded-lg border-2 border-border">
              <div className="font-mono text-sm space-y-1 text-foreground">
                <div className="text-primary font-semibold">📁 {resourcePack.name || "resource-pack"}/</div>
                <div className="ml-4 text-secondary">📄 pack.mcmeta</div>
                <div className="ml-4">📁 assets/</div>
                <div className="ml-8">📁 minecraft/</div>
                <div className="ml-12">📁 models/</div>
                <div className="ml-16">📁 item/</div>
                {modelFiles.map((file, index) => (
                  <div key={index} className="ml-20 text-secondary">
                    📄 {file.path.split("/").pop()}
                  </div>
                ))}
                <div className="ml-12">📁 textures/</div>
                <div className="ml-16">📁 item/</div>
                {resourcePack.textures.map((texture, index) => (
                  <div key={index} className="ml-20 text-accent">
                    🖼️ {texture.name}.png
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

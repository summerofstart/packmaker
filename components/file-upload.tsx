"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, ImageIcon, Cable as Cube } from "lucide-react"

interface FileUploadProps {
  onTextureUpload: (file: File) => void
  onBbmodelUpload?: (file: File, parsedData: any) => void
  language?: string
  disabled?: boolean
  accept?: string
  multiple?: boolean
  maxSize?: number
}

export function FileUpload({
  onTextureUpload,
  onBbmodelUpload,
  language = "en", // Default to English
  disabled = false,
  accept = "*/*",
  multiple = true,
  maxSize = 50 * 1024 * 1024,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }, [])

  const parseBbmodelFile = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const bbmodelData = JSON.parse(content)
          resolve(bbmodelData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error("ファイル読み込みエラー"))
      reader.readAsText(file)
    })
  }

  const processFiles = async (files: File[]) => {
    setIsProcessing(true)

    for (const file of files) {
      if (file.size > maxSize) {
        alert(`ファイル ${file.name} が大きすぎます。最大サイズは ${maxSize / 1024 / 1024}MB です`)
        continue
      }

      // .bbmodelファイルの処理
      if (file.name.toLowerCase().endsWith(".bbmodel")) {
        try {
          const bbmodelData = await parseBbmodelFile(file)

          // テクスチャを自動抽出
          if (bbmodelData.textures && Array.isArray(bbmodelData.textures)) {
            for (const texture of bbmodelData.textures) {
              if (texture.source && texture.source.startsWith("data:image/")) {
                // Base64画像をBlobに変換
                const response = await fetch(texture.source)
                const blob = await response.blob()
                const textureFile = new File([blob], texture.name || `texture_${Date.now()}.png`, { type: "image/png" })
                onTextureUpload(textureFile)
              }
            }
          }

          // .bbmodelデータをコールバック
          if (onBbmodelUpload) {
            onBbmodelUpload(file, bbmodelData)
          }
        } catch (error) {
          alert(`Blockbenchファイル ${file.name} の解析に失敗しました: ${error}`)
          continue
        }
      }
      // 通常のファイル処理
      else {
        onTextureUpload(file)
      }

      setUploadedFiles((prev) => [...prev, file])
    }

    setIsProcessing(false)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop()
    switch (extension) {
      case "bbmodel":
        return <Cube className="w-4 h-4 text-primary" />
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return <ImageIcon className="w-4 h-4 text-secondary" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles((prev) => prev.filter((file) => file !== fileToRemove))
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2 text-primary">File Upload</h3>
          <p className="text-muted-foreground mb-2">Drag & drop files or click to select</p>
          <div className="text-sm text-muted-foreground mb-4 space-y-1">
            <p>Supported formats:</p>
            <div className="flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Cube className="w-3 h-3 text-primary" />
                .bbmodel (Blockbench)
              </span>
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-secondary" />
                Image files
              </span>
            </div>
          </div>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={disabled}
          />
          <Button
            asChild
            variant="outline"
            disabled={isProcessing || disabled}
            className="border-2 border-border bg-transparent"
          >
            <label htmlFor="file-upload" className="cursor-pointer">
              {isProcessing ? "Processing..." : "Select Files"}
            </label>
          </Button>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-primary">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg border-2 border-border"
            >
              <div className="flex items-center gap-2">
                {getFileIcon(file.name)}
                <div>
                  <span className="text-sm font-medium text-primary">{file.name}</span>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeFile(file)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

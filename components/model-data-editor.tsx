"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ModelData {
  id: string
  name: string
  customModelData: number
  parent?: string
  textures: Record<string, string>
  elements?: any[]
  targetItem: string // Added targetItem property
  // New custom_model_data fields for Minecraft 1.21.4+
  customModelDataFloats?: number[]
  customModelDataFlags?: boolean[]
  customModelDataStrings?: string[]
  customModelDataColors?: string[] // RGB hex colors
}

interface TextureData {
  id: string
  name: string
  file: File | null
  path: string
}

interface ModelDataEditorProps {
  model: ModelData
  onUpdate: (updatedModel: Partial<ModelData>) => void
  onRemove: () => void
  availableTextures: TextureData[]
}

const MINECRAFT_ITEMS = [
  "stick",
  "diamond_sword",
  "iron_sword",
  "golden_sword",
  "stone_sword",
  "wooden_sword",
  "diamond_pickaxe",
  "iron_pickaxe",
  "golden_pickaxe",
  "stone_pickaxe",
  "wooden_pickaxe",
  "diamond_axe",
  "iron_axe",
  "golden_axe",
  "stone_axe",
  "wooden_axe",
  "diamond_shovel",
  "iron_shovel",
  "golden_shovel",
  "stone_shovel",
  "wooden_shovel",
  "diamond_hoe",
  "iron_hoe",
  "golden_hoe",
  "stone_hoe",
  "wooden_hoe",
  "bow",
  "crossbow",
  "trident",
  "shield",
  "fishing_rod",
  "carrot_on_a_stick",
  "apple",
  "golden_apple",
  "enchanted_golden_apple",
  "bread",
  "cooked_beef",
  "cooked_porkchop",
  "diamond",
  "emerald",
  "gold_ingot",
  "iron_ingot",
  "coal",
  "redstone",
  "ender_pearl",
  "blaze_rod",
  "ghast_tear",
  "nether_star",
  "dragon_egg",
  "clock",
  "compass",
  "map",
  "filled_map",
  "book",
  "written_book",
  "enchanted_book",
  "potion",
  "splash_potion",
  "lingering_potion",
  "glass_bottle",
  "experience_bottle",
  "totem_of_undying",
  "elytra",
  "firework_rocket",
  "firework_star",
]

export function ModelDataEditor({ model, onUpdate, onRemove, availableTextures }: ModelDataEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTextureKey, setNewTextureKey] = useState("")
  const [newFloat, setNewFloat] = useState("")
  const [newString, setNewString] = useState("")
  const [newColor, setNewColor] = useState("#ffffff")

  const parentOptions = [
    "item/generated",
    "item/handheld",
    "block/cube_all",
    "block/cube",
    "block/orientable",
    "builtin/entity",
  ]

  const addTexture = () => {
    if (newTextureKey && !model.textures[newTextureKey]) {
      onUpdate({
        textures: {
          ...model.textures,
          [newTextureKey]: "",
        },
      })
      setNewTextureKey("")
    }
  }

  const updateTexture = (key: string, value: string) => {
    onUpdate({
      textures: {
        ...model.textures,
        [key]: value,
      },
    })
  }

  const removeTexture = (key: string) => {
    const newTextures = { ...model.textures }
    delete newTextures[key]
    onUpdate({ textures: newTextures })
  }

  const addFloat = () => {
    if (newFloat && !isNaN(Number(newFloat))) {
      const currentFloats = model.customModelDataFloats || []
      onUpdate({
        customModelDataFloats: [...currentFloats, Number(newFloat)],
      })
      setNewFloat("")
    }
  }

  const removeFloat = (index: number) => {
    const currentFloats = model.customModelDataFloats || []
    onUpdate({
      customModelDataFloats: currentFloats.filter((_, i) => i !== index),
    })
  }

  const addFlag = () => {
    const currentFlags = model.customModelDataFlags || []
    onUpdate({
      customModelDataFlags: [...currentFlags, false],
    })
  }

  const updateFlag = (index: number, value: boolean) => {
    const currentFlags = model.customModelDataFlags || []
    const newFlags = [...currentFlags]
    newFlags[index] = value
    onUpdate({
      customModelDataFlags: newFlags,
    })
  }

  const removeFlag = (index: number) => {
    const currentFlags = model.customModelDataFlags || []
    onUpdate({
      customModelDataFlags: currentFlags.filter((_, i) => i !== index),
    })
  }

  const addString = () => {
    if (newString.trim()) {
      const currentStrings = model.customModelDataStrings || []
      onUpdate({
        customModelDataStrings: [...currentStrings, newString.trim()],
      })
      setNewString("")
    }
  }

  const removeString = (index: number) => {
    const currentStrings = model.customModelDataStrings || []
    onUpdate({
      customModelDataStrings: currentStrings.filter((_, i) => i !== index),
    })
  }

  const addColor = () => {
    const currentColors = model.customModelDataColors || []
    onUpdate({
      customModelDataColors: [...currentColors, newColor],
    })
  }

  const removeColor = (index: number) => {
    const currentColors = model.customModelDataColors || []
    onUpdate({
      customModelDataColors: currentColors.filter((_, i) => i !== index),
    })
  }

  return (
    <Card className="border-2 border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-primary" />
                )}
                <div>
                  <CardTitle className="text-lg text-primary">{model.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-primary/30">
                      CMD: {model.customModelData}
                    </Badge>
                    <Badge variant="secondary">{model.parent}</Badge>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                      {model.targetItem}
                    </Badge>
                    {model.elements && model.elements.length > 0 && (
                      <Badge variant="outline" className="border-primary/30">
                        {model.elements.length} Elements
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`model-name-${model.id}`}>Model Name</Label>
                <Input
                  id={`model-name-${model.id}`}
                  value={model.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className="border-2 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`model-cmd-${model.id}`}>Custom Model Data</Label>
                <Input
                  id={`model-cmd-${model.id}`}
                  type="number"
                  min="0"
                  value={model.customModelData ?? ""}
                  onChange={(e) => {
                    const value = e.target.value
                    const numValue = value === "" ? 0 : Number.parseInt(value)
                    if (!isNaN(numValue) && numValue >= 0) {
                      onUpdate({ customModelData: numValue })
                    }
                  }}
                  className="border-2 border-border"
                />
                <p className="text-xs text-muted-foreground">Use 0 to override the base item model</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`model-target-${model.id}`}>Target Item</Label>
              <Input
                id={`model-target-${model.id}`}
                value={model.targetItem}
                onChange={(e) => onUpdate({ targetItem: e.target.value })}
                placeholder="Enter item name (e.g., stick, diamond_sword)"
                className="font-mono text-sm border-2 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`model-parent-${model.id}`}>Parent Model</Label>
              <Select value={model.parent} onValueChange={(value) => onUpdate({ parent: value })}>
                <SelectTrigger className="border-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {parentOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 border-t-2 border-border pt-4">
              <Label className="text-base font-semibold text-primary">Extended Custom Model Data (1.21.4+)</Label>

              {/* Floats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Floats</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={newFloat}
                      onChange={(e) => setNewFloat(e.target.value)}
                      className="w-24 border-2 border-border"
                    />
                    <Button onClick={addFloat} size="sm" className="bg-secondary hover:bg-secondary/90">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(model.customModelDataFloats || []).map((float, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1 border-primary/30">
                      {float}
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeFloat(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Flags</Label>
                  <Button onClick={addFlag} size="sm" className="bg-secondary hover:bg-secondary/90">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(model.customModelDataFlags || []).map((flag, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border-2 border-border rounded">
                      <Checkbox checked={flag} onCheckedChange={(checked) => updateFlag(index, checked as boolean)} />
                      <span className="text-sm">{flag.toString()}</span>
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeFlag(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Strings</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter string"
                      value={newString}
                      onChange={(e) => setNewString(e.target.value)}
                      className="w-32 border-2 border-border"
                    />
                    <Button onClick={addString} size="sm" className="bg-secondary hover:bg-secondary/90">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(model.customModelDataStrings || []).map((string, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1 border-primary/30">
                      "{string}"
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeString(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Colors</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-16 h-8 border-2 border-border"
                    />
                    <Button onClick={addColor} size="sm" className="bg-secondary hover:bg-secondary/90">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(model.customModelDataColors || []).map((color, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-2 border-primary/30">
                      <div className="w-4 h-4 rounded border-2 border-border" style={{ backgroundColor: color }} />
                      {color}
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeColor(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Textures</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Texture key (e.g., layer0)"
                    value={newTextureKey}
                    onChange={(e) => setNewTextureKey(e.target.value)}
                    className="w-40 border-2 border-border"
                  />
                  <Button onClick={addTexture} size="sm" className="bg-secondary hover:bg-secondary/90">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {Object.entries(model.textures).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Label className="w-20 text-sm">{key}:</Label>
                  <Select value={value} onValueChange={(newValue) => updateTexture(key, newValue)}>
                    <SelectTrigger className="flex-1 border-2 border-border">
                      <SelectValue placeholder="Select texture" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTextures.map((texture) => (
                        <SelectItem key={texture.id} value={texture.path}>
                          {texture.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTexture(key)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {Object.keys(model.textures).length === 0 && (
                <p className="text-sm text-muted-foreground">No textures assigned. Add a texture key to get started.</p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

# 🎨 MARV - Minecraft Resource Pack Maker

A powerful, modern web-based tool for creating Minecraft Java Edition resource packs with advanced features for custom models, fonts, textures, and more.



## ✨ Latest Features

### 🆕 Custom Model Data = 0 Support
- **Override base item models** without requiring NBT data
- Perfect for texture packs that change default item appearances
- Full validation support for CMD values from 0 to infinity

### 🎯 Revolutionary Font Manager
Based on community best practices from the Minecraft modding community:

#### Quick Start Presets
- **🖼️ GUI Overlay**: Custom container GUIs with perfect alignment
- **🩸 Bleeding Effect**: Full-screen overlays for damage/transitions
- **⭐ Icon Set**: Inline text icons (armor, hearts, symbols)
- **✨ Particle Display**: Custom particles using text_display entities

#### Unicode Helper Tool
- Safe unicode range selection (Private Use Area)
- Visual character preview
- One-click copy functionality
- Hex to unicode conversion

#### Enhanced Provider Management
- **Bitmap Provider**: PNG textures with height/ascent control
- **Space Provider**: Negative advances for GUI alignment
- **TTF Provider**: Custom font files with advanced options

## 🚀 Features

### Core Functionality
- ✅ **Item Models**: Create custom models with custom_model_data (including 0!)
- ✅ **Textures**: Upload, manage, and optimize textures
- ✅ **Custom Fonts**: Advanced font system with presets
- ✅ **Sounds**: Custom sound events and categories
- ✅ **Particles**: Custom particle definitions
- ✅ **Shaders**: Shader file management
- ✅ **Languages**: Multi-language support

### Advanced Features
- 🎯 **BBModel Import**: Import Blockbench models (.bbmodel)
- 🔄 **Pack Merging**: Combine multiple resource packs
- 🌍 **Multi-Version**: Generate packs for multiple Minecraft versions
- 🎮 **Geyser Support**: Bedrock edition compatibility via Geyser mappings
- 📦 **ZIP Export**: One-click resource pack generation

### User Experience
- 🎨 **Modern UI**: Clean, intuitive interface with dark mode
- 🌐 **Bilingual**: English and Japanese support
- 📱 **Responsive**: Works on desktop and mobile
- 💾 **Auto-save**: Never lose your work
- 🔍 **Validation**: Real-time error checking

## 📚 Documentation

- [**INNOVATION_SUMMARY.md**](./INNOVATION_SUMMARY.md) - Quick overview of new features
- [**FONT_FEATURES.md**](./FONT_FEATURES.md) - Complete font system guide

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS
- **Components**: Radix UI + shadcn/ui
- **Language**: TypeScript
- **Build**: Turbopack
- **Deployment**: Static export

## 🏃 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/MARVserver/packmaker.git
cd resource-pack-maker

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm start
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
```
The static site will be generated in the `out/` directory.

## 📖 Usage Guide

### Creating Your First Resource Pack

1. **General Settings**
   - Set pack name and description
   - Choose Minecraft version (format)
   - Add author info and license

2. **Add Models**
   - Click "Add Model"
   - Set custom_model_data (0 or higher)
   - Choose target item
   - Upload textures

3. **Create Custom Fonts** (New!)
   - Use Quick Start Presets for common use cases
   - Or create custom font definitions
   - Upload PNG images or TTF files
   - Configure providers (bitmap, space, ttf)

4. **Export**
   - Click "Download ZIP"
   - Install in Minecraft's resourcepacks folder
   - Enjoy!

### Font Examples

#### GUI Overlay
```json
{
  "providers": [
    { "type": "space", "advances": { "\uE000": -8 } },
    { "type": "bitmap", "file": "namespace:font/gui.png", "ascent": 10, "height": 80, "chars": ["\uE001"] }
  ]
}
```
Usage: `/setblock ~ ~ ~ barrel{CustomName:'{"color":"white","text":"\\uE000\\uE001"}'}`

#### Screen Effect
```json
{
  "providers": [
    { "type": "bitmap", "file": "namespace:font/blood.png", "ascent": 64, "height": 128, "chars": ["\uE002"] }
  ]
}
```
Usage: `/title @s title "\uE002"`

## 🎓 Best Practices

### Custom Model Data
- Use **0** for base item overrides
- Use **1+** for variant models
- Keep CMD values sequential for organization

### Custom Fonts
- Start unicode at **U+E000** (Private Use Area)
- Use **negative space** for GUI alignment
- Add **§f** before icons to prevent color tinting
- Document your unicode mappings

### File Organization
- Name files descriptively
- Use consistent naming conventions
- Keep related assets together

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📜 License

MIT License

## 🙏 Credits

### Inspiration
- **Qiita Article**: "カスタムフォントで彩を" by Acryle
  - https://qiita.com/Acryle/items/d2d58359b55bd5ece6a0
  - Excellent guide on Minecraft custom fonts

### Technologies
- Next.js Team
- Radix UI Team
- shadcn/ui
- Tailwind CSS Team

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the documentation files
- Review the example presets

## 🗺️ Future Plans

### Planned for 2.1.0
- [ ] Animation editor for textures
- [ ] 3D model preview
- [ ] More font presets (damage indicators, boss bars, etc.)
- [ ] Font preview system
- [ ] Unicode character library

### Planned for 3.0.0
- [ ] Collaborative editing
- [ ] Cloud storage integration
- [ ] Advanced shader editor
- [ ] Real-time Minecraft preview
- [ ] Template marketplace

---

**Made with ❤️ for the Minecraft community**

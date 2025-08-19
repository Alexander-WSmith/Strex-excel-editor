# Strex Excel Editor - React Version

A modern, cross-platform Excel editor built with React, TypeScript, and Vite. This application provides advanced Excel editing capabilities with auto-save, column locking, performance optimization, and multiple distribution options.

## 🚀 Features

- **📁 Excel File Support**: Upload and edit .xlsx/.xls files with drag & drop
- **🎨 Formatting Preservation**: Maintains all original Excel formatting (colors, fonts, borders)
- **🔍 Advanced Search**: Real-time filtering across first two columns
- **🔒 Column Locking**: Configure read-only columns (0-10 columns)
- **📄 Pagination**: Optimized performance with 30 rows per page
- **💾 Persistent Storage**: Data persists across page reloads using localStorage
- **📤 Multiple Export Options**: Excel, PDF, Email sharing, and Print
- **⚡ Performance Caching**: Intelligent column width and search caching
- **🎨 Modern UI**: Clean, responsive design with Tailwind CSS and dark mode
- **🖥️ Cross-platform**: Web app, PWA, and Electron desktop versions

## 📋 Prerequisites

Before setting up the project, you need to install Node.js and npm:

### Windows Installation:
1. **Download Node.js**: Go to [nodejs.org](https://nodejs.org/) and download the LTS version
2. **Run the installer**: Follow the installation wizard
3. **Verify installation**: Open Command Prompt or PowerShell and run:
   ```bash
   node --version
   npm --version
   ```

### macOS Installation:
```bash
# Using Homebrew (recommended)
brew install node

# Or download from nodejs.org
```

### Linux Installation:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# CentOS/RHEL/Fedora
sudo dnf install nodejs npm
```

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Alexander-WSmith/Strex-excel-editor.git
   cd Strex-excel-editor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**: Navigate to `http://localhost:5173`

## 📦 Distribution Options

### 1. Web Application (Password Protected)
- Deploy to any web hosting service
- Built-in password protection capability
- Progressive Web App (PWA) support for offline use

### 2. Desktop Application (Electron)
```bash
# Build desktop app for current platform
npm run build-electron

# Build for all platforms
npm run dist
```

### 3. Standalone Web Files
```bash
# Build static files for distribution
npm run build
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (web) |
| `npm run preview` | Preview production build |
| `npm run electron` | Run Electron desktop app |
| `npm run electron-dev` | Development mode with Electron |
| `npm run build-electron` | Build Electron app |
| `npm run dist` | Create distribution packages |

## 📱 Cross-Platform Support

### Desktop Apps:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` package  
- **Linux**: `.AppImage` package

### Web Deployment:
- **Static hosting**: Netlify, Vercel, GitHub Pages
- **Server hosting**: Any web server with HTTPS
- **PWA**: Install as desktop app from browser

## 🔐 Password Protection Setup

For password-protected deployment, modify the authentication configuration in `src/components/AuthGuard.tsx`:

```typescript
const AUTH_CONFIG = {
  enabled: true,
  password: "your-secure-password",
  sessionTimeout: 60 // minutes
};
```

## 🎯 Usage

1. **Upload Excel File**: Drag & drop or click to browse for .xlsx/.xls files
2. **Edit Cells**: Click any cell to edit (respects column locking settings)
3. **Search Data**: Use the search bar to filter rows in real-time
4. **Navigate Pages**: Use pagination controls at the bottom
5. **Export Options**: Click "Export" for multiple format options:
   - **Excel**: Download with all formatting preserved
   - **PDF**: Professional document with table formatting
   - **Email**: Share file as attachment via email client
   - **Print**: Generate print-ready document
6. **Load New File**: Use "Load New File" button with save confirmation
7. **Configure Options**: Click "Options" gear icon for settings

## ⚙️ Configuration

### Performance Settings:
- Rows per page: 30 (adjustable in options)
- Cache expiry: 30 minutes
- Auto-save interval: 5 minutes

### Column Locking:
- Enable/disable in options panel
- Configure 0-10 locked columns
- Locked columns appear read-only

## 🏗️ Architecture

```
src/
├── components/          # React components
│   ├── FileUploader.tsx    # File upload with drag & drop
│   ├── ExcelGrid.tsx       # Main data grid
│   ├── SearchBar.tsx       # Search functionality
│   ├── OptionsPanel.tsx    # Settings panel
│   └── StatusBar.tsx       # Status and pagination
├── hooks/              # Custom React hooks
│   ├── useExcelData.ts     # Excel file operations
│   ├── useAutoSave.ts      # Auto-save functionality
│   ├── useCache.ts         # Performance caching
│   └── useToast.ts         # Notifications
├── types.ts            # TypeScript type definitions
└── App.tsx            # Main application component
```

## 🔄 Migration from Python Version

This React version maintains all features from the original Python/Kivy application:

- ✅ Persistent data storage (localStorage instead of auto-save files)
- ✅ Excel formatting preservation (enhanced with buffer-based saving)
- ✅ Column locking (configurable 0-10 columns)
- ✅ Advanced search and filtering
- ✅ Performance optimization with caching
- ✅ Pagination (30 rows per page)
- ✅ Multiple export formats (Excel, PDF, Email, Print)
- ✅ Cross-platform distribution

## 🆕 Recent Updates

### Version 2.0 Features:
- **🎨 Excel Formatting Preservation**: Complete preservation of colors, fonts, borders, and cell styles
- **📄 Professional PDF Export**: Enhanced PDF generation with original Excel styling
- **📧 Email File Sharing**: Attach Excel files to emails instead of plain text
- **🖨️ Improved Print Function**: Professional HTML layout with proper formatting
- **🗂️ Load New File Feature**: Save confirmation workflow when switching files
- **💾 Data Persistence**: All changes persist across browser sessions
- **🎯 Streamlined Interface**: Removed CSV export for cleaner user experience

## 🐛 Troubleshooting

### Common Issues:

1. **"npx not recognized"**: Install Node.js first
2. **Port 5173 in use**: Close other applications or change port in `vite.config.ts`
3. **Build errors**: Run `npm install` to ensure all dependencies are installed
4. **Excel files not loading**: Ensure files are .xlsx or .xls format

### Performance Tips:
- Use search to filter large datasets
- Enable caching in options for better performance
- Reduce rows per page for very large files

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all dependencies are installed correctly
3. Ensure Node.js version is 16 or higher

## 🚀 Next Steps After Installation

1. **Test the application**: Upload a sample Excel file to see formatting preservation
2. **Try export options**: Test PDF generation and email sharing features
3. **Configure settings**: Adjust rows per page and column locking in options
4. **Test persistence**: Make changes, reload page, and see data preserved
5. **Create desktop app**: Use `npm run build-electron` for standalone application
6. **Deploy**: Choose your preferred distribution method (web, PWA, or desktop)

---

**Ready to start?** Clone the repository, run `npm install`, then `npm run dev` to begin!

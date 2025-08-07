# Copilot Instructions for Strex React Excel Editor

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a React TypeScript Excel editor application project with the following characteristics:

## Project Overview
- **Technology Stack**: React 18 + TypeScript + Vite
- **Purpose**: Advanced Excel file editor with cross-platform distribution
- **Target**: Desktop and web deployment with password protection options

## Key Features to Maintain
1. **Excel File Processing**: Upload/download .xlsx/.xls files with data type preservation
2. **Advanced Search**: Real-time filtering across first two columns with caching
3. **Column Locking**: Configurable read-only columns (0-10 columns)
4. **Performance Optimization**: Pagination (30 rows/page), intelligent caching
5. **Auto-save**: Local storage persistence every 5 minutes
6. **Cross-platform**: Electron desktop app + PWA web app

## Code Guidelines
- Use TypeScript for type safety
- Implement proper error handling for file operations
- Use React hooks for state management
- Optimize for performance with useMemo and useCallback
- Maintain responsive design for tablets and desktop
- Follow React best practices for component structure

## Distribution Requirements
- Electron packaging for desktop (.exe, .dmg, .AppImage)
- PWA configuration for web deployment
- Password protection capability
- Offline functionality with local storage

## Excel Data Handling
- Preserve data types (numbers as numbers, text as text)
- Handle large files (up to 500+ rows) efficiently
- Maintain data integrity during edits
- Support common Excel formats and features

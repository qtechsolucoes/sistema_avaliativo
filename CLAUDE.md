# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Portuguese educational assessment platform (Plataforma de Avaliações) built with vanilla JavaScript, HTML, and CSS. It provides both online and offline assessment capabilities with student authentication, question display, drag-and-drop activities, and teacher dashboard functionality.

## Architecture

### Core Structure
- **Frontend-only application**: No build system, runs directly in browser using ES6 modules
- **Supabase integration**: Online database connectivity with offline fallback
- **Modular design**: Organized into services, utilities, and feature modules
- **State management**: Centralized state in `src/state.js`
- **Screen-based navigation**: Multiple views managed through `src/navigation.js`

### Key Modules
- `src/main.js` - Application entry point with initialization, session management, and performance monitoring
- `src/state.js` - Global state management and DOM element references
- `src/login.js` - Student authentication and selection flow
- `src/quiz.js` - Assessment interface and question display
- `src/teacher/` - Teacher area with dashboard, offline generator, and data sync
- `src/services/` - Data access layer with online/offline switching
- `src/utils/` - Shared utilities and validators

### Database Integration
- **Online**: Supabase client in `src/services/supabaseClient.js`
- **Offline**: Mock data service in `src/services/mockDataService.js`
- **Abstraction**: Data service layer automatically switches between online/offline modes

## Development

### Running the Application
```bash
# Serve files from a local HTTP server (required for ES6 modules)
python -m http.server 8000
# OR
php -S localhost:8000
# OR
npx http-server .
```

Access at: `http://localhost:8000`

### Testing
```bash
# Run tests (if test runner is set up)
# Note: Currently only has example test file - no test runner configured
```

### Configuration
- Supabase credentials in `src/config.js`
- Admin passwords in `src/main.js` (APP_CONFIG object)
- Environment variables in `.env` (currently empty)

### Key Features
- **Student Flow**: Year/Class/Student selection → Assessment → Results
- **Teacher Flow**: Offline file generation, result sync, dashboard analytics
- **Adaptive Assessments**: Special UI for students with specific needs
- **Device Locking**: Prevents reuse after assessment completion
- **Session Management**: Automatic timeout and progress saving
- **Drag-and-Drop**: Alternative assessment format for younger students

### File Dependencies
- External CDNs: TailwindCSS, Chart.js, Supabase client, Heroicons
- Local styles: `styles/main.css`
- No package.json or build system

### Debug Mode
- Enable with `Ctrl+Shift+D` or `localStorage.setItem('debugMode', 'true')`
- Provides performance monitoring, state inspection, and logging
- Access debug tools via `window.debugApp` in browser console

### Data Flow and Integration
- **Real Data**: Application now connects to Supabase for live data
- **Smart Fallback**: Automatically switches to mock data if Supabase unavailable
- **Connection Testing**: Tests connectivity on startup and during operations
- **Unified Service**: All data access through `src/services/dataService.js`

### Security Improvements
- **Safe Authentication**: Hash-based password system with rate limiting
- **XSS Prevention**: All user input sanitized, no innerHTML usage
- **State Consistency**: Centralized state management prevents mutations
- **Error Handling**: Secure error reporting without exposing sensitive data

### Configuration
- **Environment Variables**: Secure credential management
- **Debug Tools**: Comprehensive debugging tools in development mode
- **Performance Monitoring**: Memory and operation tracking

### Important Notes
- Application automatically locks devices after assessment completion
- Prioritizes Supabase data over mock data when available
- All navigation happens through `showScreen()` function
- State changes use `updateState()` to maintain consistency
- Error handling centralized and secure
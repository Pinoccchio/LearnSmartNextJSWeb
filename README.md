# LearnSmart Web Application

A clean, organized Next.js web application for the LearnSmart educational platform. This is a frontend-only application with mock data for demonstration purposes.

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   └── login/page.tsx        # Login page
│   ├── (dashboard)/              # Dashboard pages
│   │   ├── admin/                # Admin dashboard pages
│   │   │   ├── page.tsx          # Admin dashboard
│   │   │   ├── analytics/page.tsx
│   │   │   ├── courses/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── layout.tsx
│   │   └── instructor/           # Instructor dashboard pages
│   │       ├── page.tsx          # Instructor dashboard
│   │       ├── analytics/page.tsx
│   │       ├── courses/page.tsx
│   │       ├── students/page.tsx
│   │       └── layout.tsx
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # UI components
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   └── common/                   # Common app components (empty for now)
├── contexts/                     # React contexts
│   └── auth-context.tsx          # Simple mock authentication
├── lib/                          # Utilities
│   ├── constants.ts              # Colors, mock data
│   └── utils.ts                  # Utility functions
└── styles/                       # Global styles
    └── globals.css               # Global CSS
```

## 🎯 Key Features

### Simple & Clean
- **Frontend-only**: No backend dependencies, pure client-side
- **Mock data**: Static data for demonstration
- **Clean organization**: Files organized logically by feature
- **Existing code only**: No unnecessary complexity added

### Authentication
- Simple mock authentication with localStorage
- Role-based access (admin/instructor)
- Automatic login for demo purposes

### Dashboards
- **Admin Dashboard**: User stats, course overview, activity feed
- **Instructor Dashboard**: Course management, student tracking
- Responsive design with Tailwind CSS
- Uses mock data from constants file

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Design System

### Colors (from Flutter app)
- Primary: `#2563eb` (Blue)
- Secondary: `#f8fafc` (Light background)  
- Light: `#ffffff` (Alternative light background)

### Components
- Built with Tailwind CSS
- Radix UI components (button, card, input, label)
- Responsive design
- Clean, minimal styling

## 📊 Mock Data

All data is static and defined in `lib/constants.ts`:
- Dashboard statistics
- Recent activities
- Course information
- User data

No API calls or backend dependencies.

## 🔒 Authentication

Simple mock authentication:
- Always successful login
- Stores user in localStorage
- Role-based routing
- Quick role switching for demo

## 📱 Responsive Design

- Mobile-first approach with Tailwind CSS
- Responsive grid layouts
- Clean, minimal interface
- Touch-friendly on mobile

## 🎯 What This Is

This is a **simplified, frontend-only** reorganization of the existing Next.js web app:

✅ **What we kept:**
- Existing page structure and layouts
- Original UI components
- Basic authentication flow
- Dashboard functionality

✅ **What we improved:**
- Better folder organization
- Centralized mock data
- Simplified imports
- Cleaner code structure

❌ **What we removed:**
- Complex API layer
- Backend integration code
- Unnecessary type definitions
- Over-engineered components

## 🚀 Future Development

Ready for enhancement:
- Connect to real backend API
- Add proper authentication
- Implement real data fetching
- Add more interactive features
- Expand component library

This structure provides a clean foundation that matches the organization quality of your Flutter app while keeping things simple and focused on frontend-only functionality.
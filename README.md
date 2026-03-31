# 🏠 Colivio - Shared Living Made Simple

A comprehensive SaaS application for managing shared living spaces, built with React, TypeScript, and Supabase.

---

## ⚡ Quick Start (Automated)

If you are on Windows, you can set up the entire project (dependencies + tests) in one click:

1.  **Clone the repository**
2.  **Run `setup.bat`** (Double-click or run in terminal)
3.  **Start Dev Server**: `npm run dev`

For other platforms or manual setup, see [REQUIREMENTS.md](./REQUIREMENTS.md).

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure signup and login with Supabase Auth
- Password validation (8+ characters, uppercase, number)
- Session persistence across page reloads
- Role-based access control (Admin/Member)

### 🏠 Room Management
- Create private rooms for your living space
- Generate unique invite codes (8 characters)
- Join existing rooms with invite codes
- View and manage room members
- Leave room functionality

### 🍽️ Meal Planning
- Weekly meal planner (Monday - Sunday)
- Breakfast, Lunch, Dinner tracking
- Save and reset meal plans
- Persistent storage in database

### ✅ Task Management
- Create and assign tasks to roommates
- Set deadlines and recurring schedules
- Mark tasks as complete
- Filter by all, today, or this week
- Edit and delete tasks

### 💰 Expense Tracking
- Track shared expenses
- Split bills among roommates
- Record who paid and when
- Calculate individual shares

### 💳 Bill Management
- Track recurring bills (rent, utilities, etc.)
- Set due dates
- Mark bills as paid/pending
- Monthly bill tracking

### 👔 Personnel Management
- Manage service staff (maid, cook, etc.)
- Track daily attendance
- Record monthly compensation
- Payment history tracking

### 📊 Analytics Dashboard
- Visual charts and graphs
- Expense trends
- Task completion rates
- Bill payment status
- Attendance summaries

## 🚀 Tech Stack

- **Frontend**: React 18.3, TypeScript, Vite
- **Backend**: Supabase Edge Functions (Deno + Hono)
- **Database**: Supabase KV Store
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **Notifications**: Sonner

## 📁 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── analytics/        # Analytics dashboard
│   │   │   ├── auth/             # Login, Signup, ForgotPassword
│   │   │   ├── bills/            # Bill management
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── expenses/         # Expense tracking
│   │   │   ├── layout/           # MainLayout with navigation
│   │   │   ├── meals/            # Meal planner
│   │   │   ├── personnel/        # Personnel management
│   │   │   ├── profile/          # User profile
│   │   │   ├── room/             # Room management
│   │   │   ├── tasks/            # Task management
│   │   │   └── ui/               # Reusable UI components
│   │   ├── context/
│   │   │   └── AppContext.tsx    # Global state management
│   │   ├── services/
│   │   │   └── api.ts            # API service layer
│   │   ├── routes.tsx            # React Router configuration
│   │   └── App.tsx               # Main app component
│   └── styles/                   # Global styles
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx         # Backend API server
│           └── kv_store.tsx      # Database utilities
└── utils/
    └── supabase/
        └── info.tsx              # Supabase configuration
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ or Bun
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd colivio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📖 Usage Guide

### Getting Started

1. **Sign Up**
   - Navigate to the signup page
   - Enter your name, email, and password
   - Password must be 8+ characters with at least 1 uppercase letter and 1 number

2. **Create or Join a Room**
   - **Create**: Enter a room name and get an invite code
   - **Join**: Enter an existing room's invite code

3. **Start Managing**
   - Add meals for the week
   - Create and assign tasks
   - Track expenses and bills
   - Manage service personnel

### Multi-User Collaboration

1. Share your room's invite code with roommates
2. They sign up and join using the code
3. All members can view and manage shared data
4. Admins have additional permissions

### Room Roles

- **Admin**: Can create the room, full access to all features
- **Member**: Can view and contribute to room data

## 🔒 Security

- ✅ Password validation and secure storage
- ✅ Token-based authentication
- ✅ Authorization on all API endpoints
- ✅ Room-based data isolation
- ✅ Service role key protected (never exposed to frontend)

## 📊 Database Structure

All data is stored in Supabase KV Store with the following key patterns:

```
user:{userId}:room                  → User's current room ID
room:{roomId}                       → Room data with members
room:code:{inviteCode}              → Room ID lookup
meal:{roomId}:{mealId}              → Meal plans
task:{roomId}:{taskId}              → Tasks
expense:{roomId}:{expenseId}        → Expenses
bill:{roomId}:{billId}              → Bills
personnel:{roomId}:{personId}       → Service personnel
attendance:{roomId}:{attendanceId}  → Attendance records
payment:{roomId}:{paymentId}        → Payment records
```

## 🎨 Branding

- **Name**: Colivio (Collaborative + Living)
- **Tagline**: Shared living made simple
- **Primary Color**: Indigo (#4F46E5)
- **Design**: Modern, clean, mobile-first

## 📱 Responsive Design

- **Mobile First**: Optimized for phones and tablets
- **Desktop**: Full sidebar navigation
- **Tablet**: Collapsible menu
- **Mobile**: Bottom tab bar navigation

## 🚀 Deployment

The application is deployed on Supabase with:
- Frontend: Vite build
- Backend: Supabase Edge Functions
- Database: Supabase KV Store
- Auth: Supabase Auth

## 📚 Documentation

- [Complete Integration Guide](./COLIVIO_COMPLETE_GUIDE.md) - Comprehensive guide
- [Database Integration](./DATABASE_INTEGRATION.md) - Backend setup details
- [Migration Snippets](./MIGRATION_SNIPPETS.md) - Code examples for updates

## 🛠️ Development Status

### ✅ Completed
- Backend API with all endpoints
- Authentication system
- Room management
- Meal planning (with API)
- Task management (with API)
- Layout and navigation
- Branding updates

### 🔄 In Progress
- Expense tracker API integration
- Bill manager API integration
- Personnel manager API integration

### 📋 To Do
- Real-time updates with Supabase Realtime
- Email notifications
- Advanced analytics
- Image uploads
- Push notifications

## 🤝 Contributing

1. Follow the established patterns
2. Add proper error handling
3. Include loading states
4. Test with multiple users
5. Update documentation

## 📝 License

MIT License - feel free to use for personal or commercial projects

## 💡 Support

For questions or issues:
- Check the documentation in `/COLIVIO_COMPLETE_GUIDE.md`
- Review code examples in `/MIGRATION_SNIPPETS.md`
- Examine working components (MealPlanner, TaskManager)

## 🙏 Acknowledgments

Built with:
- React + TypeScript
- Supabase
- Tailwind CSS
- Radix UI
- Recharts
- Lucide Icons

---

**Made with ❤️ for better shared living experiences**

*Version 1.0.0 - March 24, 2026*

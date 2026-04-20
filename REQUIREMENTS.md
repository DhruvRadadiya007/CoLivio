# 🛠️ Colivio Project Requirements

This document outlines everything you need to install and configure to run, test, and develop the Colivio project.

## 💻 Software Prerequisites

| Requirement | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | 18.x or higher | Runtime for the React frontend |
| **npm** | 9.x or higher | Package management (or use `pnpm`/`yarn`) |
| **Supabase CLI** | Latest | Managing backend Edge Functions |
| **Git** | Latest | Version control |

## 📦 Project Dependencies

The project uses several key libraries that will be installed automatically with `npm install`:

- **UI Framework**: React 18.3 (Vite)
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Backend Services**: Supabase JS SDK
- **Charts**: Recharts
- **Testing**: Vitest (for automated unit tests)

## 🔑 Configuration Requirements

You must have a Supabase project set up. Ensure the following match your project:

- **Project ID**: `xxhiqqamjhkhbykmehnr`
- **Configuration File**: `utils/supabase/info.tsx` (Should contain your Project ID and Public Anon Key)

## 🚀 Quick Run Commands

Once prerequisites are met, use these commands:

```bash
# 1. Install all dependencies
npm install

# 2. Run automated tests (Unit tests)
npm test

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

## 🧪 Automated Testing Standards

All new utilities and complex logic should include Vitest unit tests.
- **Location**: `.test.ts` files adjacent to the source code.
- **Run command**: `npm test`

## 📡 Backend Requirements (Supabase)

To make the app fully functional, you need to deploy the Edge Function:

1. `supabase login`
2. `supabase link --project-ref xxhiqqamjhkhbykmehnr`
3. `deploy-edge-function.bat` (on Windows) or `./deploy-edge-function.sh` (on Linux/macOS)

import { createBrowserRouter } from "react-router";
import { AuthLayout } from "./components/auth/AuthLayout";
import { Login } from "./components/auth/Login";
import { Signup } from "./components/auth/Signup";
import { ForgotPassword } from "./components/auth/ForgotPassword";
import { ResetPassword } from "./components/auth/ResetPassword";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Profile } from "./components/profile/Profile";
import { RoomManagement } from "./components/room/RoomManagement";
import { MealPlanner } from "./components/meals/MealPlanner";
import { TaskManager } from "./components/tasks/TaskManager";
import { ExpenseTracker } from "./components/expenses/ExpenseTracker";
import { BillManager } from "./components/bills/BillManager";
import { PersonnelManager } from "./components/personnel/PersonnelManager";
import { Analytics } from "./components/analytics/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: Login },
      { path: "signup", Component: Signup },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: ResetPassword },
    ],
  },
  {
    path: "/app",
    Component: MainLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "profile", Component: Profile },
      { path: "room", Component: RoomManagement },
      { path: "meals", Component: MealPlanner },
      { path: "tasks", Component: TaskManager },
      { path: "expenses", Component: ExpenseTracker },
      { path: "bills", Component: BillManager },
      { path: "personnel", Component: PersonnelManager },
      { path: "analytics", Component: Analytics },
    ],
  },
]);
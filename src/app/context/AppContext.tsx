import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  authAPI,
  roomAPI,
  mealAPI,
  taskAPI,
  expenseAPI,
  billAPI,
  personnelAPI,
  attendanceAPI,
  paymentAPI,
  expenseCategoryAPI,
  setAccessToken,
  getAccessToken,
} from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  roomId?: string;
  role?: 'admin' | 'member';
  currency?: string;
}

export interface Room {
  id: string;
  name: string;
  inviteCode: string;
  members: RoomMember[];
}

export interface RoomMember {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  profilePicture?: string;
}

export interface Meal {
  id: string;
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  roomId: string;
}

export interface Task {
  id: string;
  name: string;
  assignedTo: string;
  deadline: string;
  status: 'pending' | 'completed';
  recurring: 'none' | 'daily' | 'weekly';
  roomId: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  roomId: string;
  name: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
  splitAmong: string[];
  date: string;
  roomId: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  recurring: boolean;
  status: 'paid' | 'pending';
  roomId: string;
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  monthlyCompensation: number;
  roomId: string;
}

export interface Attendance {
  id: string;
  personnelId: string;
  date: string;
  status: 'present' | 'absent' | 'leave';
  leaveReason?: string;
  roomId: string;
}

export interface Payment {
  id: string;
  personnelId: string;
  month: string;
  amount: number;
  status: 'paid' | 'pending';
  roomId: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  meals: Meal[];
  setMeals: (meals: Meal[]) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: (categories: ExpenseCategory[]) => void;
  bills: Bill[];
  setBills: (bills: Bill[]) => void;
  personnel: Personnel[];
  setPersonnel: (personnel: Personnel[]) => void;
  attendance: Attendance[];
  setAttendance: (attendance: Attendance[]) => void;
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  logout: () => void;
  refreshData: () => Promise<void>;
  loading: boolean;
  currency: string;
  setCurrency: (currency: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('currency') || 'USD');

  const setCurrency = (c: string) => {
    localStorage.setItem('currency', c);
    setCurrencyState(c);
  };

  // Refresh all data for the current room
  const refreshData = useCallback(async () => {
    if (!currentRoom) return;

    try {
      setLoading(true);
      const [
        mealsData,
        tasksData,
        expensesData,
        expenseCategoriesData,
        billsData,
        personnelData,
        attendanceData,
        paymentsData,
      ] = await Promise.all([
        mealAPI.getMeals(currentRoom.id),
        taskAPI.getTasks(currentRoom.id),
        expenseAPI.getExpenses(currentRoom.id),
        expenseCategoryAPI.getCategories(currentRoom.id),
        billAPI.getBills(currentRoom.id),
        personnelAPI.getPersonnel(currentRoom.id),
        attendanceAPI.getAttendance(currentRoom.id),
        paymentAPI.getPayments(currentRoom.id),
      ]);

      setMeals(mealsData || []);
      setTasks((tasksData as Task[]) || []);
      setExpenses(expensesData || []);
      setExpenseCategories(expenseCategoriesData || []);
      setBills(billsData || []);
      setPersonnel(personnelData || []);
      setAttendance(attendanceData || []);
      setPayments((paymentsData as Payment[]) || []);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentRoom]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { user: sessionUser } = await authAPI.getSession();
        
        if (sessionUser) {
          setUser(sessionUser);
          
          if (sessionUser.currency) {
            setCurrencyState(sessionUser.currency);
            localStorage.setItem('currency', sessionUser.currency);
          }
          
          // If user has a room, fetch it
          if (sessionUser.roomId) {
            try {
              const room = await roomAPI.getRoom(sessionUser.roomId);
              setCurrentRoom(room);
              
              // Get user role from room members
              const member = room.members.find((m: RoomMember) => m.userId === sessionUser.id);
              if (member) {
                setUser(prev => prev ? { ...prev, role: member.role } : null);
              }
            } catch (error) {
              console.error('Error loading room:', error);
            }
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Refresh data when room changes
  useEffect(() => {
    if (currentRoom) {
      refreshData();
    } else {
      setMeals([]);
      setTasks([]);
      setExpenses([]);
      setExpenseCategories([]);
      setBills([]);
      setPersonnel([]);
      setAttendance([]);
      setPayments([]);
      setLoading(false);
    }
  }, [currentRoom, refreshData]);

  const logout = useCallback(async () => {
    try {
      await authAPI.signout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCurrentRoom(null);
      setMeals([]);
      setTasks([]);
      setExpenses([]);
      setExpenseCategories([]);
      setBills([]);
      setPersonnel([]);
      setAttendance([]);
      setPayments([]);
      setAccessToken(null);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        currentRoom,
        setCurrentRoom,
        meals,
        setMeals,
        tasks,
        setTasks,
        expenses,
        setExpenses,
        expenseCategories,
        setExpenseCategories,
        bills,
        setBills,
        personnel,
        setPersonnel,
        attendance,
        setAttendance,
        payments,
        setPayments,
        logout,
        refreshData,
        loading,
        currency,
        setCurrency,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
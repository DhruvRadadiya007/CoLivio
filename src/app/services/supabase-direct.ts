import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// Create Supabase client
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Store access token
export const setAccessToken = (token: string | null) => {
  if (token) localStorage.setItem('access_token', token);
  else localStorage.removeItem('access_token');
};

export const getAccessToken = () => localStorage.getItem('access_token');

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// ==================== AUTH API ====================

export const authAPI = {
  async signup(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } }
    });
    if (error) throw error;
    if (!data.session && !data.user) throw new Error('Signup failed.');
    return { user: { id: data.user!.id, email: data.user!.email!, name } };
  },

  async signin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    setAccessToken(data.session.access_token);
    
    // Get user's room
    const { data: rm } = await supabase.from('room_members').select('room_id').eq('user_id', data.user.id).maybeSingle();
    
    return {
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || '',
        currency: data.user.user_metadata?.currency || 'USD',
        roomId: rm?.room_id || null,
      },
    };
  },

  async getSession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null };

    const { data: rm } = await supabase.from('room_members').select('room_id').eq('user_id', user.id).maybeSingle();

    return {
      user: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || '',
        currency: user.user_metadata?.currency || 'USD',
        roomId: rm?.room_id || null,
      },
    };
  },

  async signout() {
    await supabase.auth.signOut();
    setAccessToken(null);
  },

  async updateUser(updates: { name?: string; currency?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const metaUpdates: any = {};
    if (updates.name !== undefined) metaUpdates.name = updates.name;
    if (updates.currency !== undefined) metaUpdates.currency = updates.currency;

    const { error: authError } = await supabase.auth.updateUser({
      data: metaUpdates
    });
    if (authError) throw authError;

    // Try to update name in room_members as well
    if (updates.name !== undefined) {
      await supabase.from('room_members').update({ name: updates.name }).eq('user_id', user.id);
    }
    
    return updates;
  },
};

// ==================== ROOM API ====================

export const roomAPI = {
  async createRoom(name: string) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    const { data: { user } } = await supabase.auth.getUser();

    // Create room
    const { data: room, error: roomError } = await supabase.from('rooms').insert({
      name, invite_code: inviteCode
    }).select().single();
    if (roomError) throw roomError;

    // Join room
    const { error: memberError } = await supabase.from('room_members').insert({
      room_id: room.id,
      user_id: user!.id,
      name: user!.user_metadata?.name || user!.email,
      email: user!.email!,
      role: 'admin'
    });
    if (memberError) throw memberError;

    return this.getRoom(room.id);
  },

  async joinRoom(inviteCode: string) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const { data: room, error: roomError } = await supabase.from('rooms').select('id').eq('invite_code', inviteCode).single();
    if (!room || roomError) throw new Error('Invalid invite code');

    const { data: { user } } = await supabase.auth.getUser();

    // Check if already a member
    const { data: existing } = await supabase.from('room_members').select('id').eq('room_id', room.id).eq('user_id', userId).maybeSingle();
    if (existing) throw new Error('Already a member');

    const { error: memberError } = await supabase.from('room_members').insert({
      room_id: room.id,
      user_id: user!.id,
      name: user!.user_metadata?.name || user!.email,
      email: user!.email!,
      role: 'member'
    });
    if (memberError) throw memberError;

    return this.getRoom(room.id);
  },

  async getRoom(roomId: string) {
    const { data: room, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (!room || error) throw new Error('Room not found');

    const { data: members, error: memError } = await supabase.from('room_members').select('*').eq('room_id', roomId);
    if (memError) throw memError;

    return {
      id: room.id,
      name: room.name,
      inviteCode: room.invite_code,
      createdAt: room.created_at,
      members: members.map(m => ({
        userId: m.user_id,
        name: m.name,
        email: m.email,
        role: m.role
      }))
    };
  },

  async leaveRoom(roomId: string) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', userId);
    
    // Check if room is empty
    const { count } = await supabase.from('room_members').select('*', { count: 'exact', head: true }).eq('room_id', roomId);
    if (count === 0) {
      await supabase.from('rooms').delete().eq('id', roomId);
    }
  },

  async updateRoomName(roomId: string, name: string) {
    const { error } = await supabase.from('rooms').update({ name }).eq('id', roomId);
    if (error) throw error;
    return name;
  },

  async deleteRoom(roomId: string) {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) throw error;
  },

  async makeMemberAdmin(roomId: string, targetUserId: string) {
    const { error } = await supabase.from('room_members').update({ role: 'admin' }).eq('room_id', roomId).eq('user_id', targetUserId);
    if (error) throw error;
  },
};

// ==================== MEAL API ====================

// Meals array format expected by frontend: { id: string, roomId: string, day: string, breakfast: string, lunch: string, dinner: string }
export const mealAPI = {
  async getMeals(roomId: string) {
    const { data, error } = await supabase.from('meals').select('*').eq('room_id', roomId);
    if (error) throw error;
    
    // Group by day_of_week
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map(day => {
      const dayMeals = data.filter(m => m.day_of_week === day);
      return {
        id: `meal_group_${day}`,
        roomId,
        day,
        breakfast: dayMeals.find(m => m.meal_type === 'breakfast')?.dish_name || '',
        lunch: dayMeals.find(m => m.meal_type === 'lunch')?.dish_name || '',
        dinner: dayMeals.find(m => m.meal_type === 'dinner')?.dish_name || '',
      };
    }).filter(m => m.breakfast || m.lunch || m.dinner);
  },

  async saveMeal(meal: any) {
    // meal object coming from frontend: { roomId, day, breakfast, lunch, dinner }
    // First, delete existing meals for that day
    await supabase.from('meals').delete().eq('room_id', meal.roomId).eq('day_of_week', meal.day);
    
    // Insert new ones
    const toInsert = [];
    if (meal.breakfast) toInsert.push({ room_id: meal.roomId, day_of_week: meal.day, meal_type: 'breakfast', dish_name: meal.breakfast });
    if (meal.lunch) toInsert.push({ room_id: meal.roomId, day_of_week: meal.day, meal_type: 'lunch', dish_name: meal.lunch });
    if (meal.dinner) toInsert.push({ room_id: meal.roomId, day_of_week: meal.day, meal_type: 'dinner', dish_name: meal.dinner });
    
    if (toInsert.length > 0) {
      await supabase.from('meals').insert(toInsert);
    }
    return meal;
  },

  async deleteMeal(roomId: string, mealId: string) {
    // Our meal group ID is e.g. "meal_group_Monday"
    const day = mealId.replace('meal_group_', '');
    await supabase.from('meals').delete().eq('room_id', roomId).eq('day_of_week', day);
  },
};

// ==================== TASK API ====================

// Frontend expects: id, roomId, name, assignedTo, deadline, status, recurring
export const taskAPI = {
  async getTasks(roomId: string) {
    const { data, error } = await supabase.from('tasks').select('*').eq('room_id', roomId);
    if (error) throw error;
    return data.map(t => ({
      id: t.id,
      roomId: t.room_id,
      name: t.title,
      assignedTo: t.assigned_to_name || '',
      deadline: t.due_date ? t.due_date.split('T')[0] : '',
      status: t.status,
      recurring: t.is_recurring ? (t.recurrence_pattern || 'none') : 'none'
    }));
  },

  async createTask(task: any) {
    const isRecurring = task.recurring && task.recurring !== 'none';
    const { data, error } = await supabase.from('tasks').insert({
      room_id: task.roomId,
      title: task.name,
      assigned_to_name: task.assignedTo,
      due_date: task.deadline,
      status: task.status || 'pending',
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? task.recurring : null
    }).select().single();
    if (error) throw error;
    return { ...task, id: data.id };
  },

  async updateTask(roomId: string, taskId: string, updates: any) {
    let toUpdate: any = {};
    if (updates.name !== undefined) toUpdate.title = updates.name;
    if (updates.assignedTo !== undefined) toUpdate.assigned_to_name = updates.assignedTo;
    if (updates.deadline !== undefined) toUpdate.due_date = updates.deadline;
    if (updates.status !== undefined) toUpdate.status = updates.status;
    if (updates.recurring !== undefined) {
      toUpdate.is_recurring = updates.recurring !== 'none';
      toUpdate.recurrence_pattern = updates.recurring !== 'none' ? updates.recurring : null;
    }
    
    const { error } = await supabase.from('tasks').update(toUpdate).eq('id', taskId).eq('room_id', roomId);
    if (error) throw error;
    return updates;
  },

  async deleteTask(roomId: string, taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId).eq('room_id', roomId);
  },
};

// ==================== EXPENSE API ====================

// Frontend expects: id, title, amount, paidBy, splitAmong, date, roomId
export const expenseAPI = {
  async getExpenses(roomId: string) {
    const { data, error } = await supabase.from('expenses').select('*').eq('room_id', roomId);
    if (error) throw error;
    return data.map(e => ({
      id: e.id,
      roomId: e.room_id,
      title: e.description,
      amount: e.amount,
      category: e.category || 'General',
      paidBy: e.paid_by,
      splitAmong: e.split_details || [],
      date: e.date ? e.date.split('T')[0] : ''
    }));
  },

  async createExpense(expense: any) {
    const { data, error } = await supabase.from('expenses').insert({
      room_id: expense.roomId,
      description: expense.title,
      amount: expense.amount,
      category: expense.category || 'General',
      paid_by: expense.paidBy,
      split_type: 'custom',
      split_details: expense.splitAmong,
      date: expense.date
    }).select().single();
    if (error) throw error;
    return { ...expense, id: data.id };
  },

  async updateExpense(roomId: string, expenseId: string, updates: any) {
    let toUpdate: any = {};
    if (updates.title !== undefined) toUpdate.description = updates.title;
    if (updates.amount !== undefined) toUpdate.amount = updates.amount;
    if (updates.category !== undefined) toUpdate.category = updates.category;
    if (updates.paidBy !== undefined) toUpdate.paid_by = updates.paidBy;
    if (updates.splitAmong !== undefined) toUpdate.split_details = updates.splitAmong;
    if (updates.date !== undefined) toUpdate.date = updates.date;
    
    const { error } = await supabase.from('expenses').update(toUpdate).eq('id', expenseId).eq('room_id', roomId);
    if (error) throw error;
    return updates;
  },

  async deleteExpense(roomId: string, expenseId: string) {
    await supabase.from('expenses').delete().eq('id', expenseId).eq('room_id', roomId);
  },
};

// ==================== EXPENSE CATEGORY API ====================

export const expenseCategoryAPI = {
  async getCategories(roomId: string) {
    const { data, error } = await supabase.from('expense_categories').select('*').eq('room_id', roomId);
    if (error) {
      // If table doesn't exist yet or other error, return empty array to prevent crashing
      console.warn('Could not fetch categories:', error);
      return [];
    }
    return data.map((c: any) => ({
      id: c.id,
      roomId: c.room_id,
      name: c.name
    }));
  },

  async createCategory(roomId: string, name: string) {
    const { data, error } = await supabase.from('expense_categories').insert({
      room_id: roomId,
      name
    }).select().single();
    if (error) throw error;
    return { id: data.id, roomId: data.room_id, name: data.name };
  },

  async deleteCategory(categoryId: string) {
    const { error } = await supabase.from('expense_categories').delete().eq('id', categoryId);
    if (error) throw error;
  }
};

// ==================== BILL API ====================

// Frontend expects: id, name, amount, dueDate, recurring, status, roomId
export const billAPI = {
  async getBills(roomId: string) {
    const { data, error } = await supabase.from('bills').select('*').eq('room_id', roomId);
    if (error) throw error;
    return data.map(b => ({
      id: b.id,
      roomId: b.room_id,
      name: b.name,
      amount: b.amount,
      dueDate: b.due_date ? b.due_date.split('T')[0] : '',
      recurring: b.is_recurring,
      status: b.status
    }));
  },

  async createBill(bill: any) {
    const { data, error } = await supabase.from('bills').insert({
      room_id: bill.roomId,
      name: bill.name,
      amount: bill.amount,
      category: 'General',
      due_date: bill.dueDate,
      is_recurring: bill.recurring || false,
      status: bill.status || 'pending'
    }).select().single();
    if (error) throw error;
    return { ...bill, id: data.id };
  },

  async updateBill(roomId: string, billId: string, updates: any) {
    let toUpdate: any = {};
    if (updates.name !== undefined) toUpdate.name = updates.name;
    if (updates.amount !== undefined) toUpdate.amount = updates.amount;
    if (updates.dueDate !== undefined) toUpdate.due_date = updates.dueDate;
    if (updates.recurring !== undefined) toUpdate.is_recurring = updates.recurring;
    if (updates.status !== undefined) toUpdate.status = updates.status;
    
    const { error } = await supabase.from('bills').update(toUpdate).eq('id', billId).eq('room_id', roomId);
    if (error) throw error;
    return updates;
  },

  async deleteBill(roomId: string, billId: string) {
    await supabase.from('bills').delete().eq('id', billId).eq('room_id', roomId);
  },
};

// ==================== PERSONNEL API ====================

export const personnelAPI = {
  async getPersonnel(roomId: string) {
    const { data, error } = await supabase.from('personnel').select('*').eq('room_id', roomId);
    if (error) throw error;
    return data.map((p: any) => ({
      id: p.id,
      roomId: p.room_id,
      name: p.name,
      role: p.role,
      monthlyCompensation: p.salary,
      joiningDate: p.start_date ? p.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
    }));
  },

  async createPersonnel(person: any) {
    const { data, error } = await supabase.from('personnel').insert({
      room_id: person.roomId,
      name: person.name,
      role: person.role,
      salary: person.monthlyCompensation,
      payment_frequency: 'monthly',
      start_date: person.joiningDate ? new Date(person.joiningDate).toISOString() : new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return { ...person, id: data.id, joiningDate: person.joiningDate || new Date().toISOString().split('T')[0] };
  },

  async updatePersonnel(roomId: string, personId: string, updates: any) {
    let toUpdate: any = {};
    if (updates.name !== undefined) toUpdate.name = updates.name;
    if (updates.role !== undefined) toUpdate.role = updates.role;
    if (updates.monthlyCompensation !== undefined) toUpdate.salary = updates.monthlyCompensation;
    if (updates.joiningDate !== undefined) toUpdate.start_date = new Date(updates.joiningDate).toISOString();

    const { error } = await supabase.from('personnel').update(toUpdate).eq('id', personId).eq('room_id', roomId);
    if (error) throw error;
    return updates;
  },

  async deletePersonnel(roomId: string, personId: string) {
    await supabase.from('personnel').delete().eq('id', personId).eq('room_id', roomId);
  },
};

// ==================== ATTENDANCE API ====================

export const attendanceAPI = {
  async getAttendance(roomId: string) {
    const { data, error } = await supabase.from('attendance').select('*').eq('room_id', roomId);
    if (error) throw error;
    return data.map((a: any) => ({
      id: a.id, roomId: a.room_id, personnelId: a.personnel_id, date: a.date ? a.date.split('T')[0] : '', status: a.status, leaveReason: a.notes
    }));
  },

  async saveAttendance(record: any) {
    const { data, error } = await supabase.from('attendance').upsert({
      id: record.id,
      room_id: record.roomId,
      personnel_id: record.personnelId,
      date: record.date,
      status: record.status,
      notes: record.leaveReason
    }).select().single();
    if (error) throw error;
    return { ...record, id: data.id };
  },
};

// ==================== PAYMENT API ====================

export const paymentAPI = {
  async getPayments(roomId: string) {
    const { data, error } = await supabase.from('payments').select('*').eq('room_id', roomId);
    if (error) throw error;
    return data.map((p: any) => ({
      id: p.id, roomId: p.room_id, personnelId: p.personnel_id, amount: p.amount, month: p.period_start ? p.period_start.split('T')[0] : '', status: 'paid'
    }));
  },

  async savePayment(payment: any) {
    const { data, error } = await supabase.from('payments').insert({
      room_id: payment.roomId,
      personnel_id: payment.personnelId,
      amount: payment.amount,
      period_start: payment.month,
      payment_date: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return { ...payment, id: data.id };
  },

  async updatePayment(roomId: string, paymentId: string, updates: any) {
    return updates;
  },
};
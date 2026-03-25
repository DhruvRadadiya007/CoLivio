import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to verify authorization
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) {
    return { error: 'No authorization header', user: null };
  }
  
  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    return { error: 'Invalid authorization format', user: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return { error: 'Unauthorized', user: null };
  }

  return { error: null, user };
}

// Health check endpoint
app.get("/make-server-5bec5893/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Sign up
app.post("/make-server-5bec5893/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
      }
    });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Sign in
app.post("/make-server-5bec5893/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const clientSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data, error } = await clientSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Sign in error:', error);
      return c.json({ error: error.message }, 401);
    }

    // Get user's room
    const userRoom = await kv.get(`user:${data.user.id}:room`);

    return c.json({ 
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
        roomId: userRoom,
      }
    });
  } catch (error) {
    console.log('Sign in exception:', error);
    return c.json({ error: 'Failed to sign in' }, 500);
  }
});

// Get session
app.get("/make-server-5bec5893/auth/session", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ session: null, user: null });
    }

    // Get user's room
    const userRoom = await kv.get(`user:${authResult.user.id}:room`);

    return c.json({ 
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.user_metadata.name,
        roomId: userRoom,
      }
    });
  } catch (error) {
    console.log('Get session exception:', error);
    return c.json({ user: null }, 500);
  }
});

// Sign out
app.post("/make-server-5bec5893/auth/signout", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const clientSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    await clientSupabase.auth.admin.signOut(accessToken ?? '');

    return c.json({ success: true });
  } catch (error) {
    console.log('Sign out exception:', error);
    return c.json({ error: 'Failed to sign out' }, 500);
  }
});

// ==================== ROOM ROUTES ====================

// Create room
app.post("/make-server-5bec5893/rooms/create", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name } = await c.req.json();
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();

    const room = {
      id: roomId,
      name,
      inviteCode,
      members: [{
        userId: authResult.user.id,
        name: authResult.user.user_metadata.name,
        email: authResult.user.email,
        role: 'admin',
      }],
      createdAt: new Date().toISOString(),
    };

    await kv.set(`room:${roomId}`, room);
    await kv.set(`room:code:${inviteCode}`, roomId);
    await kv.set(`user:${authResult.user.id}:room`, roomId);

    return c.json({ room });
  } catch (error) {
    console.log('Create room error:', error);
    return c.json({ error: 'Failed to create room' }, 500);
  }
});

// Join room
app.post("/make-server-5bec5893/rooms/join", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { inviteCode } = await c.req.json();

    const roomId = await kv.get(`room:code:${inviteCode}`);
    
    if (!roomId) {
      return c.json({ error: 'Invalid invite code' }, 404);
    }

    const room = await kv.get(`room:${roomId}`);
    
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    // Check if user is already a member
    if (room.members.some((m: any) => m.userId === authResult.user.id)) {
      return c.json({ error: 'Already a member' }, 400);
    }

    // Add user to room
    room.members.push({
      userId: authResult.user.id,
      name: authResult.user.user_metadata.name,
      email: authResult.user.email,
      role: 'member',
    });

    await kv.set(`room:${roomId}`, room);
    await kv.set(`user:${authResult.user.id}:room`, roomId);

    return c.json({ room });
  } catch (error) {
    console.log('Join room error:', error);
    return c.json({ error: 'Failed to join room' }, 500);
  }
});

// Get room
app.get("/make-server-5bec5893/rooms/:roomId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const room = await kv.get(`room:${roomId}`);

    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    // Check if user is a member
    if (!room.members.some((m: any) => m.userId === authResult.user.id)) {
      return c.json({ error: 'Not a member' }, 403);
    }

    return c.json({ room });
  } catch (error) {
    console.log('Get room error:', error);
    return c.json({ error: 'Failed to get room' }, 500);
  }
});

// Leave room
app.post("/make-server-5bec5893/rooms/:roomId/leave", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const room = await kv.get(`room:${roomId}`);

    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    // Remove user from room
    room.members = room.members.filter((m: any) => m.userId !== authResult.user.id);

    if (room.members.length === 0) {
      // Delete room if no members left
      await kv.del(`room:${roomId}`);
      await kv.del(`room:code:${room.inviteCode}`);
    } else {
      await kv.set(`room:${roomId}`, room);
    }

    await kv.del(`user:${authResult.user.id}:room`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Leave room error:', error);
    return c.json({ error: 'Failed to leave room' }, 500);
  }
});

// ==================== MEAL ROUTES ====================

// Get meals
app.get("/make-server-5bec5893/meals/:roomId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const meals = await kv.getByPrefix(`meal:${roomId}:`);

    return c.json({ meals: meals.map(m => m.value) });
  } catch (error) {
    console.log('Get meals error:', error);
    return c.json({ error: 'Failed to get meals' }, 500);
  }
});

// Create/Update meal
app.post("/make-server-5bec5893/meals", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const meal = await c.req.json();
    
    if (!meal.id) {
      meal.id = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    await kv.set(`meal:${meal.roomId}:${meal.id}`, meal);

    return c.json({ meal });
  } catch (error) {
    console.log('Create/Update meal error:', error);
    return c.json({ error: 'Failed to save meal' }, 500);
  }
});

// Delete meal
app.delete("/make-server-5bec5893/meals/:roomId/:mealId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const mealId = c.req.param('mealId');

    await kv.del(`meal:${roomId}:${mealId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete meal error:', error);
    return c.json({ error: 'Failed to delete meal' }, 500);
  }
});

// ==================== TASK ROUTES ====================

// Get tasks
app.get("/make-server-5bec5893/tasks/:roomId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const tasks = await kv.getByPrefix(`task:${roomId}:`);

    return c.json({ tasks: tasks.map(t => t.value) });
  } catch (error) {
    console.log('Get tasks error:', error);
    return c.json({ error: 'Failed to get tasks' }, 500);
  }
});

// Create task
app.post("/make-server-5bec5893/tasks", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const task = await c.req.json();
    
    if (!task.id) {
      task.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      task.createdAt = new Date().toISOString();
    }

    await kv.set(`task:${task.roomId}:${task.id}`, task);

    return c.json({ task });
  } catch (error) {
    console.log('Create task error:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

// Update task
app.put("/make-server-5bec5893/tasks/:roomId/:taskId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const taskId = c.req.param('taskId');
    const updates = await c.req.json();

    const task = await kv.get(`task:${roomId}:${taskId}`);
    
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    const updatedTask = { ...task, ...updates };
    await kv.set(`task:${roomId}:${taskId}`, updatedTask);

    return c.json({ task: updatedTask });
  } catch (error) {
    console.log('Update task error:', error);
    return c.json({ error: 'Failed to update task' }, 500);
  }
});

// Delete task
app.delete("/make-server-5bec5893/tasks/:roomId/:taskId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const taskId = c.req.param('taskId');

    await kv.del(`task:${roomId}:${taskId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete task error:', error);
    return c.json({ error: 'Failed to delete task' }, 500);
  }
});

// ==================== EXPENSE ROUTES ====================

// Get expenses
app.get("/make-server-5bec5893/expenses/:roomId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const expenses = await kv.getByPrefix(`expense:${roomId}:`);

    return c.json({ expenses: expenses.map(e => e.value) });
  } catch (error) {
    console.log('Get expenses error:', error);
    return c.json({ error: 'Failed to get expenses' }, 500);
  }
});

// Create expense
app.post("/make-server-5bec5893/expenses", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const expense = await c.req.json();
    
    if (!expense.id) {
      expense.id = `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    await kv.set(`expense:${expense.roomId}:${expense.id}`, expense);

    return c.json({ expense });
  } catch (error) {
    console.log('Create expense error:', error);
    return c.json({ error: 'Failed to create expense' }, 500);
  }
});

// Update expense
app.put("/make-server-5bec5893/expenses/:roomId/:expenseId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const expenseId = c.req.param('expenseId');
    const updates = await c.req.json();

    const expense = await kv.get(`expense:${roomId}:${expenseId}`);
    
    if (!expense) {
      return c.json({ error: 'Expense not found' }, 404);
    }

    const updatedExpense = { ...expense, ...updates };
    await kv.set(`expense:${roomId}:${expenseId}`, updatedExpense);

    return c.json({ expense: updatedExpense });
  } catch (error) {
    console.log('Update expense error:', error);
    return c.json({ error: 'Failed to update expense' }, 500);
  }
});

// Delete expense
app.delete("/make-server-5bec5893/expenses/:roomId/:expenseId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const expenseId = c.req.param('expenseId');

    await kv.del(`expense:${roomId}:${expenseId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete expense error:', error);
    return c.json({ error: 'Failed to delete expense' }, 500);
  }
});

// ==================== BILL ROUTES ====================

// Get bills
app.get("/make-server-5bec5893/bills/:roomId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const bills = await kv.getByPrefix(`bill:${roomId}:`);

    return c.json({ bills: bills.map(b => b.value) });
  } catch (error) {
    console.log('Get bills error:', error);
    return c.json({ error: 'Failed to get bills' }, 500);
  }
});

// Create bill
app.post("/make-server-5bec5893/bills", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bill = await c.req.json();
    
    if (!bill.id) {
      bill.id = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    await kv.set(`bill:${bill.roomId}:${bill.id}`, bill);

    return c.json({ bill });
  } catch (error) {
    console.log('Create bill error:', error);
    return c.json({ error: 'Failed to create bill' }, 500);
  }
});

// Update bill
app.put("/make-server-5bec5893/bills/:roomId/:billId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const billId = c.req.param('billId');
    const updates = await c.req.json();

    const bill = await kv.get(`bill:${roomId}:${billId}`);
    
    if (!bill) {
      return c.json({ error: 'Bill not found' }, 404);
    }

    const updatedBill = { ...bill, ...updates };
    await kv.set(`bill:${roomId}:${billId}`, updatedBill);

    return c.json({ bill: updatedBill });
  } catch (error) {
    console.log('Update bill error:', error);
    return c.json({ error: 'Failed to update bill' }, 500);
  }
});

// Delete bill
app.delete("/make-server-5bec5893/bills/:roomId/:billId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const billId = c.req.param('billId');

    await kv.del(`bill:${roomId}:${billId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete bill error:', error);
    return c.json({ error: 'Failed to delete bill' }, 500);
  }
});

// ==================== PERSONNEL ROUTES ====================

// Get personnel
app.get("/make-server-5bec5893/personnel/:roomId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const personnel = await kv.getByPrefix(`personnel:${roomId}:`);

    return c.json({ personnel: personnel.map(p => p.value) });
  } catch (error) {
    console.log('Get personnel error:', error);
    return c.json({ error: 'Failed to get personnel' }, 500);
  }
});

// Create personnel
app.post("/make-server-5bec5893/personnel", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const person = await c.req.json();
    
    if (!person.id) {
      person.id = `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    await kv.set(`personnel:${person.roomId}:${person.id}`, person);

    return c.json({ person });
  } catch (error) {
    console.log('Create personnel error:', error);
    return c.json({ error: 'Failed to create personnel' }, 500);
  }
});

// Update personnel
app.put("/make-server-5bec5893/personnel/:roomId/:personId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const personId = c.req.param('personId');
    const updates = await c.req.json();

    const person = await kv.get(`personnel:${roomId}:${personId}`);
    
    if (!person) {
      return c.json({ error: 'Personnel not found' }, 404);
    }

    const updatedPerson = { ...person, ...updates };
    await kv.set(`personnel:${roomId}:${personId}`, updatedPerson);

    return c.json({ person: updatedPerson });
  } catch (error) {
    console.log('Update personnel error:', error);
    return c.json({ error: 'Failed to update personnel' }, 500);
  }
});

// Delete personnel
app.delete("/make-server-5bec5893/personnel/:roomId/:personId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const personId = c.req.param('personId');

    await kv.del(`personnel:${roomId}:${personId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete personnel error:', error);
    return c.json({ error: 'Failed to delete personnel' }, 500);
  }
});

// ==================== ATTENDANCE ROUTES ====================

// Get attendance
app.get("/make-server-5bec5893/attendance/:roomId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const attendance = await kv.getByPrefix(`attendance:${roomId}:`);

    return c.json({ attendance: attendance.map(a => a.value) });
  } catch (error) {
    console.log('Get attendance error:', error);
    return c.json({ error: 'Failed to get attendance' }, 500);
  }
});

// Create/Update attendance
app.post("/make-server-5bec5893/attendance", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const record = await c.req.json();
    
    if (!record.id) {
      record.id = `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    await kv.set(`attendance:${record.roomId}:${record.id}`, record);

    return c.json({ record });
  } catch (error) {
    console.log('Create/Update attendance error:', error);
    return c.json({ error: 'Failed to save attendance' }, 500);
  }
});

// ==================== PAYMENT ROUTES ====================

// Get payments
app.get("/make-server-5bec5893/payments/:roomId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const payments = await kv.getByPrefix(`payment:${roomId}:`);

    return c.json({ payments: payments.map(p => p.value) });
  } catch (error) {
    console.log('Get payments error:', error);
    return c.json({ error: 'Failed to get payments' }, 500);
  }
});

// Create/Update payment
app.post("/make-server-5bec5893/payments", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const payment = await c.req.json();
    
    if (!payment.id) {
      payment.id = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    await kv.set(`payment:${payment.roomId}:${payment.id}`, payment);

    return c.json({ payment });
  } catch (error) {
    console.log('Create/Update payment error:', error);
    return c.json({ error: 'Failed to save payment' }, 500);
  }
});

// Update payment
app.put("/make-server-5bec5893/payments/:roomId/:paymentId", async (c) => {
  try {
    const authResult = await verifyAuth(c.req.header('Authorization'));
    
    if (authResult.error || !authResult.user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const roomId = c.req.param('roomId');
    const paymentId = c.req.param('paymentId');
    const updates = await c.req.json();

    const payment = await kv.get(`payment:${roomId}:${paymentId}`);
    
    if (!payment) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    const updatedPayment = { ...payment, ...updates };
    await kv.set(`payment:${roomId}:${paymentId}`, updatedPayment);

    return c.json({ payment: updatedPayment });
  } catch (error) {
    console.log('Update payment error:', error);
    return c.json({ error: 'Failed to update payment' }, 500);
  }
});

Deno.serve(app.fetch);

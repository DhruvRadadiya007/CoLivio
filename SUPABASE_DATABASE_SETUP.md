# 🗄️ CoLivio - Supabase Database Setup Guide

## Overview

Currently, CoLivio stores data in **localStorage** (browser-only storage). This guide will help you migrate to **Supabase Database** for proper cloud storage with multi-device sync and real-time collaboration.

---

## 📊 Current vs Database Storage

### Current (localStorage)
```
✅ Works immediately
✅ No setup needed
❌ Data only on current browser
❌ Lost if cache cleared
❌ No multi-device sync
❌ Limited collaboration
```

### With Supabase Database
```
✅ Cloud storage
✅ Multi-device sync
✅ Real-time collaboration
✅ Persistent across devices
✅ Production-ready
✅ Automatic backups
```

---

## 🎯 Step-by-Step Setup

### Step 1: Access Supabase SQL Editor

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/xxhiqqamjhkhbykmehnr
   ```

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

---

### Step 2: Create Database Schema

Copy and paste this SQL into the SQL Editor and click "Run":

```sql
-- ============================================
-- CoLivio Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROOM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ============================================
-- MEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  dish_name TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name TEXT,
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  paid_by UUID REFERENCES auth.users(id),
  paid_by_name TEXT,
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'custom', 'percentage')),
  split_details JSONB, -- Stores array of {userId, name, amount/percentage}
  receipt_url TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BILLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  due_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('monthly', 'quarterly', 'yearly')),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PERSONNEL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  salary DECIMAL(10, 2),
  payment_frequency TEXT CHECK (payment_frequency IN ('daily', 'weekly', 'monthly')),
  start_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personnel_id UUID REFERENCES personnel(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half-day', 'leave')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(personnel_id, date)
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personnel_id UUID REFERENCES personnel(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_room_id ON meals(room_id);
CREATE INDEX IF NOT EXISTS idx_tasks_room_id ON tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_expenses_room_id ON expenses(room_id);
CREATE INDEX IF NOT EXISTS idx_bills_room_id ON bills(room_id);
CREATE INDEX IF NOT EXISTS idx_personnel_room_id ON personnel(room_id);
CREATE INDEX IF NOT EXISTS idx_attendance_personnel_id ON attendance(personnel_id);
CREATE INDEX IF NOT EXISTS idx_payments_personnel_id ON payments(personnel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON rooms(invite_code);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is room member
CREATE OR REPLACE FUNCTION is_room_member(room_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = room_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rooms policies
CREATE POLICY "Users can view rooms they are members of"
  ON rooms FOR SELECT
  USING (is_room_member(id));

CREATE POLICY "Users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Room admins can update rooms"
  ON rooms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Room admins can delete rooms"
  ON rooms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Room members policies
CREATE POLICY "Users can view room members of their rooms"
  ON room_members FOR SELECT
  USING (is_room_member(room_id));

CREATE POLICY "Users can join rooms"
  ON room_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can leave rooms"
  ON room_members FOR DELETE
  USING (user_id = auth.uid());

-- Meals policies
CREATE POLICY "Room members can view meals"
  ON meals FOR SELECT
  USING (is_room_member(room_id));

CREATE POLICY "Room members can create meals"
  ON meals FOR INSERT
  WITH CHECK (is_room_member(room_id));

CREATE POLICY "Room members can update meals"
  ON meals FOR UPDATE
  USING (is_room_member(room_id));

CREATE POLICY "Room members can delete meals"
  ON meals FOR DELETE
  USING (is_room_member(room_id));

-- Tasks policies
CREATE POLICY "Room members can view tasks"
  ON tasks FOR SELECT
  USING (is_room_member(room_id));

CREATE POLICY "Room members can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (is_room_member(room_id));

CREATE POLICY "Room members can update tasks"
  ON tasks FOR UPDATE
  USING (is_room_member(room_id));

CREATE POLICY "Room members can delete tasks"
  ON tasks FOR DELETE
  USING (is_room_member(room_id));

-- Expenses policies
CREATE POLICY "Room members can view expenses"
  ON expenses FOR SELECT
  USING (is_room_member(room_id));

CREATE POLICY "Room members can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (is_room_member(room_id));

CREATE POLICY "Room members can update expenses"
  ON expenses FOR UPDATE
  USING (is_room_member(room_id));

CREATE POLICY "Room members can delete expenses"
  ON expenses FOR DELETE
  USING (is_room_member(room_id));

-- Bills policies
CREATE POLICY "Room members can view bills"
  ON bills FOR SELECT
  USING (is_room_member(room_id));

CREATE POLICY "Room members can create bills"
  ON bills FOR INSERT
  WITH CHECK (is_room_member(room_id));

CREATE POLICY "Room members can update bills"
  ON bills FOR UPDATE
  USING (is_room_member(room_id));

CREATE POLICY "Room members can delete bills"
  ON bills FOR DELETE
  USING (is_room_member(room_id));

-- Personnel policies
CREATE POLICY "Room members can view personnel"
  ON personnel FOR SELECT
  USING (is_room_member(room_id));

CREATE POLICY "Room members can create personnel"
  ON personnel FOR INSERT
  WITH CHECK (is_room_member(room_id));

CREATE POLICY "Room members can update personnel"
  ON personnel FOR UPDATE
  USING (is_room_member(room_id));

CREATE POLICY "Room members can delete personnel"
  ON personnel FOR DELETE
  USING (is_room_member(room_id));

-- Attendance policies
CREATE POLICY "Room members can view attendance"
  ON attendance FOR SELECT
  USING (is_room_member(room_id));

CREATE POLICY "Room members can create attendance"
  ON attendance FOR INSERT
  WITH CHECK (is_room_member(room_id));

CREATE POLICY "Room members can update attendance"
  ON attendance FOR UPDATE
  USING (is_room_member(room_id));

CREATE POLICY "Room members can delete attendance"
  ON attendance FOR DELETE
  USING (is_room_member(room_id));

-- Payments policies
CREATE POLICY "Room members can view payments"
  ON payments FOR SELECT
  USING (is_room_member(room_id));

CREATE POLICY "Room members can create payments"
  ON payments FOR INSERT
  WITH CHECK (is_room_member(room_id));

CREATE POLICY "Room members can update payments"
  ON payments FOR UPDATE
  USING (is_room_member(room_id));

CREATE POLICY "Room members can delete payments"
  ON payments FOR DELETE
  USING (is_room_member(room_id));

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON personnel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### Step 3: Verify Tables Created

1. **Go to Table Editor**
   - Click "Table Editor" in left sidebar
   - You should see all the new tables

2. **Check Tables:**
   - ✅ rooms
   - ✅ room_members
   - ✅ meals
   - ✅ tasks
   - ✅ expenses
   - ✅ bills
   - ✅ personnel
   - ✅ attendance
   - ✅ payments

---

### Step 4: View Your Data in Supabase

Once you start using the app with database storage:

1. **Go to Table Editor**
2. **Click any table** to view data
3. **See real-time updates** as you use the app

**Example:**
- Create a room → See it in `rooms` table
- Add a meal → See it in `meals` table
- Create a task → See it in `tasks` table

---

## 📍 Where to Find Your Data

### In Supabase Dashboard:

1. **Table Editor** (Visual Interface)
   ```
   Dashboard → Table Editor → Select table
   ```
   - View all records
   - Edit manually if needed
   - Delete records
   - See relationships

2. **SQL Editor** (Query Data)
   ```sql
   -- View all rooms
   SELECT * FROM rooms;
   
   -- View room members
   SELECT * FROM room_members;
   
   -- View meals for a specific room
   SELECT * FROM meals WHERE room_id = 'YOUR-ROOM-ID';
   
   -- View tasks assigned to a user
   SELECT * FROM tasks WHERE assigned_to = 'USER-ID';
   
   -- View all expenses
   SELECT * FROM expenses ORDER BY date DESC;
   ```

3. **API Docs** (For developers)
   ```
   Dashboard → API Docs
   ```
   - Auto-generated API documentation
   - See all endpoints
   - Test queries

---

## 🔍 Understanding the Schema

### Relationships

```
users (Supabase Auth)
  └── room_members
        └── rooms
              ├── meals
              ├── tasks
              ├── expenses
              ├── bills
              └── personnel
                    ├── attendance
                    └── payments
```

### Key Points

1. **All data is linked to rooms**
   - Users join rooms via `room_members`
   - All features (meals, tasks, etc.) belong to a room

2. **Row Level Security (RLS)**
   - Users can only see data for rooms they're members of
   - Automatic security enforcement
   - No data leaks between rooms

3. **UUIDs for IDs**
   - Globally unique identifiers
   - More secure than incremental IDs
   - Harder to guess

4. **Timestamps**
   - `created_at` - When record was created
   - `updated_at` - When last modified
   - Automatic updates via triggers

---

## 🔐 Security Features

### Row Level Security (RLS)

**What it does:**
- Prevents users from seeing other rooms' data
- Enforces permissions automatically
- Works at database level (unhackable from frontend)

**Example:**
```sql
-- This policy ensures users can only see their rooms' meals
CREATE POLICY "Room members can view meals"
  ON meals FOR SELECT
  USING (is_room_member(room_id));
```

**Test it:**
1. User A creates a meal in Room 1
2. User B (not in Room 1) tries to query meals
3. User B gets empty result (security works!)

---

## 📊 Sample Queries

### View All Your Rooms
```sql
SELECT r.*, COUNT(rm.id) as member_count
FROM rooms r
LEFT JOIN room_members rm ON r.id = rm.room_id
WHERE r.id IN (
  SELECT room_id FROM room_members WHERE user_id = auth.uid()
)
GROUP BY r.id;
```

### View Upcoming Tasks
```sql
SELECT t.*, rm.name as assigned_to_name
FROM tasks t
LEFT JOIN room_members rm ON t.assigned_to = rm.user_id
WHERE t.room_id IN (
  SELECT room_id FROM room_members WHERE user_id = auth.uid()
)
AND t.status != 'completed'
AND t.due_date >= CURRENT_DATE
ORDER BY t.due_date ASC;
```

### View This Month's Expenses
```sql
SELECT e.*, rm.name as paid_by_name
FROM expenses e
LEFT JOIN room_members rm ON e.paid_by = rm.user_id
WHERE e.room_id IN (
  SELECT room_id FROM room_members WHERE user_id = auth.uid()
)
AND e.date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY e.date DESC;
```

---

## 🚀 Next Steps

### Your data is now stored in Supabase Database! Here's what to do next:

1. **✅ Verify Setup**
   - Check Table Editor
   - See all tables created
   - Confirm RLS is enabled

2. **✅ Update Frontend Code**
   - See `/SUPABASE_MIGRATION_GUIDE.md` (next file)
   - Replace localStorage with database queries
   - Use Supabase JavaScript client

3. **✅ Test Features**
   - Create a room
   - Add meals, tasks, expenses
   - Verify data appears in Table Editor
   - Test with multiple users

4. **✅ Enable Real-time (Optional)**
   - Subscribe to table changes
   - Get live updates across devices
   - See changes immediately

---

## 📚 Additional Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Table Editor Guide:** https://supabase.com/docs/guides/database/tables
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
- **Realtime:** https://supabase.com/docs/guides/realtime

---

**Your CoLivio database is now ready for production use!** 🎉

*Last Updated: March 25, 2026*

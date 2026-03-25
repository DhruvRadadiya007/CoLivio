# 📍 CoLivio - Where Is My Data?

## Quick Answer

### Right Now: localStorage (Browser)
### After Setup: Supabase Database (Cloud)

---

## 🔍 Current Data Location: localStorage

### How to View Your Data NOW:

#### Method 1: Browser DevTools

1. **Open DevTools**
   - Press `F12` (Windows/Linux)
   - Or `Cmd + Option + I` (Mac)
   - Or Right-click → Inspect

2. **Go to Application Tab**
   - Click "Application" in top menu
   - If you don't see it, click `>>` to find it

3. **Navigate to Local Storage**
   ```
   Application
     └── Storage
           └── Local Storage
                 └── http://localhost:5173 (or your domain)
   ```

4. **Filter by "colivio"**
   - In the filter box, type: `colivio`
   - You'll see all your data!

#### What You'll See:

```
Key                                    Value
─────────────────────────────────────────────────────────────
colivio_access_token                   "eyJh...token..."
colivio_user:abc123:room               "room_1234567890_xyz"
colivio_room:room_1234...              {"id":"room_1234...","name":"My Room",...}
colivio_room:code:ABC12345             "room_1234567890_xyz"
colivio_meal:room_1234...:meal_xyz     {"id":"meal_xyz","dishName":"Pasta",...}
colivio_task:room_1234...:task_abc     {"id":"task_abc","title":"Clean kitchen",...}
```

#### Method 2: Browser Console

1. **Open Console**
   - Press `F12` → Console tab

2. **Run this command:**
   ```javascript
   // View all CoLivio data
   Object.keys(localStorage)
     .filter(key => key.startsWith('colivio_'))
     .forEach(key => {
       console.log(key, JSON.parse(localStorage.getItem(key) || '{}'));
     });
   ```

3. **View specific data:**
   ```javascript
   // View all rooms
   Object.keys(localStorage)
     .filter(key => key.includes('room:room_'))
     .forEach(key => {
       console.log(JSON.parse(localStorage.getItem(key)));
     });
   
   // View all meals
   Object.keys(localStorage)
     .filter(key => key.includes('meal:'))
     .forEach(key => {
       console.log(JSON.parse(localStorage.getItem(key)));
     });
   
   // View all tasks
   Object.keys(localStorage)
     .filter(key => key.includes('task:'))
     .forEach(key => {
       console.log(JSON.parse(localStorage.getItem(key)));
     });
   ```

#### Method 3: Export All Data

```javascript
// Copy this to console to export all your data
const colivioData = {};
Object.keys(localStorage)
  .filter(key => key.startsWith('colivio_'))
  .forEach(key => {
    try {
      colivioData[key] = JSON.parse(localStorage.getItem(key));
    } catch (e) {
      colivioData[key] = localStorage.getItem(key);
    }
  });
console.log(JSON.stringify(colivioData, null, 2));

// Now you can copy the output from console
```

---

## 🗄️ Future Data Location: Supabase Database

### After Running the SQL Schema:

### How to View Your Data in Supabase:

#### Method 1: Table Editor (Visual)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/xxhiqqamjhkhbykmehnr
   ```

2. **Click "Table Editor"** (left sidebar)

3. **Select a table:**
   - `rooms` - See all rooms
   - `room_members` - See who's in each room
   - `meals` - See all meals
   - `tasks` - See all tasks
   - `expenses` - See all expenses
   - `bills` - See all bills
   - `personnel` - See service staff
   - `attendance` - See attendance records
   - `payments` - See payment records

4. **View the data:**
   - Click any row to edit
   - Use search/filter
   - Sort by columns
   - Export to CSV

#### Method 2: SQL Editor (Query)

1. **Click "SQL Editor"** (left sidebar)

2. **Write queries:**
   ```sql
   -- View all your rooms
   SELECT * FROM rooms;
   
   -- View meals for a specific room
   SELECT * FROM meals 
   WHERE room_id = 'your-room-id'
   ORDER BY day_of_week;
   
   -- View pending tasks
   SELECT * FROM tasks 
   WHERE status = 'pending'
   ORDER BY due_date;
   
   -- View expenses this month
   SELECT * FROM expenses 
   WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
   ORDER BY date DESC;
   
   -- View room with members
   SELECT 
     r.name as room_name,
     r.invite_code,
     COUNT(rm.id) as member_count
   FROM rooms r
   LEFT JOIN room_members rm ON r.id = rm.room_id
   GROUP BY r.id;
   ```

3. **Click "Run"**

4. **See results** in the bottom panel

#### Method 3: API Playground

1. **Click "API Docs"** (left sidebar)

2. **Auto-generated API** for all tables

3. **Test queries:**
   ```
   Get all rooms:
   GET /rest/v1/rooms
   
   Get meals:
   GET /rest/v1/meals?room_id=eq.{roomId}
   
   Get tasks:
   GET /rest/v1/tasks?status=eq.pending
   ```

4. **Copy code** for your app

---

## 📊 Data Structure Comparison

### localStorage Structure:
```
colivio_room:room_123
  {
    "id": "room_123",
    "name": "My Flat",
    "inviteCode": "ABC123",
    "members": [
      {
        "userId": "user_1",
        "name": "John",
        "email": "john@example.com",
        "role": "admin"
      }
    ]
  }

colivio_meal:room_123:meal_456
  {
    "id": "meal_456",
    "roomId": "room_123",
    "dayOfWeek": "Monday",
    "mealType": "dinner",
    "dishName": "Pasta",
    "assignedTo": "user_1"
  }
```

### Database Structure:
```sql
-- rooms table
id          | name     | invite_code | created_at
room_123    | My Flat  | ABC123      | 2026-03-25

-- room_members table
id    | room_id  | user_id | name  | email             | role
1     | room_123 | user_1  | John  | john@example.com  | admin

-- meals table
id       | room_id  | day_of_week | meal_type | dish_name | assigned_to
meal_456 | room_123 | Monday      | dinner    | Pasta     | user_1
```

---

## 🔄 Migration Path

### From localStorage to Database:

#### Option 1: Fresh Start (Easiest)
```
1. Run SQL schema in Supabase
2. Clear localStorage
3. Start using app
4. Data goes to database automatically
```

#### Option 2: Export & Import (Keep existing data)
```
1. Export localStorage data (see Method 3 above)
2. Run SQL schema in Supabase
3. Write import script (manual)
4. Import old data
5. Clear localStorage
6. Use database going forward
```

#### Option 3: Parallel (Both simultaneously)
```
1. Keep localStorage code
2. Add database code
3. Save to both places
4. Gradually migrate
5. Remove localStorage code when done
```

---

## 🔍 Find Specific Data

### Find Your User ID:
```javascript
// localStorage
localStorage.getItem('access_token')
// Decode the JWT to get user ID

// Or check any room_member entry
Object.keys(localStorage)
  .filter(key => key.includes('room:room_'))
  .map(key => JSON.parse(localStorage.getItem(key)))
  .map(room => room.members)
  .flat()
```

### Find Your Room ID:
```javascript
// localStorage
Object.keys(localStorage)
  .filter(key => key.includes('user:'))
  .forEach(key => {
    console.log('Room ID:', localStorage.getItem(key));
  });
```

### Find All Meals:
```javascript
// localStorage
Object.keys(localStorage)
  .filter(key => key.includes('meal:'))
  .map(key => JSON.parse(localStorage.getItem(key)));
```

### Find All Tasks:
```javascript
// localStorage
Object.keys(localStorage)
  .filter(key => key.includes('task:'))
  .map(key => JSON.parse(localStorage.getItem(key)));
```

---

## 📍 Data Location Summary

### Current Setup (localStorage):
```
Location:      Your browser
Access:        F12 → Application → Local Storage
Persistence:   Until cache cleared
Sync:          No (one device only)
Backup:        No (manual export only)
Collaboration: Limited (same browser only)
```

### Future Setup (Supabase Database):
```
Location:      Cloud (Supabase servers)
Access:        Dashboard → Table Editor
Persistence:   Permanent (cloud storage)
Sync:          Yes (all devices)
Backup:        Yes (automatic)
Collaboration: Full (real-time multi-user)
```

---

## 🛠️ Debugging Tips

### Data Not Showing?

1. **Check localStorage:**
   ```javascript
   console.log('Total items:', localStorage.length);
   console.log('CoLivio items:', 
     Object.keys(localStorage)
       .filter(key => key.startsWith('colivio_'))
       .length
   );
   ```

2. **Check if data exists:**
   ```javascript
   // Check for rooms
   const hasRooms = Object.keys(localStorage)
     .some(key => key.includes('room:room_'));
   console.log('Has rooms:', hasRooms);
   ```

3. **Verify room ID:**
   ```javascript
   const userRoomKey = Object.keys(localStorage)
     .find(key => key.startsWith('colivio_user:'));
   const roomId = localStorage.getItem(userRoomKey);
   console.log('Current room:', roomId);
   ```

### Clear Specific Data:

```javascript
// Clear all CoLivio data
Object.keys(localStorage)
  .filter(key => key.startsWith('colivio_'))
  .forEach(key => localStorage.removeItem(key));

// Clear only meals
Object.keys(localStorage)
  .filter(key => key.includes('meal:'))
  .forEach(key => localStorage.removeItem(key));

// Clear only tasks
Object.keys(localStorage)
  .filter(key => key.includes('task:'))
  .forEach(key => localStorage.removeItem(key));
```

---

## 📊 Data Size Check

### See how much space you're using:

```javascript
function getLocalStorageSize() {
  let total = 0;
  let colivioSize = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const size = localStorage[key].length + key.length;
      total += size;
      if (key.startsWith('colivio_')) {
        colivioSize += size;
      }
    }
  }
  
  console.log('Total localStorage:', (total / 1024).toFixed(2), 'KB');
  console.log('CoLivio data:', (colivioSize / 1024).toFixed(2), 'KB');
  console.log('Percentage:', ((colivioSize / total) * 100).toFixed(1), '%');
}

getLocalStorageSize();
```

---

## ✅ Quick Reference

### Where is my...

| Data Type | localStorage Key Pattern | Database Table |
|-----------|-------------------------|----------------|
| User info | `colivio_user:{userId}:room` | `room_members` |
| Rooms | `colivio_room:{roomId}` | `rooms` |
| Invite codes | `colivio_room:code:{code}` | `rooms.invite_code` |
| Meals | `colivio_meal:{roomId}:{mealId}` | `meals` |
| Tasks | `colivio_task:{roomId}:{taskId}` | `tasks` |
| Expenses | `colivio_expense:{roomId}:{expId}` | `expenses` |
| Bills | `colivio_bill:{roomId}:{billId}` | `bills` |
| Personnel | `colivio_personnel:{roomId}:{personId}` | `personnel` |
| Attendance | `colivio_attendance:{roomId}:{attId}` | `attendance` |
| Payments | `colivio_payment:{roomId}:{payId}` | `payments` |

---

**Now you know exactly where all your CoLivio data is stored!** 🎉

*Last Updated: March 25, 2026*

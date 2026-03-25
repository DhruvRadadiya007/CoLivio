Design a complete mobile application UI called "Group Living Manager" for bachelors living in shared spaces (flats, PGs, rented houses).

Goal:
An all-in-one platform to manage meals, tasks, expenses, recurring bills, and service personnel with full CRUD operations and role-based access.

-----------------------------------

🔐 AUTHENTICATION SYSTEM

1. Signup (CREATE)
- Fields:
  - Name
  - Email
  - Password
- Validation:
  - Email format
  - Password strength
- Success message after signup

2. Login (READ)
- Email + Password
- Error handling (invalid credentials)

3. Forgot Password (UPDATE)
- Email input
- Reset link/message

4. Logout

-----------------------------------

👤 USER PROFILE MANAGEMENT (CRUD)

1. View Profile (READ)
- Name, Email, Role, Room Name

2. Edit Profile (UPDATE)
- Name
- Profile picture

-----------------------------------

🏠 ROOM MANAGEMENT (CRUD + ADMIN CONTROL)

Roles:
- Admin (multiple allowed)
- Member

1. Create Room (CREATE)
- Room name
- Auto assign creator as Admin

2. Join Room (READ)
- Join via code/invite

3. View Room Details (READ)
- Room name
- Member count
- Member list

4. Add Member (CREATE - Admin only)
- Name, Email/Phone

5. Update Member Role (UPDATE - Admin only)
- Promote to Admin
- Demote to Member

6. Remove Member (DELETE - Admin only)
- Confirmation required

7. Leave Room (DELETE self)

Rules:
- At least one admin must exist
- Admin cannot remove themselves without transfer
- Multiple admins supported

-----------------------------------

🍱 WEEKLY MEAL PLANNER (CRUD)

1. Create Weekly Menu (CREATE)
- Days: Monday to Sunday
- Meals: Breakfast, Lunch, Dinner

2. View Menu (READ)

3. Update Menu (UPDATE)

4. Delete/Reset Menu (DELETE)

-----------------------------------

🧹 TASK MANAGEMENT (CRUD + RECURRING)

1. Create Task (CREATE)
- Task name
- Assign member
- Deadline
- Recurring toggle (daily/weekly)

2. View Tasks (READ)
- Filter: Today / Weekly

3. Update Task (UPDATE)
- Reassign / change status

4. Delete Task (DELETE)

5. Task Status Tracking
- Pending / Completed

-----------------------------------

💸 EXPENSE MANAGEMENT (CRUD)

1. Add Expense (CREATE)
- Title
- Amount
- Paid by
- Split among members

2. View Expenses (READ)

3. Update Expense (UPDATE)

4. Delete Expense (DELETE)

5. Auto Split Calculation

6. Monthly Summary

-----------------------------------

🧾 RECURRING BILL MANAGEMENT (CRUD)

1. Add Bill (CREATE)
- Name (Rent, Electricity, WiFi)
- Amount
- Due date
- Recurring toggle

2. View Bills (READ)

3. Update Bill (UPDATE)

4. Delete Bill (DELETE)

5. Payment Status
- Paid / Pending

6. Reminders for due bills

-----------------------------------

👨‍💼 SERVICE PERSONNEL MANAGEMENT (CRUD)

1. Add Service Personnel (CREATE)
- Name
- Role (Cook, Cleaner, etc.)
- Monthly compensation

2. View Personnel (READ)

3. Update Personnel (UPDATE)

4. Remove Personnel (DELETE)

-----------------------------------

📅 ATTENDANCE MANAGEMENT SYSTEM

1. Mark Attendance
- Present
- Absent
- Leave

2. Leave Entry
- Reason input

3. Monthly Attendance Summary

4. Restriction:
- One entry per day per personnel

-----------------------------------

💰 COMPENSATION TRACKING

1. Track monthly salary
2. Payment status (Paid / Pending)
3. Add to total expenses

-----------------------------------

⚖️ FAIRNESS & ANALYTICS

1. Track:
- Tasks completed per member
- Expenses paid per member
- Contribution comparison

2. Visual charts

3. Highlight imbalance

-----------------------------------

📊 DASHBOARD

Show:
- Today’s meals
- Today’s tasks
- Pending bills
- Total expenses
- Attendance summary

-----------------------------------

🔔 NOTIFICATIONS & REMINDERS

- Task reminders
- Bill due reminders
- Attendance alerts
- Payment reminders

-----------------------------------

🎨 UI COMPONENTS

- Cards layout
- Floating Action Button (+)
- Bottom navigation bar
- Modals (confirmation)
- Dropdowns
- Date pickers
- Toggles

-----------------------------------

⚠️ EDGE CASES & VALIDATIONS

- Prevent deleting last admin
- Prevent duplicate attendance
- Input validations
- Empty states (no data)
- Error & success messages
- Loading states

-----------------------------------

🔄 COMPLETE USER FLOW

1. User signs up / logs in
2. Creates or joins a room
3. Adds members
4. Sets weekly meal plan
5. Assigns tasks
6. Tracks expenses
7. Adds recurring bills
8. Manages service personnel
9. Tracks attendance & payments
10. Views analytics dashboard

-----------------------------------

Focus on:
- Real-world usability
- Clean UX
- Logical flow
- Scalable architecture
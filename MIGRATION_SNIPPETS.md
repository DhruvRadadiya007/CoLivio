# Quick Migration Snippets for Remaining Components

## ExpenseTracker.tsx

### Import Changes
```tsx
// Add to imports
import { expenseAPI } from '../../services/api';
const { currentRoom, expenses, refreshData } = useApp();
const [loading, setLoading] = useState(false);
```

### Add Expense Handler
```tsx
const handleAddExpense = async () => {
  if (!currentRoom || !title.trim() || !amount || !paidBy) {
    toast.error('Please fill all required fields');
    return;
  }

  setLoading(true);
  try {
    await expenseAPI.createExpense({
      title,
      amount: parseFloat(amount),
      paidBy,
      splitAmong: selectedMembers,
      date: date || new Date().toISOString().split('T')[0],
      roomId: currentRoom.id,
    });
    
    await refreshData();
    setShowAddExpense(false);
    resetForm();
    toast.success('Expense added successfully!');
  } catch (error: any) {
    console.error('Add expense error:', error);
    toast.error(error.message || 'Failed to add expense');
  } finally {
    setLoading(false);
  }
};
```

### Update Expense Handler
```tsx
const handleUpdateExpense = async (expenseId: string, updates: any) => {
  if (!currentRoom) return;

  setLoading(true);
  try {
    await expenseAPI.updateExpense(currentRoom.id, expenseId, updates);
    await refreshData();
    toast.success('Expense updated!');
  } catch (error: any) {
    console.error('Update expense error:', error);
    toast.error(error.message || 'Failed to update expense');
  } finally {
    setLoading(false);
  }
};
```

### Delete Expense Handler
```tsx
const handleDeleteExpense = async (expenseId: string) => {
  if (!currentRoom) return;

  setLoading(true);
  try {
    await expenseAPI.deleteExpense(currentRoom.id, expenseId);
    await refreshData();
    toast.success('Expense deleted!');
  } catch (error: any) {
    console.error('Delete expense error:', error);
    toast.error(error.message || 'Failed to delete expense');
  } finally {
    setLoading(false);
  }
};
```

---

## BillManager.tsx

### Import Changes
```tsx
// Add to imports
import { billAPI } from '../../services/api';
const { currentRoom, bills, refreshData } = useApp();
const [loading, setLoading] = useState(false);
```

### Add Bill Handler
```tsx
const handleAddBill = async () => {
  if (!currentRoom || !billName.trim() || !amount || !dueDate) {
    toast.error('Please fill all required fields');
    return;
  }

  setLoading(true);
  try {
    await billAPI.createBill({
      name: billName,
      amount: parseFloat(amount),
      dueDate,
      recurring: isRecurring,
      status: 'pending',
      roomId: currentRoom.id,
    });
    
    await refreshData();
    setShowAddBill(false);
    resetForm();
    toast.success('Bill added successfully!');
  } catch (error: any) {
    console.error('Add bill error:', error);
    toast.error(error.message || 'Failed to add bill');
  } finally {
    setLoading(false);
  }
};
```

### Mark Bill as Paid Handler
```tsx
const handleToggleBillStatus = async (billId: string) => {
  if (!currentRoom) return;

  const bill = bills.find(b => b.id === billId);
  if (!bill) return;

  setLoading(true);
  try {
    const newStatus = bill.status === 'pending' ? 'paid' : 'pending';
    await billAPI.updateBill(currentRoom.id, billId, { status: newStatus });
    await refreshData();
    toast.success(`Bill marked as ${newStatus}!`);
  } catch (error: any) {
    console.error('Toggle bill status error:', error);
    toast.error(error.message || 'Failed to update bill');
  } finally {
    setLoading(false);
  }
};
```

### Delete Bill Handler
```tsx
const handleDeleteBill = async (billId: string) => {
  if (!currentRoom) return;

  setLoading(true);
  try {
    await billAPI.deleteBill(currentRoom.id, billId);
    await refreshData();
    toast.success('Bill deleted!');
  } catch (error: any) {
    console.error('Delete bill error:', error);
    toast.error(error.message || 'Failed to delete bill');
  } finally {
    setLoading(false);
  }
};
```

---

## PersonnelManager.tsx

### Import Changes
```tsx
// Add to imports
import { personnelAPI, attendanceAPI, paymentAPI } from '../../services/api';
const { currentRoom, personnel, attendance, payments, refreshData } = useApp();
const [loading, setLoading] = useState(false);
```

### Add Personnel Handler
```tsx
const handleAddPersonnel = async () => {
  if (!currentRoom || !name.trim() || !role.trim() || !monthlyCompensation) {
    toast.error('Please fill all required fields');
    return;
  }

  setLoading(true);
  try {
    await personnelAPI.createPersonnel({
      name,
      role,
      monthlyCompensation: parseFloat(monthlyCompensation),
      roomId: currentRoom.id,
    });
    
    await refreshData();
    setShowAddPersonnel(false);
    resetForm();
    toast.success('Personnel added successfully!');
  } catch (error: any) {
    console.error('Add personnel error:', error);
    toast.error(error.message || 'Failed to add personnel');
  } finally {
    setLoading(false);
  }
};
```

### Mark Attendance Handler
```tsx
const handleMarkAttendance = async (personnelId: string, date: string, status: 'present' | 'absent' | 'leave', leaveReason?: string) => {
  if (!currentRoom) return;

  setLoading(true);
  try {
    // Check if attendance already exists for this date
    const existingAttendance = attendance.find(
      a => a.personnelId === personnelId && a.date === date
    );

    await attendanceAPI.saveAttendance({
      id: existingAttendance?.id,
      personnelId,
      date,
      status,
      leaveReason,
      roomId: currentRoom.id,
    });
    
    await refreshData();
    toast.success('Attendance marked!');
  } catch (error: any) {
    console.error('Mark attendance error:', error);
    toast.error(error.message || 'Failed to mark attendance');
  } finally {
    setLoading(false);
  }
};
```

### Add Payment Handler
```tsx
const handleAddPayment = async (personnelId: string, month: string, amount: number) => {
  if (!currentRoom) return;

  setLoading(true);
  try {
    await paymentAPI.savePayment({
      personnelId,
      month,
      amount,
      status: 'paid',
      roomId: currentRoom.id,
    });
    
    await refreshData();
    toast.success('Payment recorded!');
  } catch (error: any) {
    console.error('Add payment error:', error);
    toast.error(error.message || 'Failed to record payment');
  } finally {
    setLoading(false);
  }
};
```

### Update Payment Status Handler
```tsx
const handleTogglePaymentStatus = async (paymentId: string) => {
  if (!currentRoom) return;

  const payment = payments.find(p => p.id === paymentId);
  if (!payment) return;

  setLoading(true);
  try {
    const newStatus = payment.status === 'pending' ? 'paid' : 'pending';
    await paymentAPI.updatePayment(currentRoom.id, paymentId, { status: newStatus });
    await refreshData();
    toast.success(`Payment marked as ${newStatus}!`);
  } catch (error: any) {
    console.error('Toggle payment status error:', error);
    toast.error(error.message || 'Failed to update payment');
  } finally {
    setLoading(false);
  }
};
```

### Delete Personnel Handler
```tsx
const handleDeletePersonnel = async (personnelId: string) => {
  if (!currentRoom) return;

  setLoading(true);
  try {
    await personnelAPI.deletePersonnel(currentRoom.id, personnelId);
    await refreshData();
    toast.success('Personnel deleted!');
  } catch (error: any) {
    console.error('Delete personnel error:', error);
    toast.error(error.message || 'Failed to delete personnel');
  } finally {
    setLoading(false);
  }
};
```

---

## Profile.tsx (If it has edit functionality)

### Update Profile Handler
```tsx
// If you add a user update endpoint to the backend, use this pattern:

const handleUpdateProfile = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        name: profileName,
        // other profile fields
      }),
    });

    if (!response.ok) throw new Error('Failed to update profile');
    
    const { user } = await response.json();
    setUser(user);
    toast.success('Profile updated!');
  } catch (error: any) {
    console.error('Update profile error:', error);
    toast.error(error.message || 'Failed to update profile');
  } finally {
    setLoading(false);
  }
};
```

---

## General Pattern for All Components

### 1. Remove localStorage operations
```tsx
// ❌ OLD
const updatedItems = [...items, newItem];
setItems(updatedItems);

// ✅ NEW
await itemAPI.createItem(newItem);
await refreshData();
```

### 2. Add loading states
```tsx
// Add to component state
const [loading, setLoading] = useState(false);

// Wrap API calls
setLoading(true);
try {
  // API call
} catch (error) {
  // Handle error
} finally {
  setLoading(false);
}

// Update buttons
<button disabled={loading}>
  {loading ? 'Saving...' : 'Save'}
</button>
```

### 3. Add error handling
```tsx
try {
  await someAPI.operation();
  toast.success('Success message');
} catch (error: any) {
  console.error('Operation error:', error);
  toast.error(error.message || 'Operation failed');
}
```

### 4. Call refreshData()
```tsx
// After any create/update/delete operation
await refreshData();
```

---

## Testing Checklist

For each updated component, test:

- [ ] Create new item
- [ ] Update existing item
- [ ] Delete item
- [ ] Loading states appear
- [ ] Error messages show correctly
- [ ] Success toasts appear
- [ ] Data persists after refresh
- [ ] Multi-user: Changes visible to other users (after they refresh)

---

## Quick Reference: API Functions

### All API functions available:

```tsx
// Auth
authAPI.signup(email, password, name)
authAPI.signin(email, password)
authAPI.getSession()
authAPI.signout()

// Rooms
roomAPI.createRoom(name)
roomAPI.joinRoom(inviteCode)
roomAPI.getRoom(roomId)
roomAPI.leaveRoom(roomId)

// Meals
mealAPI.getMeals(roomId)
mealAPI.saveMeal(meal)
mealAPI.deleteMeal(roomId, mealId)

// Tasks
taskAPI.getTasks(roomId)
taskAPI.createTask(task)
taskAPI.updateTask(roomId, taskId, updates)
taskAPI.deleteTask(roomId, taskId)

// Expenses
expenseAPI.getExpenses(roomId)
expenseAPI.createExpense(expense)
expenseAPI.updateExpense(roomId, expenseId, updates)
expenseAPI.deleteExpense(roomId, expenseId)

// Bills
billAPI.getBills(roomId)
billAPI.createBill(bill)
billAPI.updateBill(roomId, billId, updates)
billAPI.deleteBill(roomId, billId)

// Personnel
personnelAPI.getPersonnel(roomId)
personnelAPI.createPersonnel(person)
personnelAPI.updatePersonnel(roomId, personId, updates)
personnelAPI.deletePersonnel(roomId, personId)

// Attendance
attendanceAPI.getAttendance(roomId)
attendanceAPI.saveAttendance(record)

// Payments
paymentAPI.getPayments(roomId)
paymentAPI.savePayment(payment)
paymentAPI.updatePayment(roomId, paymentId, updates)
```

---

## Common Mistakes to Avoid

1. **Forgetting to await**: Always await API calls
2. **Not calling refreshData()**: Data won't update without it
3. **Missing error handling**: Wrap in try/catch
4. **No loading states**: Users need feedback
5. **Forgetting roomId**: Most operations need it
6. **Not checking currentRoom**: Always check if room exists

---

**Good luck with the migration! Follow these patterns and you'll have all components integrated in no time! 🚀**

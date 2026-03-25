import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { mealAPI } from '../../services/api';
import { UtensilsCrossed, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const MealPlanner = () => {
  const { currentRoom, meals, setMeals, refreshData } = useApp();
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, { breakfast: string; lunch: string; dinner: string }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentRoom) {
      const plan: Record<string, { breakfast: string; lunch: string; dinner: string }> = {};
      DAYS.forEach(day => {
        const meal = meals.find(m => m.roomId === currentRoom.id && m.day === day);
        plan[day] = {
          breakfast: meal?.breakfast || '',
          lunch: meal?.lunch || '',
          dinner: meal?.dinner || '',
        };
      });
      setWeeklyPlan(plan);
    }
  }, [currentRoom, meals]);

  const handleMealChange = (day: string, mealType: 'breakfast' | 'lunch' | 'dinner', value: string) => {
    setWeeklyPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!currentRoom) return;

    setLoading(true);
    try {
      // Save all meals for the week
      const savePromises = DAYS.map(async (day) => {
        const plan = weeklyPlan[day];
        if (plan.breakfast || plan.lunch || plan.dinner) {
          const existingMeal = meals.find(m => m.roomId === currentRoom.id && m.day === day);
          return await mealAPI.saveMeal({
            id: existingMeal?.id || undefined,
            roomId: currentRoom.id,
            day,
            breakfast: plan.breakfast,
            lunch: plan.lunch,
            dinner: plan.dinner,
          });
        }
      });

      await Promise.all(savePromises);
      await refreshData();
      toast.success('Meal plan saved successfully!');
    } catch (error: any) {
      console.error('Save meal plan error:', error);
      toast.error(error.message || 'Failed to save meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!currentRoom) return;
    
    setLoading(true);
    try {
      // Delete all meals for current room
      const deletePromises = meals
        .filter(m => m.roomId === currentRoom.id)
        .map(m => mealAPI.deleteMeal(currentRoom.id, m.id));
      
      await Promise.all(deletePromises);
      await refreshData();
      
      const emptyPlan: Record<string, { breakfast: string; lunch: string; dinner: string }> = {};
      DAYS.forEach(day => {
        emptyPlan[day] = { breakfast: '', lunch: '', dinner: '' };
      });
      setWeeklyPlan(emptyPlan);
      toast.success('Meal plan reset!');
    } catch (error: any) {
      console.error('Reset meal plan error:', error);
      toast.error(error.message || 'Failed to reset meal plan');
    } finally {
      setLoading(false);
    }
  };

  if (!currentRoom) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <UtensilsCrossed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Room Selected</h2>
        <p className="text-gray-600">Please create or join a room first</p>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Meal Planner</h1>
          <p className="text-gray-600 mt-1">Plan your meals for the entire week</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span className="hidden sm:inline">{loading ? 'Saving...' : 'Save Plan'}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {DAYS.map(day => (
          <div key={day} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{day}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Breakfast</label>
                <input
                  type="text"
                  value={weeklyPlan[day]?.breakfast || ''}
                  onChange={(e) => handleMealChange(day, 'breakfast', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Oatmeal with fruits"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lunch</label>
                <input
                  type="text"
                  value={weeklyPlan[day]?.lunch || ''}
                  onChange={(e) => handleMealChange(day, 'lunch', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Grilled chicken salad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dinner</label>
                <input
                  type="text"
                  value={weeklyPlan[day]?.dinner || ''}
                  onChange={(e) => handleMealChange(day, 'dinner', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Pasta with vegetables"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

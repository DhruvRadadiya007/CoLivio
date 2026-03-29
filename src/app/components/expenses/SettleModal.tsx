import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ArrowRight, DollarSign, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { splitSettlementAPI } from '../../services/api';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultData?: {
    fromUserId: string;
    toUserId: string;
    amount: number;
  };
}

export const SettleModal = ({ isOpen, onClose, defaultData }: SettleModalProps) => {
  const { currentRoom, refreshData, currency } = useApp();
  const [loading, setLoading] = useState(false);
  
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (defaultData) {
      setFromUserId(defaultData.fromUserId);
      setToUserId(defaultData.toUserId);
      setAmount(defaultData.amount.toFixed(2));
    }
  }, [defaultData]);

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  const handleSubmit = async () => {
    if (!currentRoom || !fromUserId || !toUserId || !amount) {
      toast.error('Please fill all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (fromUserId === toUserId) {
      toast.error('Cannot settle with yourself');
      return;
    }

    setLoading(true);
    try {
      await splitSettlementAPI.createSettlement({
        roomId: currentRoom.id,
        fromUserId,
        toUserId,
        amount: numAmount,
        note: note.trim() || undefined,
      });

      toast.success('Payment recorded');
      await refreshData();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fromUser = currentRoom?.members.find(m => m.userId === fromUserId);
  const toUser = currentRoom?.members.find(m => m.userId === toUserId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Record Payment
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Visual flow */}
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl ring-4 ring-red-50">
                {fromUser?.name?.[0].toUpperCase() || '?'}
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">From</span>
            </div>
            <ArrowRight className="h-8 w-8 text-gray-300" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl ring-4 ring-green-50">
                {toUser?.name?.[0].toUpperCase() || '?'}
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">To</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Who Paid?</label>
                <select
                  value={fromUserId}
                  onChange={(e) => setFromUserId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                >
                  <option value="">Select member</option>
                  {currentRoom?.members.map(m => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Who Received?</label>
                <select
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                >
                  <option value="">Select member</option>
                  {currentRoom?.members.map(m => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount ({currencySymbol})</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-2xl font-bold text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Sent via Venmo"
                rows={2}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Save Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

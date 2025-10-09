'use client';

import React, { useState } from 'react';
import { useTrade } from '../context/TradeContext';
import { useToast } from './Toast';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddPendingTradeModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddPendingTradeModal: React.FC<AddPendingTradeModalProps> = ({
  sessionId,
  isOpen,
  onClose,
}) => {
  const { addTrade } = useTrade();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    pairName: '',
    entryPrice: '',
    investment: '',
    type: 'buy' as 'buy' | 'sell',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await addTrade({
        sessionId,
        pairName: formData.pairName,
        entryPrice: parseFloat(formData.entryPrice),
        investment: parseFloat(formData.investment),
        type: formData.type,
        status: 'pending',
        date: new Date().toISOString(),
      });

      if (result.success) {
        showToast('Pending trade added successfully', 'success');
        setFormData({
          pairName: '',
          entryPrice: '',
          investment: '',
          type: 'buy',
        });
        onClose();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Failed to add pending trade', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Pending Trade</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="pairName" className="block text-sm font-medium text-gray-700 mb-2">
                    Pair Name
                  </label>
                  <input
                    type="text"
                    id="pairName"
                    name="pairName"
                    value={formData.pairName}
                    onChange={handleChange}
                    required
                    placeholder="e.g., BTC/USD"
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Price
                  </label>
                  <input
                    type="number"
                    id="entryPrice"
                    name="entryPrice"
                    value={formData.entryPrice}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="e.g., 50000"
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="investment" className="block text-sm font-medium text-gray-700 mb-2">
                    Investment/Stake ($)
                  </label>
                  <input
                    type="number"
                    id="investment"
                    name="investment"
                    value={formData.investment}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="e.g., 700"
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Trade Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex items-center space-x-2 flex-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmitting ? 'Adding...' : 'Add Trade'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

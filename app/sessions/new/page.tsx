'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { PageLoader } from '../../components/LoadingSpinner';
import { useToast } from '../../components/Toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

export default function NewSessionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { createSession } = useSession();
  const { showToast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    capital: '',
    totalTrades: '',
    accuracy: '',
    riskRewardRatio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createSession({
        name: formData.name,
        capital: parseFloat(formData.capital),
        totalTrades: parseInt(formData.totalTrades),
        accuracy: parseFloat(formData.accuracy),
        riskRewardRatio: parseFloat(formData.riskRewardRatio),
        status: 'active'
      });

      if (result.success) {
        showToast(result.message, 'success');
        router.push('/sessions');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Failed to create session', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Link
              href="/sessions"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Session</h1>
              <p className="text-gray-600 mt-1">Set up a new trading session with your goals</p>
            </div>
          </div>

          {/* Form */}
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Bitcoin Trading Q1 2025"
                  className="input-field"
                />
              </div>

              {/* Initial Capital */}
              <div>
                <label htmlFor="capital" className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Capital ($)
                </label>
                <input
                  type="number"
                  id="capital"
                  name="capital"
                  value={formData.capital}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="e.g., 10000"
                  className="input-field"
                />
              </div>

              {/* Target Trades */}
              <div>
                <label htmlFor="totalTrades" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Number of Trades
                </label>
                <input
                  type="number"
                  id="totalTrades"
                  name="totalTrades"
                  value={formData.totalTrades}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="e.g., 10"
                  className="input-field"
                />
                <p className="mt-1 text-sm text-gray-500">
                  How many trades do you plan to execute in this session?
                </p>
              </div>

              {/* Required Accuracy */}
              <div>
                <label htmlFor="accuracy" className="block text-sm font-medium text-gray-700 mb-2">
                  Required Accuracy (%)
                </label>
                <input
                  type="number"
                  id="accuracy"
                  name="accuracy"
                  value={formData.accuracy}
                  onChange={handleChange}
                  required
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g., 40"
                  className="input-field"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Your target win rate percentage (ITM)
                </p>
              </div>

              {/* Risk Reward Ratio */}
              <div>
                <label htmlFor="riskRewardRatio" className="block text-sm font-medium text-gray-700 mb-2">
                  Risk-Reward Ratio
                </label>
                <input
                  type="number"
                  id="riskRewardRatio"
                  name="riskRewardRatio"
                  value={formData.riskRewardRatio}
                  onChange={handleChange}
                  required
                  step="0.1"
                  min="0.1"
                  placeholder="e.g., 1"
                  className="input-field"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Your target risk-reward ratio (e.g., 1 means 1:1, 2 means 2:1)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Create Session'}</span>
                </button>
                <Link
                  href="/sessions"
                  className="btn-secondary"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <h4 className="font-medium text-blue-900 mb-2">💡 Trading Session Tips</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Set realistic accuracy targets based on your strategy (typically 40-70%)</li>
              <li>• Aim for a risk-reward ratio of at least 1:1, preferably 1:2 or higher</li>
              <li>• Start with a smaller number of trades to test your strategy</li>
              <li>• Track your actual performance against these targets to improve over time</li>
            </ul>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

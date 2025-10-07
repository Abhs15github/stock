'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTrade } from '../context/TradeContext';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { LoadingSpinner, PageLoader } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Target
} from 'lucide-react';
import { Trade } from '../types';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export default function TradesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { trades, addTrade, updateTrade, deleteTrade, getTradeStats } = useTrade();
  const { showToast } = useToast();
  const router = useRouter();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'pair' | 'profit'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'profit' | 'loss'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  const tradeStats = getTradeStats();

  // Filter and sort trades
  const filteredTrades = trades
    .filter(trade => {
      const matchesSearch = trade.pairName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'profit' && trade.profitOrLoss > 0) ||
        (filterType === 'loss' && trade.profitOrLoss < 0);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'pair':
          comparison = a.pairName.localeCompare(b.pairName);
          break;
        case 'profit':
          comparison = a.profitOrLoss - b.profitOrLoss;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (field: 'date' | 'pair' | 'profit') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setShowEditModal(true);
  };

  const handleDelete = async (trade: Trade) => {
    if (window.confirm(`Are you sure you want to delete the ${trade.pairName} trade?`)) {
      try {
        const result = await deleteTrade(trade.id);
        if (result.success) {
          showToast('Trade deleted successfully', 'success');
        } else {
          showToast(result.message, 'error');
        }
      } catch (error) {
        showToast('Failed to delete trade', 'error');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatPrice = (price: number) => {
    return price < 1 ? price.toFixed(6) : price.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trade Tracker</h1>
                <p className="mt-2 text-gray-600">
                  Manage and analyze your trading performance
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 sm:mt-0 btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Trade</span>
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trades</p>
                  <p className="text-2xl font-bold text-gray-900">{tradeStats.totalTrades}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Profit</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(tradeStats.totalProfit)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Loss</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(tradeStats.totalLoss)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit %</p>
                  <p className={`text-2xl font-bold ${tradeStats.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tradeStats.profitPercentage >= 0 ? '+' : ''}{tradeStats.profitPercentage.toFixed(1)}%
                  </p>
                </div>
                <DollarSign className={`w-8 h-8 ${tradeStats.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by trading pair..."
                    className="input-field pl-10"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as 'all' | 'profit' | 'loss');
                    setCurrentPage(1);
                  }}
                  className="input-field w-auto"
                >
                  <option value="all">All Trades</option>
                  <option value="profit">Profitable</option>
                  <option value="loss">Loss</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Trades Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card"
          >
            {filteredTrades.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {trades.length === 0 ? 'No trades yet' : 'No trades match your search'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {trades.length === 0
                    ? 'Start tracking your trading performance by adding your first trade.'
                    : 'Try adjusting your search criteria or filters.'
                  }
                </p>
                {trades.length === 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary"
                  >
                    Add Your First Trade
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('pair')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Trading Pair</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entry / Exit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Investment
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('profit')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Profit/Loss</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Date</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTrades.map((trade, index) => (
                        <motion.tr
                          key={trade.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{trade.pairName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              trade.type === 'buy'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {trade.type === 'buy' ? 'Long' : 'Short'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div>${formatPrice(trade.entryPrice)}</div>
                              <div className="text-gray-500">${formatPrice(trade.exitPrice)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(trade.investment)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {trade.profitOrLoss >= 0 ? (
                                <ArrowUpRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4 text-red-600" />
                              )}
                              <div>
                                <div className={`text-sm font-medium ${
                                  trade.profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {trade.profitOrLoss >= 0 ? '+' : ''}{formatCurrency(trade.profitOrLoss)}
                                </div>
                                <div className={`text-xs ${
                                  trade.profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {trade.profitOrLossPercentage >= 0 ? '+' : ''}{trade.profitOrLossPercentage.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">{formatDate(trade.date)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEdit(trade)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(trade)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredTrades.length)} of {filteredTrades.length} trades
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn-secondary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="btn-secondary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </main>

      {/* Add Trade Modal */}
      {showAddModal && (
        <TradeModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            showToast('Trade added successfully!', 'success');
          }}
        />
      )}

      {/* Edit Trade Modal */}
      {showEditModal && editingTrade && (
        <TradeModal
          mode="edit"
          trade={editingTrade}
          onClose={() => {
            setShowEditModal(false);
            setEditingTrade(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingTrade(null);
            showToast('Trade updated successfully!', 'success');
          }}
        />
      )}
    </div>
  );
}

// Trade Modal Component
const TradeModal: React.FC<{
  mode: 'add' | 'edit';
  trade?: Trade;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ mode, trade, onClose, onSuccess }) => {
  const { addTrade, updateTrade } = useTrade();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pairName: trade?.pairName || '',
    entryPrice: trade?.entryPrice.toString() || '',
    exitPrice: trade?.exitPrice.toString() || '',
    investment: trade?.investment.toString() || '',
    date: trade?.date || new Date().toISOString().split('T')[0],
    type: trade?.type || 'buy' as 'buy' | 'sell',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const tradeData = {
        pairName: formData.pairName,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: parseFloat(formData.exitPrice),
        investment: parseFloat(formData.investment),
        date: formData.date,
        type: formData.type,
      };

      let result;
      if (mode === 'add') {
        result = await addTrade(tradeData);
      } else if (trade) {
        result = await updateTrade(trade.id, tradeData);
      }

      if (result && result.success) {
        onSuccess();
      } else {
        showToast(result?.message || 'Operation failed', 'error');
      }
    } catch (error) {
      showToast(`Failed to ${mode} trade`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Calculate profit/loss preview
  const calculatePreview = () => {
    const entry = parseFloat(formData.entryPrice) || 0;
    const exit = parseFloat(formData.exitPrice) || 0;
    const investment = parseFloat(formData.investment) || 0;

    if (entry > 0 && exit > 0 && investment > 0) {
      let profit: number;
      if (formData.type === 'buy') {
        profit = ((exit - entry) / entry) * investment;
      } else {
        profit = ((entry - exit) / entry) * investment;
      }

      const percentage = (profit / investment) * 100;
      return { profit, percentage };
    }

    return { profit: 0, percentage: 0 };
  };

  const preview = calculatePreview();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {mode === 'add' ? 'Add New Trade' : 'Edit Trade'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pairName" className="block text-sm font-medium text-gray-700 mb-1">
                Trading Pair
              </label>
              <input
                type="text"
                id="pairName"
                name="pairName"
                required
                className="input-field"
                placeholder="e.g., BTC/USDT"
                value={formData.pairName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Trade Type
              </label>
              <select
                id="type"
                name="type"
                className="input-field"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="buy">Buy (Long)</option>
                <option value="sell">Sell (Short)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Price ($)
                </label>
                <input
                  type="number"
                  id="entryPrice"
                  name="entryPrice"
                  required
                  min="0"
                  step="0.00001"
                  className="input-field"
                  placeholder="0.0000"
                  value={formData.entryPrice}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Exit Price ($)
                </label>
                <input
                  type="number"
                  id="exitPrice"
                  name="exitPrice"
                  required
                  min="0"
                  step="0.00001"
                  className="input-field"
                  placeholder="0.0000"
                  value={formData.exitPrice}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="investment" className="block text-sm font-medium text-gray-700 mb-1">
                Investment Amount ($)
              </label>
              <input
                type="number"
                id="investment"
                name="investment"
                required
                min="0"
                step="0.01"
                className="input-field"
                placeholder="1000.00"
                value={formData.investment}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Trade Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                className="input-field"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            {/* Profit/Loss Preview */}
            {(formData.entryPrice && formData.exitPrice && formData.investment) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Profit/Loss Preview:</p>
                <p className={`text-lg font-bold ${preview.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {preview.profit >= 0 ? '+' : ''}${preview.profit.toFixed(2)} ({preview.percentage >= 0 ? '+' : ''}{preview.percentage.toFixed(2)}%)
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {isSubmitting ? `${mode === 'add' ? 'Adding' : 'Updating'}...` : `${mode === 'add' ? 'Add' : 'Update'} Trade`}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
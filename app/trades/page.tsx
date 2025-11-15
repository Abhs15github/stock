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
  Target,
  BarChart3
} from 'lucide-react';
import { Trade } from '../types';
import { format } from 'date-fns';
import { AdvancedTradeAnalytics } from '../components/AdvancedTradeAnalytics';

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

  // Commented out for development - skip authentication
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, authLoading, router]);

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
      const matchesFilter = filterType === 'all' || 
        (filterType === 'profit' && trade.profitOrLoss > 0) ||
        (filterType === 'loss' && trade.profitOrLoss < 0);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

  const handleAddTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await addTrade(tradeData);
      if (result.success) {
        setShowAddModal(false);
        showToast('Trade added successfully', 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Failed to add trade', 'error');
    }
  };

  const handleEditTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTrade) return;
    
    try {
      const result = await updateTrade(editingTrade.id, tradeData);
      if (result.success) {
        setShowEditModal(false);
        setEditingTrade(null);
        showToast('Trade updated successfully', 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Failed to update trade', 'error');
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        const result = await deleteTrade(tradeId);
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
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Trade Tracker</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                Manage and analyze your trading performance
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2 text-sm sm:text-base"
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
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
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

        {/* Advanced Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <AdvancedTradeAnalytics 
            trades={trades} 
            onRefresh={() => {
              // Refresh trades data
              window.location.reload();
            }}
          />
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
              <p className="text-gray-600 mb-6">
                {trades.length === 0 
                  ? 'Start by adding your first trade to track your performance'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {trades.length === 0 && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Trade</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <button
                          onClick={() => {
                            setSortBy('pair');
                            setSortOrder(sortBy === 'pair' && sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Trading Pair</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <button
                          onClick={() => {
                            setSortBy('date');
                            setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Date</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Entry Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Exit Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Investment</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <button
                          onClick={() => {
                            setSortBy('profit');
                            setSortOrder(sortBy === 'profit' && sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>P&L</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrades.map((trade, index) => (
                      <motion.tr
                        key={trade.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{trade.pairName}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              trade.profitOrLoss > 0 
                                ? 'bg-green-100 text-green-700' 
                                : trade.profitOrLoss < 0 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {trade.profitOrLoss > 0 ? 'Profit' : trade.profitOrLoss < 0 ? 'Loss' : 'Even'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(trade.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">
                            ${formatPrice(trade.entryPrice)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">
                            ${trade.exitPrice ? formatPrice(trade.exitPrice) : 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          ${formatPrice(trade.investment)}
                        </td>
                        <td className="py-3 px-4">
                          <div className={`text-sm font-medium ${
                            trade.profitOrLoss > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {trade.profitOrLoss > 0 ? (
                              <span className="flex items-center">
                                <ArrowUpRight className="w-4 h-4 mr-1" />
                                +{formatCurrency(trade.profitOrLoss)}
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <ArrowDownRight className="w-4 h-4 mr-1" />
                                {formatCurrency(trade.profitOrLoss)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            trade.status === 'won' 
                              ? 'bg-green-100 text-green-700' 
                              : trade.status === 'lost'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {trade.status === 'won' ? 'Won' : trade.status === 'lost' ? 'Lost' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingTrade(trade);
                                setShowEditModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrade(trade.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredTrades.length)} of {filteredTrades.length} trades
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>

      {/* Add Trade Modal */}
      <TradeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTrade}
        mode="add"
      />

      {/* Edit Trade Modal */}
      <TradeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTrade(null);
        }}
        onSubmit={handleEditTrade}
        mode="edit"
        trade={editingTrade}
      />
    </div>
  );
}

const TradeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
  mode: 'add' | 'edit';
  trade?: Trade | null;
}> = ({ isOpen, onClose, onSubmit, mode, trade }) => {
  const [formData, setFormData] = useState({
    pairName: '',
    entryPrice: 0,
    exitPrice: 0,
    investment: 0,
    profitOrLoss: 0,
    profitOrLossPercentage: 0,
    status: 'pending' as 'pending' | 'won' | 'lost',
    type: 'buy' as 'buy' | 'sell',
    date: new Date().toISOString(),
    userId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<'pending' | 'won' | 'lost'>('pending');

  useEffect(() => {
    if (mode === 'edit' && trade) {
      setFormData({
        pairName: trade.pairName,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice || 0,
        investment: trade.investment,
        profitOrLoss: trade.profitOrLoss,
        profitOrLossPercentage: trade.profitOrLossPercentage,
        status: trade.status,
        type: trade.type,
        date: trade.date,
        userId: trade.userId
      });
      setPreviousStatus(trade.status);
    } else {
      setFormData({
        pairName: '',
        entryPrice: 0,
        exitPrice: 0,
        investment: 0,
        profitOrLoss: 0,
        profitOrLossPercentage: 0,
        status: 'pending',
        type: 'buy',
        date: new Date().toISOString(),
        userId: ''
      });
      setPreviousStatus('pending');
    }
  }, [mode, trade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting trade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {mode === 'add' ? 'Add New Trade' : 'Edit Trade'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trading Pair
              </label>
              <input
                type="text"
                value={formData.pairName}
                onChange={(e) => setFormData(prev => ({ ...prev, pairName: e.target.value }))}
                className="input-field"
                placeholder="e.g., BTC/USDT"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Price
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.entryPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exit Price
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.exitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, exitPrice: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investment Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.investment}
                onChange={(e) => setFormData(prev => ({ ...prev, investment: parseFloat(e.target.value) || 0 }))}
                className="input-field"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profit/Loss
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.profitOrLoss}
                onChange={(e) => setFormData(prev => ({ ...prev, profitOrLoss: parseFloat(e.target.value) || 0 }))}
                className="input-field"
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trade Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'buy' | 'sell' }))}
                  className="input-field"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as 'pending' | 'won' | 'lost';
                      setFormData(prev => ({ ...prev, status: newStatus }));
                      if (mode === 'edit' && newStatus !== previousStatus) {
                        setIsSubmitting(true);
                        setTimeout(() => setIsSubmitting(false), 100);
                      }
                    }}
                    className="input-field"
                    disabled={isSubmitting}
                  >
                    <option value="pending">Pending</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                  {isSubmitting && formData.status !== previousStatus && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>


            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
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
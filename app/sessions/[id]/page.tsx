"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSession } from "../../context/SessionContext";
import { useTrade } from "../../context/TradeContext";
import { useRouter, useParams } from "next/navigation";
import { Header } from "../../components/Header";
import { StatCard } from "../../components/StatCard";
import { PageLoader } from "../../components/LoadingSpinner";
import { useToast } from "../../components/Toast";
import { AddPendingTradeModal } from "../../components/AddPendingTradeModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Target,
  Activity,
  AlertCircle,
  BarChart3,
  Settings,
  ChevronDown,
  CheckCircle,
  XCircle,
  Calculator,
  Plus,
  Brain,
  Zap,
} from "lucide-react";
import { hybridCalculator } from "../../utils/neuralNetworkModel";
import Link from "next/link";
import { TradingSession } from "../../types";

export default function SessionDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { sessions } = useSession();
  const {
    trades,
    getSessionTrades,
    recordTradeResult,
    reloadTrades,
    createNextPendingTrade,
  } = useTrade();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TradingSession | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "trades" | "analytics"
  >("dashboard");
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showAddTradeModal, setShowAddTradeModal] = useState(false);
  const [recordingTrade, setRecordingTrade] = useState<string | null>(null);
  const [sessionTrades, setSessionTrades] = useState<any[]>([]);

  // Commented out for development - skip authentication
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, authLoading, router]);

  // Reload trades when component mounts or sessionId changes
  useEffect(() => {
    if (sessionId && user) {
      console.log("Reloading trades for session:", sessionId);
      reloadTrades();
    }
  }, [sessionId, user, reloadTrades]);

  useEffect(() => {
    if (sessions && sessionId) {
      const foundSession = sessions.find((s) => s.id === sessionId);
      if (foundSession) {
        setSession(foundSession);
      } else {
        showToast("Session not found", "error");
        router.push("/sessions");
      }
    }
  }, [sessions, sessionId, router, showToast]);

  useEffect(() => {
    if (session) {
      const sessionTradesList = getSessionTrades(session.id);
      setSessionTrades(sessionTradesList);
    }
  }, [session, trades, getSessionTrades]);

  const calculateTargetProfit = useCallback((sessionData: TradingSession): number => {
    const { capital, totalTrades, accuracy, riskRewardRatio } = sessionData;
    const winRate = accuracy / 100;
    const expectedValue = (winRate * riskRewardRatio) - (1 - winRate);
    const riskPerTrade = capital * 0.02; // 2% of capital
    const profitPerTrade = riskPerTrade * expectedValue;
    const totalExpectedProfit = profitPerTrade * totalTrades;
    return totalExpectedProfit;
  }, []);

  const checkIfTargetReached = useCallback(() => {
    if (!session) return false;
    
    const completedTrades = sessionTrades.filter(t => t.status !== 'pending');
    
    // Only check target if there are completed trades
    if (completedTrades.length === 0) return false;
    
    const currentBalance = session.capital + completedTrades.reduce((sum, t) => sum + t.profitOrLoss, 0);
    const targetBalance = session.capital + calculateTargetProfit(session);
    
    // Target reached if current balance >= target balance AND we have at least 1 completed trade
    return currentBalance >= targetBalance && completedTrades.length > 0;
  }, [session, sessionTrades, calculateTargetProfit]);

  // Calculate risk percentage for dynamic stake calculation
  const calculateRiskPercentage = useCallback((session: TradingSession) => {
    // REFERENCE WEBSITE FORMULA: Uses higher, more aggressive risk percentage
    // Observed risk percentages range from 15% to 51%, averaging around 30%
    // This matches the reference website's actual trade behavior

    const winRate = session.accuracy / 100;
    const kelly =
      (winRate * session.riskRewardRatio - (1 - winRate)) /
      session.riskRewardRatio;

    if (kelly <= 0) return 0.15; // Default 15% if Kelly is negative (minimum from reference)

    // Use full Kelly or higher for aggressive compounding (matching reference)
    // Reference website uses 30-40% on average
    const aggressiveRisk = kelly * 4.5; // Multiplier to reach ~30% range

    // Cap at 50% to match observed maximum in reference
    return Math.min(Math.max(aggressiveRisk, 0.15), 0.50);
  }, []);

  const handleRecordResult = useCallback(
    async (tradeId: string, result: "won" | "lost") => {
      if (!session) {
        showToast("Session not found", "error");
        return;
      }

      // Check if target is already reached
      if (checkIfTargetReached()) {
        showToast(
          "Target already reached! Cannot record more trades.",
          "error"
        );
        return;
      }

      if (!tradeId) {
        showToast("Invalid trade ID", "error");
        return;
      }

      try {
        setRecordingTrade(tradeId);
        const response = await recordTradeResult(
          tradeId,
          result,
          session.riskRewardRatio
        );

        if (response.success) {
          showToast(response.message, "success");

          // Reload trades first to get updated balance
          await reloadTrades();

          // Check if target is now reached after this trade
          const isTargetNowReached = checkIfTargetReached();

          if (!isTargetNowReached) {
            // Only create next trade if target not reached
            const riskPercent = calculateRiskPercentage(session);
            const nextTradeResult = await createNextPendingTrade(
              session.id,
              session.capital,
              riskPercent,
              session.riskRewardRatio,
              session.totalTrades
            );

            if (!nextTradeResult.success) {
              showToast(nextTradeResult.message, "info");
            }

            await reloadTrades();
          } else {
            showToast("🎉 Target reached! Session goal completed.", "success");
          }
        } else {
          showToast(
            response.message || "Failed to record trade result",
            "error"
          );
        }
      } catch (error) {
        console.error("Error recording trade result:", error);
        showToast("An unexpected error occurred. Please try again.", "error");
      } finally {
        setRecordingTrade(null);
      }
    },
    [
      session,
      recordTradeResult,
      createNextPendingTrade,
      reloadTrades,
      showToast,
      calculateRiskPercentage,
      checkIfTargetReached,
    ]
  );

  // Calculate session metrics - MOVED BEFORE HOOKS
  const calculateSessionBalance = useCallback(() => {
    if (!session) return 0;
    let balance = session.capital;
    const completedTrades = sessionTrades.filter((t) => t.status !== "pending");

    // Sort completed trades by creation date (oldest first for proper balance calculation)
    const sortedTrades = completedTrades.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedTrades.forEach((trade) => {
      balance += trade.profitOrLoss;
    });

    return balance;
  }, [session, sessionTrades]);

  const calculateNetProfit = useCallback(() => {
    const completedTrades = sessionTrades.filter((t) => t.status !== "pending");
    return completedTrades.reduce((sum, trade) => sum + trade.profitOrLoss, 0);
  }, [sessionTrades]);

  const calculateWinRate = useCallback(() => {
    const completedTrades = sessionTrades.filter((t) => t.status !== "pending");
    if (completedTrades.length === 0) return 0;

    const wins = completedTrades.filter((t) => t.status === "won").length;
    return (wins / completedTrades.length) * 100;
  }, [sessionTrades]);

  const calculateProgress = useCallback(() => {
    if (!session) return { completed: 0, total: 0, percentage: "0" };
    const completedTrades = sessionTrades.filter(
      (t) => t.status !== "pending"
    ).length;
    const total = session.totalTrades;
    const percentage = total > 0 ? (completedTrades / total) * 100 : 0;

    return {
      completed: completedTrades,
      total,
      percentage: percentage.toFixed(0),
    };
  }, [session, sessionTrades]);

  const calculateMinTotalBalance = useCallback(() => {
    if (!session) return 0;
    const targetProfit = calculateTargetProfit(session);
    return session.capital + targetProfit;
  }, [session, calculateTargetProfit]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Memoize expensive calculations to prevent unnecessary re-renders
  const currentBalance = useMemo(
    () => calculateSessionBalance(),
    [calculateSessionBalance]
  );
  const netProfit = useMemo(() => calculateNetProfit(), [calculateNetProfit]);
  const winRate = useMemo(() => calculateWinRate(), [calculateWinRate]);
  const progress = useMemo(() => calculateProgress(), [calculateProgress]);
  const targetProfit = useMemo(
    () => (session ? calculateTargetProfit(session) : 0),
    [session, calculateTargetProfit]
  );
  const minTotalBalance = useMemo(
    () => calculateMinTotalBalance(),
    [calculateMinTotalBalance]
  );
  // Target net profit
  const total = useMemo(
    () => targetProfit + minTotalBalance,
    [targetProfit, minTotalBalance]
  );

  // Check if target trades limit has been reached
  const isTargetReached = useMemo(() => {
    return checkIfTargetReached();
  }, [checkIfTargetReached]);

  // Memoize trade filtering operations
  const allPendingTrades = useMemo(
    () =>
      sessionTrades
        .filter((t) => t.status === "pending")
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [sessionTrades]
  );

  const pendingTrades = useMemo(
    () => (allPendingTrades.length > 0 ? [allPendingTrades[0]] : []),
    [allPendingTrades]
  );

  const completedTrades = useMemo(
    () =>
      sessionTrades
        .filter((t) => t.status !== "pending")
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [sessionTrades]
  );

  const tools = [
    { name: "Forex Position Size Calculator", href: "/calculators" },
    { name: "Crypto Position Size Calculator", href: "/calculators" },
    { name: "Stock Position Size Calculator", href: "/calculators" },
  ];

  // NOW WE CAN SAFELY DO CONDITIONAL RETURNS AFTER ALL HOOKS
  if (authLoading || !session) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                  {session.name}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 mt-1">
                  <p className="text-sm sm:text-base text-gray-600">
                    Created {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <span
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full w-fit ${
                      session.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {session.status === "active" ? "Active" : "Completed"}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Calculator className="w-4 h-4" />
                <span>Tools</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showToolsDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showToolsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                  >
                    {tools.map((tool, index) => (
                      <Link
                        key={index}
                        href={tool.href}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowToolsDropdown(false)}
                      >
                        <Calculator className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {tool.name}
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Action Required Alert - Show at top level if there are pending trades */}
        {allPendingTrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="font-semibold text-orange-900">
                  Action Required: Pending Trade Results
                </h4>
                <p className="text-sm text-orange-800">
                  {allPendingTrades.length} trade(s) are waiting for results.
                  Please record outcomes.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Target Reached Alert - Show when target trades limit is reached */}
        {isTargetReached && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">
                  🎉 Target Reached!
                </h4>
                <p className="text-sm text-green-800">
                  Your session goal has been achieved! Current balance: $
                  {currentBalance.toFixed(2)}
                  (Target: ${minTotalBalance.toFixed(2)})
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "dashboard"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("trades")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "trades"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Trade List
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "analytics"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </motion.div>

        {/* Dashboard Tab Content */}
        {activeTab === "dashboard" && (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
            >
              <StatCard
                title="CURRENT BALANCE"
                value={currentBalance.toFixed(2)}
                icon={DollarSign}
                color="blue"
                subtitle=""
              />
              <StatCard
                title="NET PROFIT"
                value={netProfit.toFixed(2)}
                icon={TrendingUp}
                color={netProfit >= 0 ? "green" : "red"}
                subtitle=""
              />
              <StatCard
                title="WIN RATE"
                value={`${winRate.toFixed(1)}%`}
                icon={Target}
                color="orange"
                subtitle={`Target: ${session.accuracy.toFixed(0)}%`}
              />
              <StatCard
                title="PROGRESS"
                value={`${progress.completed}/${progress.total}`}
                icon={Activity}
                color="purple"
                subtitle={`${progress.percentage}% complete`}
              />
            </motion.div>

            {/* Progress and Strategy Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 sm:mb-8">
              {/* Progress to Goal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="card"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Progress to Goal
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Min. Total Balance</span>
                    <span className="font-semibold">
                      ${minTotalBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Min. Total Return</span>
                    <span className="font-semibold">
                      ${targetProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="my-8 text-center">
                  <div className="text-sm font-medium text-blue-600 mb-2">
                    TARGET NET PROFIT
                  </div>
                  <div className="text-4xl font-bold text-blue-600">
                    ${targetProfit.toFixed(2)}
                  </div>
                </div>
              </motion.div>

              {/* Strategy Configuration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="card"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Strategy Configuration
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Initial Balance
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      ${session.capital.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        RR (Risk Reward)
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      1:{session.riskRewardRatio}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Target Trades
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{session.totalTrades}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Required ITM
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      {session.accuracy.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* Trade List Tab Content */}
        {activeTab === "trades" && (
          <div className="space-y-6">
            {/* Pending Trades Section - Only show if there are actual pending trades */}
            {pendingTrades.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-lg font-semibold text-yellow-900">
                    Record Trade Results ({allPendingTrades.length} pending)
                  </h3>
                </div>
                <p className="text-sm text-yellow-800 mb-4">
                  Update the outcome for each pending trade to continue.
                </p>

                {pendingTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="bg-white rounded-lg p-4 mb-3 last:mb-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Risk</p>
                        <p className="text-xl font-bold">
                          ${trade.investment.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Potential Return
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          +$
                          {(trade.investment * session.riskRewardRatio).toFixed(
                            2
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleRecordResult(trade.id, "won")}
                          disabled={
                            recordingTrade === trade.id || isTargetReached
                          }
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>WON</span>
                        </button>
                        <button
                          onClick={() => handleRecordResult(trade.id, "lost")}
                          disabled={
                            recordingTrade === trade.id || isTargetReached
                          }
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>LOST</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Complete Trading History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Complete Trading History
                </h3>
                <div className="flex items-center space-x-2">
                  {allPendingTrades.length > 0 && (
                    <button
                      onClick={() =>
                        showToast(
                          `You have ${allPendingTrades.length} pending trades. Complete them to see them in history.`,
                          "info"
                        )
                      }
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
                    >
                      {allPendingTrades.length} Pending
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddTradeModal(true)}
                    className="btn-primary flex items-center space-x-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Trade</span>
                  </button>
                </div>
              </div>

              {completedTrades.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No trades yet
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Start your trading session by adding your first trade
                  </p>
                  <button
                    onClick={() => setShowAddTradeModal(true)}
                    className="btn-primary inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Trade
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Trade #
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Result
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Stake
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Return
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedTrades.map((trade, index) => {
                          // Calculate running balance up to this trade (chronologically)
                          // We need to sort all trades chronologically to calculate balance correctly
                          const allTradesChronological = [
                            ...completedTrades,
                          ].sort(
                            (a, b) =>
                              new Date(a.createdAt).getTime() -
                              new Date(b.createdAt).getTime()
                          );

                          let runningBalance = session.capital;
                          const tradeIndex = allTradesChronological.findIndex(
                            (t) => t.id === trade.id
                          );

                          for (let i = 0; i <= tradeIndex; i++) {
                            runningBalance +=
                              allTradesChronological[i].profitOrLoss;
                          }

                          return (
                            <tr
                              key={trade.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 text-sm font-medium">
                                #{index + 1}
                              </td>
                              <td className="py-3 px-4">
                                {trade.status === "won" ? (
                                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-green-700">
                                      W
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-red-700">
                                      L
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                ${trade.investment.toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`text-sm font-medium ${
                                    trade.profitOrLoss >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {trade.profitOrLoss >= 0 ? "+" : ""}$
                                  {trade.profitOrLoss.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm font-medium">
                                ${runningBalance.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <span>Rows per page: 10</span>
                    <span>
                      1-{completedTrades.length} of {completedTrades.length}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* Analytics Tab Content */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Performance Overview
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {completedTrades.length}
                  </div>
                  <div className="text-sm text-gray-600">Completed Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    ${netProfit.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Net Profit</div>
                </div>
              </div>
            </motion.div>

            {/* Trading Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Trading Statistics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">
                    Profit Analysis
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Investment</span>
                      <span className="font-medium">
                        $
                        {completedTrades
                          .reduce((sum, trade) => sum + trade.investment, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Returns</span>
                      <span className="font-medium text-green-600">
                        $
                        {completedTrades
                          .reduce(
                            (sum, trade) =>
                              sum + Math.max(0, trade.profitOrLoss),
                            0
                          )
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Losses</span>
                      <span className="font-medium text-red-600">
                        $
                        {Math.abs(
                          completedTrades.reduce(
                            (sum, trade) =>
                              sum + Math.min(0, trade.profitOrLoss),
                            0
                          )
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600 font-semibold">
                        Net P&L
                      </span>
                      <span
                        className={`font-bold ${
                          netProfit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ${netProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">
                    Session Progress
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Trades</span>
                      <span className="font-medium">{session.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-medium">{progress.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining</span>
                      <span className="font-medium">
                        {Math.max(0, session.totalTrades - progress.completed)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Number(progress.percentage)
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      {progress.percentage}% Complete
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Target vs Actual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Target vs Actual Performance
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    ${targetProfit.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Target Profit
                  </div>
                  <div className="text-xs text-gray-500">
                    Based on {session.accuracy}% accuracy & 1:
                    {session.riskRewardRatio} RR
                  </div>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    ${netProfit.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Actual Profit
                  </div>
                  <div className="text-xs text-gray-500">
                    {completedTrades.length} completed trades
                  </div>
                </div>
              </div>

              {completedTrades.length > 0 && (
                <div className="mt-6 text-center">
                  <div
                    className={`text-lg font-semibold ${
                      netProfit >= targetProfit * 0.5
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    {netProfit >= targetProfit * 0.5
                      ? "🎯 On Track!"
                      : "📈 Keep Going!"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {netProfit >= targetProfit * 0.5
                      ? `You're performing well relative to your target`
                      : `You're at ${((netProfit / targetProfit) * 100).toFixed(
                          1
                        )}% of your target profit`}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>

      {/* Add Pending Trade Modal */}
      <AddPendingTradeModal
        sessionId={sessionId}
        isOpen={showAddTradeModal}
        onClose={() => setShowAddTradeModal(false)}
      />
    </div>
  );
}

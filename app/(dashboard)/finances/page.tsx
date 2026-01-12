'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import type { Income, Expense, Job } from '@/types/airtable';

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export default function FinancesPage() {
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'this-month' | 'last-month' | 'all-time'>('this-month');

  useEffect(() => {
    Promise.all([
      fetch('/api/income').then(r => r.json()),
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/jobs').then(r => r.json()),
    ]).then(([incomeData, expenseData, jobsData]) => {
      setIncome(incomeData);
      setExpenses(expenseData);
      setJobs(jobsData);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load financial data:', error);
      setLoading(false);
    });
  }, []);

  // Filter data by selected period
  const getDateRange = () => {
    const now = new Date();
    if (selectedPeriod === 'this-month') {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    } else if (selectedPeriod === 'last-month') {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    return null; // all-time
  };

  const dateRange = getDateRange();

  const filteredIncome = dateRange
    ? income.filter(i => {
        const date = new Date(i.fields.Date);
        return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      })
    : income;

  const filteredExpenses = dateRange
    ? expenses.filter(e => {
        const date = new Date(e.fields.Date);
        return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      })
    : expenses;

  const filteredJobs = dateRange
    ? jobs.filter(j => {
        if (!j.fields.Date) return false;
        const date = new Date(j.fields.Date);
        return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      })
    : jobs;

  // Calculate summary
  const summary: FinancialSummary = {
    totalIncome: filteredIncome.reduce((sum, i) => sum + (i.fields.Amount || 0), 0),
    totalExpenses: filteredExpenses.reduce((sum, e) => sum + (e.fields.Amount || 0), 0),
    netProfit: 0,
    profitMargin: 0,
  };
  summary.netProfit = summary.totalIncome - summary.totalExpenses;
  summary.profitMargin = summary.totalIncome > 0 ? (summary.netProfit / summary.totalIncome) * 100 : 0;

  // Calculate job revenue from completed jobs
  const completedJobs = filteredJobs.filter(j => j.fields.Status === 'Completed');
  const jobRevenue = completedJobs.reduce((sum, j) => sum + (j.fields['Amount Charged'] || 0), 0);
  const cleanerPayouts = completedJobs.reduce((sum, j) => sum + (j.fields['Cleaner Payout'] || 0), 0);
  const jobProfit = completedJobs.reduce((sum, j) => sum + (j.fields['Profit'] || 0), 0);

  // Expense breakdown by category
  const expensesByCategory = filteredExpenses.reduce((acc, e) => {
    const category = e.fields.Category || 'Other';
    acc[category] = (acc[category] || 0) + (e.fields.Amount || 0);
    return acc;
  }, {} as Record<string, number>);

  // Income breakdown by category
  const incomeByCategory = filteredIncome.reduce((acc, i) => {
    const category = i.fields.Category || 'Cleaning Service';
    acc[category] = (acc[category] || 0) + (i.fields.Amount || 0);
    return acc;
  }, {} as Record<string, number>);

  // Income breakdown by payment method
  const incomeByMethod = filteredIncome.reduce((acc, i) => {
    const method = i.fields['Payment Method'] || 'Unknown';
    acc[method] = (acc[method] || 0) + (i.fields.Amount || 0);
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finances"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="all-time">All Time</option>
            </select>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Income */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <p className="text-2xl font-bold text-green-600">${summary.totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUpRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{filteredIncome.length} transactions</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">${summary.totalExpenses.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowDownRight className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{filteredExpenses.length} transactions</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-tidyco-blue' : 'text-red-600'}`}>
                ${summary.netProfit.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${summary.netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              {summary.netProfit >= 0 ? (
                <TrendingUp className="w-6 h-6 text-tidyco-blue" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{summary.profitMargin.toFixed(1)}% margin</p>
        </div>

        {/* Cleaner Payouts */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cleaner Payouts</p>
              <p className="text-2xl font-bold text-orange-600">${cleanerPayouts.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{completedJobs.length} jobs completed</p>
        </div>
      </div>

      {/* Job Revenue Stats */}
      <div className="bg-gradient-to-r from-tidyco-blue to-blue-700 p-6 rounded-xl text-white">
        <h3 className="text-lg font-semibold mb-4">Job Revenue Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-blue-200 text-sm">Job Revenue</p>
            <p className="text-2xl font-bold">${jobRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Cleaner Payouts</p>
            <p className="text-2xl font-bold">${cleanerPayouts.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Job Profit</p>
            <p className="text-2xl font-bold">${jobProfit.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Jobs Completed</p>
            <p className="text-2xl font-bold">{completedJobs.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-tidyco-navy mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Income by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(incomeByCategory).map(([category, amount]) => {
              const percentage = (amount / summary.totalIncome) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{category}</span>
                    <span className="font-medium">${amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(incomeByCategory).length === 0 && (
              <p className="text-gray-500 text-sm">No income data for this period</p>
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-tidyco-navy mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Expenses by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = (amount / summary.totalExpenses) * 100;
                const colors: Record<string, string> = {
                  'Cleaning Supplies': 'bg-blue-500',
                  'Gas-Mileage': 'bg-yellow-500',
                  'Marketing': 'bg-purple-500',
                  'Cleaner Payouts': 'bg-orange-500',
                  'Tools-Equipment': 'bg-teal-500',
                  'Other': 'bg-gray-500',
                };
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{category}</span>
                      <span className="font-medium">${amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors[category] || 'bg-gray-500'} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(expensesByCategory).length === 0 && (
              <p className="text-gray-500 text-sm">No expense data for this period</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-tidyco-navy mb-4">Income by Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(incomeByMethod).map(([method, amount]) => {
            const methodColors: Record<string, string> = {
              'Zelle': 'bg-purple-100 text-purple-700 border-purple-200',
              'Square': 'bg-blue-100 text-blue-700 border-blue-200',
              'Cash': 'bg-green-100 text-green-700 border-green-200',
            };
            return (
              <div
                key={method}
                className={`p-4 rounded-lg border ${methodColors[method] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
              >
                <p className="text-sm font-medium">{method}</p>
                <p className="text-xl font-bold">${amount.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Income */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-tidyco-navy mb-4">Recent Income</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredIncome
              .sort((a, b) => new Date(b.fields.Date).getTime() - new Date(a.fields.Date).getTime())
              .slice(0, 10)
              .map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.fields.Client || 'Unknown Client'}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(item.fields.Date), 'MMM d, yyyy')} • {item.fields['Payment Method']}
                    </p>
                  </div>
                  <span className="text-green-600 font-semibold">+${item.fields.Amount}</span>
                </div>
              ))}
            {filteredIncome.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No income records for this period</p>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-tidyco-navy mb-4">Recent Expenses</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredExpenses
              .sort((a, b) => new Date(b.fields.Date).getTime() - new Date(a.fields.Date).getTime())
              .slice(0, 10)
              .map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.fields.Description}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(item.fields.Date), 'MMM d, yyyy')} • {item.fields.Category}
                    </p>
                  </div>
                  <span className="text-red-600 font-semibold">-${item.fields.Amount}</span>
                </div>
              ))}
            {filteredExpenses.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No expense records for this period</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isWithinInterval, parseISO } from 'date-fns';
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  Gift
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import type { Expense, Job, Lead } from '@/types/airtable';

type TimePeriod = 'this-month' | 'last-month' | 'this-year' | 'all-time' | 'custom';

export default function FinancesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('this-month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/jobs').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
    ]).then(([expenseData, jobsData, leadsData]) => {
      setExpenses(expenseData);
      setJobs(jobsData);
      setLeads(leadsData);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load financial data:', error);
      setLoading(false);
    });
  }, []);

  // Filter data by selected period
  const getDateRange = (): { start: Date; end: Date } | null => {
    const now = new Date();
    if (selectedPeriod === 'this-month') {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    } else if (selectedPeriod === 'last-month') {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    } else if (selectedPeriod === 'this-year') {
      return { start: startOfYear(now), end: endOfYear(now) };
    } else if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      return { start: parseISO(customStartDate), end: parseISO(customEndDate) };
    }
    // 'all-time' or invalid custom range returns null (no filtering)
    return null;
  };

  const dateRange = getDateRange();

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

  // Filter leads by date range (using createdTime or Created Date)
  // Only include leads with a Lead Fee that haven't been refunded
  const filteredLeadsWithFees = (dateRange
    ? leads.filter(l => {
        const dateStr = l.createdTime || l.fields['Created Date'];
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      })
    : leads
  ).filter(l => l.fields['Lead Fee'] && l.fields['Lead Fee'] > 0 && !l.fields.Refunded);

  // Helper to safely get numeric value (handles arrays from Airtable lookups)
  const safeNumber = (value: number | number[] | undefined | null): number => {
    if (value === undefined || value === null) return 0;
    if (Array.isArray(value)) return value[0] || 0;
    if (typeof value === 'number' && !isNaN(value)) return value;
    return 0;
  };

  // Job categories
  const completedJobs = filteredJobs.filter(j => j.fields.Status === 'Completed');
  const paidJobs = completedJobs.filter(j => j.fields['Payment Status'] === 'Paid');
  const unpaidJobs = completedJobs.filter(j => j.fields['Payment Status'] !== 'Paid');

  // EXPECTED calculations (from all jobs this period)
  const expectedRevenue = filteredJobs.reduce((sum, j) => sum + safeNumber(j.fields['Amount Charged']), 0);
  const expectedCleanerPayout = filteredJobs.reduce((sum, j) => {
    const hours = safeNumber(j.fields['Duration Hours']);
    const rate = safeNumber(j.fields['Cleaner Hourly Rate']);
    return sum + (hours * rate);
  }, 0);
  const expectedProfit = expectedRevenue - expectedCleanerPayout;

  // ACTUAL calculations (from paid jobs only)
  // Use Cleaner Payout if available, otherwise calculate from hours * rate
  const actualRevenue = paidJobs.reduce((sum, j) => sum + safeNumber(j.fields['Amount Charged']), 0);
  const actualCleanerPayout = paidJobs.reduce((sum, j) => {
    const payout = safeNumber(j.fields['Cleaner Payout']);
    if (payout > 0) return sum + payout;
    // Fallback: calculate from hours * rate
    const hours = safeNumber(j.fields['Duration Hours']);
    const rate = safeNumber(j.fields['Cleaner Hourly Rate']);
    return sum + (hours * rate);
  }, 0);
  const actualProfit = paidJobs.reduce((sum, j) => {
    const profit = safeNumber(j.fields['Profit']);
    if (profit !== 0) return sum + profit;
    // Fallback: calculate profit manually
    const revenue = safeNumber(j.fields['Amount Charged']);
    const hours = safeNumber(j.fields['Duration Hours']);
    const rate = safeNumber(j.fields['Cleaner Hourly Rate']);
    return sum + (revenue - (hours * rate));
  }, 0);

  // Outstanding (completed but unpaid)
  const outstandingRevenue = unpaidJobs.reduce((sum, j) => sum + safeNumber(j.fields['Amount Charged']), 0);

  // Tips
  const totalTips = filteredJobs.reduce((sum, j) => sum + safeNumber(j.fields['Tip Amount']), 0);
  const jobsWithTips = filteredJobs.filter(j => safeNumber(j.fields['Tip Amount']) > 0);

  // Lead Fees (non-refunded leads with fees in this period)
  const totalLeadFees = filteredLeadsWithFees.reduce((sum, l) => sum + safeNumber(l.fields['Lead Fee']), 0);

  // Expenses (regular expenses + lead fees)
  const regularExpenses = filteredExpenses.reduce((sum, e) => sum + safeNumber(e.fields.Amount), 0);
  const totalExpenses = regularExpenses + totalLeadFees;

  // Expense breakdown by category (include lead fees as separate category)
  const expensesByCategory = filteredExpenses.reduce((acc, e) => {
    const category = e.fields.Category || 'Other';
    acc[category] = (acc[category] || 0) + safeNumber(e.fields.Amount);
    return acc;
  }, {} as Record<string, number>);

  // Add lead fees as a category if there are any
  if (totalLeadFees > 0) {
    expensesByCategory['Lead Fees'] = totalLeadFees;
  }

  // Net profit (actual revenue - all expenses including lead fees)
  const netProfit = actualRevenue - totalExpenses;

  // Period label
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'this-month':
        return format(new Date(), 'MMMM yyyy');
      case 'last-month':
        return format(subMonths(new Date(), 1), 'MMMM yyyy');
      case 'this-year':
        return format(new Date(), 'yyyy');
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(parseISO(customStartDate), 'MMM d')} - ${format(parseISO(customEndDate), 'MMM d, yyyy')}`;
        }
        return 'Custom Range';
      case 'all-time':
      default:
        return 'All Time';
    }
  };
  const periodLabel = getPeriodLabel();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Finances - ${periodLabel}`}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="all-time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
            {selectedPeriod === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
                />
              </div>
            )}
          </div>
        }
      />

      {/* Expected vs Actual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expected Section */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-tidyco-blue" />
            <h2 className="text-lg font-semibold text-tidyco-navy">Expected</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-auto">
              {filteredJobs.length} jobs
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Revenue</span>
              <span className="text-xl font-bold text-tidyco-navy">${expectedRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Cleaner Payouts</span>
              <span className="text-xl font-bold text-orange-600">-${expectedCleanerPayout.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 font-medium">Expected Profit</span>
              <span className={`text-xl font-bold ${expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${expectedProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* Actual Section */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-tidyco-navy">Actual (Collected)</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-auto">
              {paidJobs.length} paid
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Revenue</span>
              <span className="text-xl font-bold text-green-600">${actualRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Cleaner Payouts</span>
              <span className="text-xl font-bold text-orange-600">-${actualCleanerPayout.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 font-medium">Actual Profit</span>
              <span className={`text-xl font-bold ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${actualProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Outstanding & Tips Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outstanding */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Outstanding</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">${outstandingRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">{unpaidJobs.length} jobs awaiting payment</p>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Tips Received</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">${totalTips.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">{jobsWithTips.length} jobs with tips</p>
        </div>
      </div>

      {/* Net Profit After Expenses */}
      <section className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-tidyco-navy mb-4">Net Profit (After Expenses)</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-1">Actual Revenue</p>
              <p className="text-2xl font-bold text-green-600">${actualRevenue.toLocaleString()}</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-1">Cleaner Payouts</p>
              <p className="text-2xl font-bold text-orange-600">-${actualCleanerPayout.toLocaleString()}</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-500 mb-1">Business Expenses</p>
              <p className="text-2xl font-bold text-red-600">-${totalExpenses.toLocaleString()}</p>
            </div>
            <div className="p-5 bg-gray-50">
              <p className="text-sm text-gray-500 mb-1">Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expenses Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-tidyco-navy mb-4">Expenses by Category</h3>
          <div className="space-y-4">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                const colors: Record<string, { bg: string; bar: string }> = {
                  'Cleaning Supplies': { bg: 'bg-blue-50', bar: 'bg-blue-500' },
                  'Gas-Mileage': { bg: 'bg-yellow-50', bar: 'bg-yellow-500' },
                  'Marketing': { bg: 'bg-purple-50', bar: 'bg-purple-500' },
                  'Cleaner Payouts': { bg: 'bg-orange-50', bar: 'bg-orange-500' },
                  'Tools-Equipment': { bg: 'bg-teal-50', bar: 'bg-teal-500' },
                  'Lead Fees': { bg: 'bg-rose-50', bar: 'bg-rose-500' },
                  'Other': { bg: 'bg-gray-50', bar: 'bg-gray-500' },
                };
                const color = colors[category] || colors['Other'];
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">{category}</span>
                      <span className="text-gray-900 font-semibold">
                        ${amount.toLocaleString()} <span className="text-gray-500 font-normal">({percentage.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`${color.bar} h-2.5 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Recent Jobs & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-tidyco-navy">Recent Jobs</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {completedJobs.length} completed
            </span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {completedJobs
              .sort((a, b) => new Date(b.fields.Date || '').getTime() - new Date(a.fields.Date || '').getTime())
              .slice(0, 6)
              .map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {job.fields['Service Type'] || 'Cleaning'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {job.fields.Date ? format(new Date(job.fields.Date), 'MMM d') : 'No date'}
                      {job.fields['Tip Amount'] ? ` • $${job.fields['Tip Amount']} tip` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${job.fields['Amount Charged'] || 0}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      job.fields['Payment Status'] === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {job.fields['Payment Status'] || 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))}
            {completedJobs.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6">No completed jobs this period</p>
            )}
          </div>
        </section>

        {/* Recent Expenses */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-tidyco-navy">Recent Expenses</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              ${totalExpenses.toLocaleString()} total
            </span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {filteredExpenses
              .sort((a, b) => new Date(b.fields.Date).getTime() - new Date(a.fields.Date).getTime())
              .slice(0, 6)
              .map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {expense.fields.Description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(expense.fields.Date), 'MMM d')} • {expense.fields.Category}
                    </p>
                  </div>
                  <p className="font-semibold text-red-600">-${expense.fields.Amount}</p>
                </div>
              ))}
            {filteredExpenses.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6">No expenses this period</p>
            )}
          </div>
        </section>
      </div>

      {/* Quick Stats */}
      <section className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-tidyco-navy mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Job Value</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              ${filteredJobs.length > 0 ? Math.round(expectedRevenue / filteredJobs.length) : 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Collection Rate</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {completedJobs.length > 0 ? Math.round((paidJobs.length / completedJobs.length) * 100) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Tip</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              ${jobsWithTips.length > 0 ? Math.round(totalTips / jobsWithTips.length) : 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Profit Margin</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {actualRevenue > 0 ? Math.round((actualProfit / actualRevenue) * 100) : 0}%
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

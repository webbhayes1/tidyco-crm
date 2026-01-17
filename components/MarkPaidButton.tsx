'use client';

import { useState } from 'react';
import { DollarSign, X, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MarkPaidButtonProps {
  jobId: string;
  jobTitle: string;
  currentPaymentStatus: string;
  currentCleanerPaid: boolean;
  amountCharged: number;
  cleanerPayout: number;
  currentTip?: number;
  cleanerCount?: number;
  variant?: 'default' | 'compact'; // compact for list view
  onSuccess?: () => void; // callback after successful update
}

export function MarkPaidButton({
  jobId,
  jobTitle,
  currentPaymentStatus,
  currentCleanerPaid,
  amountCharged,
  cleanerPayout,
  currentTip = 0,
  cleanerCount = 1,
  variant = 'default',
  onSuccess,
}: MarkPaidButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [markClientPaid, setMarkClientPaid] = useState(currentPaymentStatus !== 'Paid');
  const [markCleanerPaid, setMarkCleanerPaid] = useState(!currentCleanerPaid);
  const [tipAmount, setTipAmount] = useState(currentTip.toString());
  const [paymentMethod, setPaymentMethod] = useState<string>('Zelle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isPaid = currentPaymentStatus === 'Paid';
  const isCleanerPaid = currentCleanerPaid;
  const isFullyPaid = isPaid && isCleanerPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markClientPaid,
          markCleanerPaid,
          paymentMethod,
          tipAmount: parseFloat(tipAmount) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update payment status');
      }

      setIsModalOpen(false);
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const buttonClasses = variant === 'compact'
    ? `inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
        isFullyPaid
          ? 'bg-green-100 text-green-700'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`
    : `inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
        isFullyPaid
          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 hover:bg-green-100'
          : 'bg-blue-600 text-white hover:bg-blue-500'
      }`;

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click in tables
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className={buttonClasses}
      >
        <DollarSign className={variant === 'compact' ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'} />
        {isFullyPaid ? 'Paid' : isPaid ? 'Pay Cleaner' : 'Mark Paid'}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)} />

            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Update Payment Status
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {jobTitle}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Current Status Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Charged</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(amountCharged)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cleaner Payout</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(cleanerPayout)}</span>
                  </div>
                </div>

                {/* Client Payment */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Client Payment</p>
                    <p className="text-sm text-gray-500">
                      {isPaid ? 'Already marked as paid' : 'Mark as received from client'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {isPaid ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        Paid
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={markClientPaid}
                        onChange={(e) => setMarkClientPaid(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                    )}
                  </div>
                </div>

                {/* Cleaner Payout */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Cleaner Payout</p>
                    <p className="text-sm text-gray-500">
                      {isCleanerPaid ? 'Already paid out' : 'Mark as paid to cleaner'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {isCleanerPaid ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        Paid
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={markCleanerPaid}
                        onChange={(e) => setMarkCleanerPaid(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                    )}
                  </div>
                </div>

                {/* Tip Amount - show when marking client as paid */}
                {markClientPaid && !isPaid && (
                  <div>
                    <label htmlFor="tipAmount" className="block text-sm font-medium text-gray-700">
                      Tip Amount
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="tipAmount"
                        step="0.01"
                        min="0"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    {cleanerCount > 1 && parseFloat(tipAmount) > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Tip will be split evenly between {cleanerCount} cleaners
                        <span className="block text-gray-600 font-medium">
                          (${(parseFloat(tipAmount) / cleanerCount).toFixed(2)} each)
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Method */}
                {(markClientPaid || markCleanerPaid) && !isFullyPaid && (
                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                      Payment Method
                    </label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                    >
                      <option value="Zelle">Zelle</option>
                      <option value="Venmo">Venmo</option>
                      <option value="Cash">Cash</option>
                      <option value="Square">Square</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>
                )}

                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || isFullyPaid || (!markClientPaid && !markCleanerPaid)}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                  >
                    {isSubmitting ? 'Saving...' : 'Update Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

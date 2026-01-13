'use client';

import { useState } from 'react';
import { CheckCircle, DollarSign, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MarkCompleteButtonProps {
  jobId: string;
  jobTitle: string;
  currentStatus: string;
  currentTip?: number;
  cleanerCount?: number;
}

export function MarkCompleteButton({ jobId, jobTitle, currentStatus, currentTip = 0, cleanerCount = 1 }: MarkCompleteButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(currentTip.toString());
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isCompleted = currentStatus === 'Completed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipAmount: parseFloat(tipAmount) || 0,
          completionNotes: completionNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark job complete');
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
          isCompleted
            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 hover:bg-green-100'
            : 'bg-green-600 text-white hover:bg-green-500'
        }`}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        {isCompleted ? 'Update Completion' : 'Mark Complete'}
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
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    {isCompleted ? 'Update Job Completion' : 'Mark Job Complete'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {jobTitle}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                      className="block w-full rounded-md border-0 py-2 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  {cleanerCount > 1 ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Tip will be split evenly between {cleanerCount} cleaners
                      {parseFloat(tipAmount) > 0 && (
                        <span className="block text-gray-600 font-medium">
                          (${(parseFloat(tipAmount) / cleanerCount).toFixed(2)} each)
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Tip will be added to cleaner payout
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="completionNotes" className="block text-sm font-medium text-gray-700">
                    Completion Notes (optional)
                  </label>
                  <textarea
                    id="completionNotes"
                    rows={3}
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm"
                    placeholder="Any notes about the job completion..."
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                  >
                    {isSubmitting ? 'Saving...' : isCompleted ? 'Update' : 'Mark Complete'}
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

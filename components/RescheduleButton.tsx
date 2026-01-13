'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { RescheduleModal } from './RescheduleModal';
import { useRouter } from 'next/navigation';

interface RescheduleButtonProps {
  jobId: string;
  clientId: string;
  currentDate: string;
}

export function RescheduleButton({ jobId, clientId, currentDate }: RescheduleButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        <Calendar className="mr-2 h-4 w-4" />
        Reschedule
      </button>

      <RescheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobId={jobId}
        clientId={clientId}
        currentDate={currentDate}
        onSuccess={handleSuccess}
      />
    </>
  );
}
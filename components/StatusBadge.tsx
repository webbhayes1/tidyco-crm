type Status =
  | 'Pending'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Paid'
  | 'Refunded'
  | 'Active'
  | 'Inactive'
  | 'Sent'
  | 'Accepted'
  | 'Rejected'
  | 'Expired'
  | 'Voided';

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Paid: 'bg-green-100 text-green-800',
  Refunded: 'bg-orange-100 text-orange-800',
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-800',
  Churned: 'bg-red-100 text-red-800',
  Sent: 'bg-blue-100 text-blue-800',
  Accepted: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Expired: 'bg-gray-100 text-gray-800',
  Voided: 'bg-red-100 text-red-800',
};

interface StatusBadgeProps {
  status: Status | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${colorClass}`}
    >
      {status}
    </span>
  );
}
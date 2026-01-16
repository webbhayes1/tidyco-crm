// TypeScript types matching ACTUAL Airtable structure (verified via API 2026-01-09)

export interface Client {
  id: string;
  fields: {
    'Name': string;
    'First Name'?: string;
    'Last Name'?: string;
    'Email': string;
    'Phone': string;
    'Address': string;
    'Address Line 2'?: string;
    'City'?: string;
    'State'?: string;
    'Zip Code'?: string;
    'Owner'?: 'Sean' | 'Webb';
    'Lead Source'?: 'Angi' | 'Referral' | 'Direct' | 'Google' | 'Facebook' | 'Thumbtack' | 'Other';
    'Preferred Payment Method'?: 'Zelle' | 'Square' | 'Cash';
    'Has Left Review'?: boolean;
    'Booking History'?: string[]; // Array of Job record IDs
    'Total Bookings'?: number; // Count field
    'Total Lifetime Value'?: number;
    'Preferred Cleaner'?: string[]; // Cleaner record ID
    'Status'?: 'Active' | 'Inactive' | 'Churned';
    'Rating'?: number;
    'Notes'?: string;
    'First Booking Date'?: string; // Rollup
    'Quotes'?: string[]; // Quote record IDs
    'Preferences'?: string;
    'Entry Instructions'?: string;
    'Last Booking Date'?: string; // Rollup
    'Is Recurring'?: boolean;
    'Recurrence Frequency'?: 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly';
    'Recurring Day'?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    'Recurring Days'?: string; // Comma-separated days like "Monday, Tuesday, Wednesday"
    'Recurring Start Time'?: string;
    'Recurring End Time'?: string;
    'First Cleaning Date'?: string; // When the recurring schedule starts
    'Pricing Type'?: 'Hourly Rate' | 'Per Cleaning';
    'Client Hourly Rate'?: number;
    'Charge Per Cleaning'?: number;
    'Bedrooms'?: number;
    'Bathrooms'?: number;
    'Created Date'?: string;
  };
}

export interface Cleaner {
  id: string;
  fields: {
    'Name': string;
    'Photo'?: Array<{ url: string; filename: string }>;
    'Email': string;
    'Phone': string;
    'Zelle Payment Info': string;
    'Service Area Zip Codes'?: string;
    'Availability'?: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>;
    'Preferred Hours'?: string;
    'Jobs Completed'?: number; // Count
    'Average Rating'?: number;
    'Total Earnings'?: number;
    'Pending Payout'?: number;
    'Jobs'?: string[]; // Job record IDs
    'Status'?: 'Active' | 'Inactive' | 'On Leave';
    'Hourly Rate'?: number;
    'Notes'?: string;
    'Birthday'?: string;
    'Work Anniversary'?: string;
    'Address'?: string;
    'Last Job Date'?: string; // Rollup
    'Active Jobs Count'?: number; // Rollup
    'Average Tip Amount'?: number; // Rollup
    'Cleaner Performance Summary (AI)'?: string;
    'Client Feedback Sentiment (AI)'?: string;
    'Clients'?: string[]; // Client record IDs
    'Schedule'?: string[]; // Schedule record IDs
    'Cleaner Training'?: string[]; // Cleaner Training record IDs
    'Average Quality Score'?: number; // Rollup
    'Jobs Below 70 Score'?: number; // Rollup
    'Experience Level'?: 'Junior' | 'Mid-Level' | 'Senior';
    'Language'?: 'English' | 'Spanish' | 'Both';
    'Created Date'?: string;
  };
}

export interface Job {
  id: string;
  fields: {
    'Owner'?: string;
    'Client'?: string[]; // Client record IDs
    'Job ID'?: number;
    'Cleaner'?: string[]; // Cleaner record IDs
    'Date': string;
    'Time': string;
    'End Time'?: string;
    'Address'?: string;
    'Address Line 2'?: string;
    'City'?: string;
    'State'?: string;
    'Zip Code'?: string;
    'Bedrooms'?: number;
    'Bathrooms'?: number;
    'Service Type': 'General Clean' | 'Deep Clean' | 'Move-In-Out';
    'Is Recurring'?: boolean;
    'Recurrence Frequency'?: 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly';
    'Recurring Day'?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    'Recurring Days'?: string; // Comma-separated days like "Monday, Tuesday, Wednesday"
    'Next Cleaning Date'?: string;
    'Duration Hours'?: number; // NOTE: Schema calls this "Estimated Hours" but Airtable has "Duration Hours"
    'Client Hourly Rate'?: number;
    'Amount Charged'?: number;
    'Tip Amount'?: number;
    'Cleaner Hourly Rate'?: number; // Lookup
    'Cleaner Payout'?: number;
    'Total Cleaner Payout'?: number;
    'Profit'?: number; // Formula
    'Status': 'Pending' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    'Payment Status'?: 'Pending' | 'Paid' | 'Refunded';
    'Client Paid Date'?: string;
    'Client Rating'?: number;
    'Client Review'?: string; // NOTE: Schema calls this "Client Feedback"
    'Cleaner Rating'?: number;
    'Cleaner Review'?: string;
    'Photos'?: Array<{ url: string; filename: string }>;
    'Notes'?: string;
    'Client Email'?: string; // Lookup
    'Client Phone'?: string; // Lookup
    'Client Zip Code'?: string; // Lookup
    'Cleaner Email'?: string; // Lookup
    'Cleaner Phone'?: string; // Lookup
    'Cleaner Service Area'?: string; // Lookup
    'Is Paid Out'?: number; // Formula
    'Outstanding Balance'?: number; // Formula
    'Job Duration (Minutes)'?: number; // Formula
    'Client Review Sentiment'?: string; // AI field
    'Job Summary'?: string; // AI field
    'Payments'?: string[]; // Payment record IDs
    'Income'?: string[]; // Income record IDs
    'Expenses'?: string[]; // Expense record IDs
    'Schedule'?: string[]; // Schedule record IDs
    'Confirmed to Client'?: boolean;
    'Confirmed to Cleaner'?: boolean;
    'Reminder Sent'?: boolean;
    'Review Requested'?: boolean;
    'Quotes'?: string[]; // Quote record IDs
    'Checklist Items Completed'?: number;
    'On-Time Arrival'?: boolean;
    'Checklist Items Total'?: number; // Formula
    'Actual Hours'?: number;
    'Cleaner Paid'?: boolean;
    'Cleaner Paid Date'?: string;
    'Payment Method Used'?: string; // Lookup
    'Cleaner Base Pay'?: number; // Formula
    'Payment Link'?: string;
    'Completion Notes'?: string;
    'Created Date'?: string;
    'Last Modified'?: string;
    'Quality Score'?: number; // Formula (0-100)
    'Team'?: string[]; // Team record ID (template used for this job)
  };
}

export interface Payment {
  id: string;
  fields: {
    'Payment ID': number;
    'Job'?: string[]; // Job record IDs
    'Client'?: string; // Lookup
    'Cleaner'?: string; // Lookup
    'Amount Charged'?: number; // Lookup
    'Cleaner Payout'?: number; // Lookup
    'Square Transaction ID'?: string;
    'Payment Date'?: string;
    'Payout Date'?: string;
    'Status': 'Pending' | 'Completed' | 'Refunded' | 'Failed';
    'Payment Method'?: 'Zelle' | 'Square' | 'Cash' | 'Credit Card' | 'Check';
    'Notes'?: string;
    'Created Date'?: string;
  };
}

export interface Income {
  id: string;
  fields: {
    'Income ID': number;
    'Job'?: string[]; // Job record IDs
    'Date': string;
    'Client'?: string; // Lookup
    'Owner'?: string; // Lookup
    'Amount': number;
    'Payment Method': 'Zelle' | 'Square' | 'Cash';
    'Category'?: 'Cleaning Service' | 'Tip' | 'Other';
    'Notes'?: string;
    'Created Date'?: string;
  };
}

export interface Expense {
  id: string;
  fields: {
    'Expense ID': number;
    'Date': string;
    'Category': 'Cleaning Supplies' | 'Gas-Mileage' | 'Marketing' | 'Cleaner Payouts' | 'Tools-Equipment' | 'Other';
    'Description': string;
    'Amount': number;
    'Paid By': 'Sean' | 'Webb' | 'Business Account';
    'Payment Method'?: 'Zelle' | 'Credit Card' | 'Cash' | 'Check';
    'Related Job'?: string[]; // Job record IDs
    'Reimbursed'?: boolean;
    'Receipt'?: Array<{ url: string; filename: string }>;
    'Notes'?: string;
    'Created Date'?: string;
  };
}

export interface Schedule {
  id: string;
  fields: {
    'Id': number;
    'Cleaner'?: string[]; // Cleaner record IDs
    'Monday Availability'?: 'Available' | 'Booked' | 'Off';
    'Tuesday Availability'?: 'Available' | 'Booked' | 'Off';
    'Wednesday Availability'?: 'Available' | 'Booked' | 'Off';
    'Thursday Availability'?: 'Available' | 'Booked' | 'Off';
    'Friday Availability'?: 'Available' | 'Booked' | 'Off';
    'Saturday Availability'?: 'Available' | 'Booked' | 'Off';
    'Sunday Availability'?: 'Available' | 'Booked' | 'Off';
    'Jobs This Week'?: string[]; // Job record IDs
    'Total Jobs'?: number; // Count
    'Notes'?: string;
    'Week Of'?: string;
  };
}

export interface Quote {
  id: string;
  fields: {
    'Quote Name'?: string; // Formula
    'Quote ID': number;
    'Client'?: string[]; // Client record IDs
    'Name (from Client)'?: string; // Lookup
    'Email (from Client)'?: string; // Lookup
    'Phone (from Client)'?: string; // Lookup
    'Owner (from Client)'?: 'Sean' | 'Webb'; // Lookup
    'Service Type': 'General Clean' | 'Deep Clean' | 'Move-In-Out';
    'Bedrooms'?: number;
    'Bathrooms'?: number;
    'Address'?: string;
    'Zip Code'?: string;
    'Estimated Hours'?: number; // Formula
    'Client Hourly Rate'?: number;
    'Price Quote'?: number; // Formula
    'Status': 'Pending' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
    'Created Date'?: string;
    'Sent Date'?: string;
    'Expiration Date'?: string; // Formula
    'Response Date'?: string;
    'Converted Job'?: string[]; // Job record IDs
    'Quote Notes'?: string;
    'Internal Notes'?: string;
  };
}

export interface TrainingModule {
  id: string;
  fields: {
    'Module Name': string;
    'Quote ID': number;
    'Module Type': 'Skill' | 'Checklist' | 'Safety' | 'Equipment';
    'Description'?: string;
    'Video Link'?: string;
    'Completion Criteria'?: string;
    'Passing Score'?: number;
    'Required for Experience Level'?: Array<'Junior' | 'Mid-Level' | 'Senior'>;
    'Active'?: boolean;
    'Created Date'?: string;
    'Cleaner Training'?: string[]; // Cleaner Training record IDs
  };
}

export interface CleanerTraining {
  id: string;
  fields: {
    'Training Record'?: string; // Formula
    'Record ID': number;
    'Cleaner'?: string[]; // Cleaner record IDs
    'Training Module'?: string[]; // Training Module record IDs
    'Status': 'Not Started' | 'In Progress' | 'Completed' | 'Failed';
    'Started Date'?: string;
    'Completed Date'?: string;
    'Score'?: number;
    'Passing Score'?: number; // Lookup
    'Passed'?: boolean; // Formula
    'Submission Notes'?: string;
    'Submission Photo'?: Array<{ url: string; filename: string }>;
    'Graded By'?: 'Sean' | 'Webb';
    'Grading Notes'?: string;
    'Retake Count'?: number;
  };
}

export interface Team {
  id: string;
  fields: {
    'Team Name': string;
    'Members'?: string[]; // Cleaner record IDs
    'Team Lead'?: string[]; // Single cleaner record ID (optional)
    'Status'?: 'Active' | 'Inactive';
    'Notes'?: string;
    'Member Names'?: string[]; // Lookup from Members.Name
    'Member Phones'?: string[]; // Lookup from Members.Phone
    'Member Count'?: number; // Count from Members
    'Total Hourly Rate'?: number; // Rollup SUM of Members.Hourly Rate
    'Jobs'?: string[]; // Job record IDs (inverse link)
  };
}

export interface Lead {
  id: string;
  fields: {
    'Name': string;
    'Email'?: string;
    'Phone'?: string;
    'Address'?: string;
    'City'?: string;
    'State'?: string;
    'Zip Code'?: string;
    'Lead Source'?: 'Angi' | 'Referral' | 'Direct' | 'Google' | 'Facebook' | 'Thumbtack' | 'Other';
    'Angi Lead ID'?: string; // For deduplication from Angi imports
    'Service Type Interested'?: 'General Clean' | 'Deep Clean' | 'Move-In-Out';
    'Bedrooms'?: number;
    'Bathrooms'?: number;
    'Status'?: 'New' | 'Contacted' | 'Qualified' | 'Quote Sent' | 'Won' | 'Lost' | 'Churned';
    'Owner'?: 'Sean' | 'Webb';
    'Lead Score'?: number; // 0-100 based on engagement
    'Times Contacted'?: number;
    'Last Contact Date'?: string;
    'Next Follow-Up Date'?: string;
    'Notes'?: string;
    'Lost Reason'?: 'Price too high' | 'Chose competitor' | 'No response' | 'Not ready' | 'Outside service area' | 'Other';
    'Won Reason'?: 'Good Price' | 'Quality Service' | 'Fast Response' | 'Good Reviews' | 'Referral Trust' | 'Availability' | 'Other';
    'Disposition Tags'?: string[]; // Disposition Tag record IDs
    'Activities'?: string[]; // Lead Activity record IDs
    'Converted Client'?: string[]; // Client record ID when converted
    'Original Client'?: string[]; // Original client if churned re-entered as lead
    'Created Date'?: string;
    'Last Modified'?: string;
  };
}

export interface DispositionTag {
  id: string;
  fields: {
    'Name': string;
    'Color'?: 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue' | 'Purple' | 'Pink' | 'Gray';
    'Description'?: string;
    'Active'?: boolean;
  };
}

export interface LeadActivity {
  id: string;
  fields: {
    'Description': string;
    'Type'?: 'Note' | 'Call' | 'Email' | 'SMS' | 'Meeting' | 'Quote Sent' | 'Status Change' | 'Follow-up';
    'Created By'?: string;
    'Activity Date'?: string;
    'Lead'?: string[]; // Lead record ID
  };
}

export interface Invoice {
  id: string;
  fields: {
    'Invoice Number': string;
    'Client': string[]; // Client record ID
    'Job'?: string[]; // Optional Job record ID
    'Status': 'Pending' | 'Paid' | 'Voided';
    'Service Date': string;
    'Service Type': 'General Clean' | 'Deep Clean' | 'Move-In-Out';
    'Hours': number;
    'Rate': number;
    'Amount'?: number; // Calculated: Hours * Rate
    'Due Date'?: string;
    'Payment Method'?: 'Zelle' | 'Square' | 'Cash' | 'Credit Card' | 'Check';
    'Payment Date'?: string;
    'Notes'?: string;
    'Sent Date'?: string;
    'Client Name'?: string; // Lookup
    'Client Email'?: string; // Lookup
    'Client Address'?: string; // Lookup
    'Created Date'?: string;
  };
}

export interface SMSTemplate {
  id: string;
  fields: {
    'Name': string;
    'Body': string;
    'Category'?: 'Lead Nurture' | 'Booking' | 'Payment' | 'Re-engagement' | 'Custom';
    'Active'?: boolean;
    'Use Count'?: number;
    'Last Used'?: string;
    'Created By'?: 'Sean' | 'Webb' | 'System';
    'Notes'?: string;
  };
}

export interface DripCampaign {
  id: string;
  fields: {
    'Name': string;
    'Description'?: string;
    'Trigger Type'?: 'Manual' | 'New Lead' | 'Status Change' | 'No Response' | 'Scheduled';
    'Trigger Conditions'?: string; // JSON configuration
    'Status'?: 'Active' | 'Paused' | 'Draft' | 'Archived';
    'Sequence'?: string; // JSON array of steps with templateId and delay
    'Lead Count'?: number;
    'Conversion Rate'?: number;
    'Notes'?: string;
    'Campaign Enrollments'?: string[]; // Campaign Enrollment record IDs
  };
}

export interface CampaignEnrollment {
  id: string;
  fields: {
    'Enrollment Name'?: string;
    'Lead'?: string[]; // Lead record ID
    'Campaign'?: string[]; // Drip Campaign record ID
    'Status'?: 'Active' | 'Completed' | 'Cancelled' | 'Paused';
    'Current Step'?: number;
    'Enrolled Date'?: string;
    'Last Message Date'?: string;
    'Next Message Date'?: string;
    'Completed Date'?: string;
    'Cancel Reason'?: 'Converted' | 'Unsubscribed' | 'Manual' | 'Lead Lost';
  };
}

// Twilio message type (for message history from Twilio API)
export interface TwilioMessage {
  sid: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound-api' | 'outbound-reply';
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  dateSent: string;
  dateCreated: string;
}

// Helper types for API responses
export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

export interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}
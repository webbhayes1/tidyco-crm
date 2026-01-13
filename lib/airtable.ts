import Airtable, { FieldSet, Record } from 'airtable';
import {
  Client,
  Cleaner,
  Job,
  Payment,
  Income,
  Expense,
  Schedule,
  Quote,
  TrainingModule,
  CleanerTraining,
} from '@/types/airtable';

// Initialize Airtable
const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY!,
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID!);

// Table names matching Airtable exactly
const TABLES = {
  CLIENTS: 'Clients',
  CLEANERS: 'Cleaners',
  JOBS: 'Jobs',
  PAYMENTS: 'Payments',
  INCOME: 'Income',
  EXPENSES: 'Expenses',
  SCHEDULE: 'Schedule',
  QUOTES: 'Quotes',
  TRAINING_MODULES: 'Training Modules',
  CLEANER_TRAINING: 'Cleaner Training',
} as const;

// Helper function to convert Airtable record to our type
function convertRecord<T>(record: Record<FieldSet>): T {
  return {
    id: record.id,
    fields: record.fields,
  } as T;
}

// ===== CLIENTS =====
export async function getClients(view?: string): Promise<Client[]> {
  const records = await base(TABLES.CLIENTS)
    .select({ view: view || 'Grid view' })
    .all();
  return records.map(convertRecord<Client>);
}

export async function getClient(id: string): Promise<Client | null> {
  try {
    const record = await base(TABLES.CLIENTS).find(id);
    return convertRecord<Client>(record);
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
}

export async function createClient(fields: Client['fields']): Promise<Client> {
  const record = await base(TABLES.CLIENTS).create(fields as FieldSet);
  return convertRecord<Client>(record);
}

export async function updateClient(id: string, fields: Partial<Client['fields']>): Promise<Client> {
  const record = await base(TABLES.CLIENTS).update(id, fields as FieldSet);
  return convertRecord<Client>(record);
}

export async function deleteClient(id: string, deleteFutureJobs: boolean = true): Promise<void> {
  // If deleteFutureJobs is true, delete all future jobs for this client
  if (deleteFutureJobs) {
    const today = new Date().toISOString().split('T')[0];
    const allJobs = await base(TABLES.JOBS)
      .select({
        filterByFormula: `AND(FIND("${id}", ARRAYJOIN({Client})), {Date} >= "${today}")`,
      })
      .all();

    // Delete jobs in batches of 10 (Airtable limit)
    const jobIds = allJobs.map(job => job.id);
    for (let i = 0; i < jobIds.length; i += 10) {
      const batch = jobIds.slice(i, i + 10);
      if (batch.length > 0) {
        await base(TABLES.JOBS).destroy(batch);
      }
    }
  }

  // Delete the client
  await base(TABLES.CLIENTS).destroy(id);
}

// ===== CLEANERS =====
export async function getCleaners(view?: string): Promise<Cleaner[]> {
  const records = await base(TABLES.CLEANERS)
    .select({ view: view || 'Grid view' })
    .all();
  return records.map(convertRecord<Cleaner>);
}

export async function getCleaner(id: string): Promise<Cleaner | null> {
  try {
    const record = await base(TABLES.CLEANERS).find(id);
    return convertRecord<Cleaner>(record);
  } catch (error) {
    console.error('Error fetching cleaner:', error);
    return null;
  }
}

export async function createCleaner(fields: Cleaner['fields']): Promise<Cleaner> {
  const record = await base(TABLES.CLEANERS).create(fields as unknown as FieldSet);
  return convertRecord<Cleaner>(record);
}

export async function updateCleaner(id: string, fields: Partial<Cleaner['fields']>): Promise<Cleaner> {
  const record = await base(TABLES.CLEANERS).update(id, fields as FieldSet);
  return convertRecord<Cleaner>(record);
}

export async function deleteCleaner(id: string): Promise<void> {
  await base(TABLES.CLEANERS).destroy(id);
}

// ===== JOBS =====
export async function getJobs(options?: {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
}): Promise<Job[]> {
  const selectOptions: any = {
    view: options?.view || 'Grid view',
  };

  // Only include filterByFormula and maxRecords if they're defined
  if (options?.filterByFormula) {
    selectOptions.filterByFormula = options.filterByFormula;
  }
  if (options?.maxRecords !== undefined) {
    selectOptions.maxRecords = options.maxRecords;
  }

  const records = await base(TABLES.JOBS).select(selectOptions).all();
  return records.map(convertRecord<Job>);
}

export async function getJob(id: string): Promise<Job | null> {
  try {
    const record = await base(TABLES.JOBS).find(id);
    return convertRecord<Job>(record);
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
}

export async function createJob(fields: Job['fields']): Promise<Job> {
  const record = await base(TABLES.JOBS).create(fields as unknown as FieldSet);
  return convertRecord<Job>(record);
}

export async function updateJob(id: string, fields: Partial<Job['fields']>): Promise<Job> {
  const record = await base(TABLES.JOBS).update(id, fields as unknown as FieldSet);
  return convertRecord<Job>(record);
}

export async function deleteJob(id: string): Promise<void> {
  await base(TABLES.JOBS).destroy(id);
}

// Get jobs for this week (Sunday to Saturday)
export async function getJobsThisWeek(): Promise<Job[]> {
  try {
    const today = new Date();
    // Get start of week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];

    const formula = `AND({Date} >= '${startDate}', {Date} <= '${endDate}')`;
    return await getJobs({ filterByFormula: formula });
  } catch (error) {
    console.error('Error getting jobs this week:', error);
    return [];
  }
}

// Get upcoming jobs (all future jobs, limited for dashboard display)
export async function getUpcomingJobs(limit: number = 20): Promise<Job[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const formula = `{Date} >= '${today}'`;
    const jobs = await getJobs({ filterByFormula: formula });
    // Sort by date ascending and limit
    return jobs
      .sort((a, b) => {
        const dateA = a.fields.Date || '';
        const dateB = b.fields.Date || '';
        return dateA.localeCompare(dateB);
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting upcoming jobs:', error);
    return [];
  }
}

// Get unassigned jobs
export async function getUnassignedJobs(): Promise<Job[]> {
  const formula = `{Cleaner} = BLANK()`;
  return getJobs({ filterByFormula: formula });
}

// Get jobs for this month
export async function getJobsThisMonth(): Promise<Job[]> {
  try {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    const formula = `AND({Date} >= '${startDate}', {Date} <= '${endDate}')`;
    return await getJobs({ filterByFormula: formula });
  } catch (error) {
    console.error('Error getting jobs this month:', error);
    return [];
  }
}

// ===== PAYMENTS =====
export async function getPayments(view?: string): Promise<Payment[]> {
  const records = await base(TABLES.PAYMENTS)
    .select({ view: view || 'Grid view' })
    .all();
  return records.map(convertRecord<Payment>);
}

// ===== INCOME =====
export async function getIncome(view?: string): Promise<Income[]> {
  const records = await base(TABLES.INCOME)
    .select({ view: view || 'Grid view' })
    .all();
  return records.map(convertRecord<Income>);
}

// Get income for this month
export async function getIncomeThisMonth(): Promise<Income[]> {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const formula = `AND(
    IS_AFTER({Date}, '${firstDay.toISOString().split('T')[0]}'),
    IS_BEFORE({Date}, '${lastDay.toISOString().split('T')[0]}')
  )`;

  const records = await base(TABLES.INCOME)
    .select({ filterByFormula: formula })
    .all();
  return records.map(convertRecord<Income>);
}

// ===== EXPENSES =====
export async function getExpenses(view?: string): Promise<Expense[]> {
  const records = await base(TABLES.EXPENSES)
    .select({ view: view || 'Grid view' })
    .all();
  return records.map(convertRecord<Expense>);
}

// ===== SCHEDULE =====
export async function getSchedules(view?: string): Promise<Schedule[]> {
  const records = await base(TABLES.SCHEDULE)
    .select({ view: view || 'Grid view' })
    .all();
  return records.map(convertRecord<Schedule>);
}

// ===== QUOTES =====
export async function getQuotes(view?: string): Promise<Quote[]> {
  const records = await base(TABLES.QUOTES)
    .select({ view: view || 'Grid view' })
    .all();
  return records.map(convertRecord<Quote>);
}

export async function getQuote(id: string): Promise<Quote | null> {
  try {
    const record = await base(TABLES.QUOTES).find(id);
    return convertRecord<Quote>(record);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return null;
  }
}

export async function updateQuote(id: string, fields: Partial<Quote['fields']>): Promise<Quote> {
  const record = await base(TABLES.QUOTES).update(id, fields as FieldSet);
  return convertRecord<Quote>(record);
}

// ===== TRAINING MODULES =====
export async function getTrainingModules(view?: string): Promise<TrainingModule[]> {
  const records = await base(TABLES.TRAINING_MODULES)
    .select({ view: view || 'Active Modules' })
    .all();
  return records.map(convertRecord<TrainingModule>);
}

// ===== CLEANER TRAINING =====
export async function getCleanerTraining(cleanerId?: string): Promise<CleanerTraining[]> {
  const options: any = { view: 'Grid view' };

  if (cleanerId) {
    options.filterByFormula = `{Cleaner} = '${cleanerId}'`;
  }

  const records = await base(TABLES.CLEANER_TRAINING)
    .select(options)
    .all();
  return records.map(convertRecord<CleanerTraining>);
}

// ===== DASHBOARD METRICS =====
export async function getDashboardMetrics() {
  const [
    thisWeekJobs,
    thisMonthJobs,
    allClients,
    allCleaners,
  ] = await Promise.all([
    getJobsThisWeek(),
    getJobsThisMonth(),
    getClients('Grid view'),
    getCleaners('Grid view'),
  ]);

  // Filter for active clients and cleaners
  const activeClients = allClients.filter(c => c.fields.Status === 'Active');
  const activeCleaners = allCleaners.filter(c => c.fields.Status === 'Active');

  // Expected monthly revenue from all jobs scheduled this month
  const expectedMonthlyRevenue = thisMonthJobs.reduce((sum, job) => sum + (job.fields['Amount Charged'] || 0), 0);
  const avgQualityScore = activeCleaners.length > 0
    ? activeCleaners.reduce((sum, cleaner) => sum + (cleaner.fields['Average Quality Score'] || 0), 0) / activeCleaners.length
    : 0;

  return {
    thisWeekJobsCount: thisWeekJobs.length,
    thisWeekRevenue: thisWeekJobs.reduce((sum, job) => sum + (job.fields['Amount Charged'] || 0), 0),
    expectedMonthlyRevenue,
    thisMonthJobsCount: thisMonthJobs.length,
    activeClientsCount: activeClients.length,
    activeCleanersCount: activeCleaners.length,
    avgQualityScore: Math.round(avgQualityScore),
  };
}
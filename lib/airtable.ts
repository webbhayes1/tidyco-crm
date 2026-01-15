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
  Team,
  Lead,
  Invoice,
  SMSTemplate,
  DripCampaign,
  CampaignEnrollment,
  DispositionTag,
  LeadActivity,
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
  TEAMS: 'Teams',
  LEADS: 'Leads',
  INVOICES: 'Invoices',
  SMS_TEMPLATES: 'SMS Templates',
  DRIP_CAMPAIGNS: 'Drip Campaigns',
  CAMPAIGN_ENROLLMENTS: 'Campaign Enrollments',
  DISPOSITION_TAGS: 'Disposition Tags',
  LEAD_ACTIVITIES: 'Lead Activities',
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

// ===== TEAMS =====
export async function getTeams(view?: string): Promise<Team[]> {
  const records = await base(TABLES.TEAMS)
    .select({ view: view || 'Grid view' })
    .all();
  return records.map(convertRecord<Team>);
}

export async function getTeam(id: string): Promise<Team | null> {
  try {
    const record = await base(TABLES.TEAMS).find(id);
    return convertRecord<Team>(record);
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
}

export async function createTeam(fields: Team['fields']): Promise<Team> {
  const record = await base(TABLES.TEAMS).create(fields as unknown as FieldSet);
  return convertRecord<Team>(record);
}

export async function updateTeam(id: string, fields: Partial<Team['fields']>): Promise<Team> {
  const record = await base(TABLES.TEAMS).update(id, fields as unknown as FieldSet);
  return convertRecord<Team>(record);
}

export async function deleteTeam(id: string): Promise<void> {
  await base(TABLES.TEAMS).destroy(id);
}

// Get active teams only
export async function getActiveTeams(): Promise<Team[]> {
  const formula = `{Status} = 'Active'`;
  const records = await base(TABLES.TEAMS)
    .select({ filterByFormula: formula })
    .all();
  return records.map(convertRecord<Team>);
}

// ===== LEADS =====
export async function getLeads(options?: {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
}): Promise<Lead[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectOptions: any = {
    view: options?.view || 'Grid view',
  };

  if (options?.filterByFormula) {
    selectOptions.filterByFormula = options.filterByFormula;
  }
  if (options?.maxRecords !== undefined) {
    selectOptions.maxRecords = options.maxRecords;
  }

  const records = await base(TABLES.LEADS).select(selectOptions).all();
  return records.map(convertRecord<Lead>);
}

export async function getLead(id: string): Promise<Lead | null> {
  try {
    const record = await base(TABLES.LEADS).find(id);
    return convertRecord<Lead>(record);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return null;
  }
}

export async function createLead(fields: Lead['fields']): Promise<Lead> {
  const record = await base(TABLES.LEADS).create(fields as unknown as FieldSet);
  return convertRecord<Lead>(record);
}

export async function createLeads(leads: Lead['fields'][]): Promise<Lead[]> {
  // Airtable allows max 10 records per batch
  const results: Lead[] = [];
  for (let i = 0; i < leads.length; i += 10) {
    const batch = leads.slice(i, i + 10).map(fields => ({ fields: fields as unknown as FieldSet }));
    const records = await base(TABLES.LEADS).create(batch);
    results.push(...records.map(convertRecord<Lead>));
  }
  return results;
}

export async function updateLead(id: string, fields: Partial<Lead['fields']>): Promise<Lead> {
  const record = await base(TABLES.LEADS).update(id, fields as unknown as FieldSet);
  return convertRecord<Lead>(record);
}

export async function deleteLead(id: string): Promise<void> {
  await base(TABLES.LEADS).destroy(id);
}

// Get leads by status
export async function getLeadsByStatus(status: Lead['fields']['Status']): Promise<Lead[]> {
  const formula = `{Status} = '${status}'`;
  return getLeads({ filterByFormula: formula });
}

// Get new leads (for dashboard)
export async function getNewLeads(): Promise<Lead[]> {
  return getLeadsByStatus('New');
}

// Get leads needing follow-up (Next Follow-Up Date is today or past)
export async function getLeadsNeedingFollowUp(): Promise<Lead[]> {
  const today = new Date().toISOString().split('T')[0];
  const formula = `AND({Next Follow-Up Date} <= '${today}', {Status} != 'Won', {Status} != 'Lost')`;
  return getLeads({ filterByFormula: formula });
}

// Check for duplicate lead by phone or Angi Lead ID
export async function findDuplicateLead(phone?: string, angiLeadId?: string): Promise<Lead | null> {
  if (!phone && !angiLeadId) return null;

  const conditions: string[] = [];
  if (phone) {
    conditions.push(`{Phone} = '${phone}'`);
  }
  if (angiLeadId) {
    conditions.push(`{Angi Lead ID} = '${angiLeadId}'`);
  }

  const formula = conditions.length > 1 ? `OR(${conditions.join(', ')})` : conditions[0];
  const leads = await getLeads({ filterByFormula: formula, maxRecords: 1 });
  return leads.length > 0 ? leads[0] : null;
}

// ===== INVOICES =====
export async function getInvoices(options?: {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
}): Promise<Invoice[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectOptions: any = {
    view: options?.view || 'Grid view',
  };

  if (options?.filterByFormula) {
    selectOptions.filterByFormula = options.filterByFormula;
  }
  if (options?.maxRecords !== undefined) {
    selectOptions.maxRecords = options.maxRecords;
  }

  const records = await base(TABLES.INVOICES).select(selectOptions).all();
  return records.map(convertRecord<Invoice>);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const record = await base(TABLES.INVOICES).find(id);
    return convertRecord<Invoice>(record);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

export async function createInvoice(fields: Partial<Invoice['fields']>): Promise<Invoice> {
  const record = await base(TABLES.INVOICES).create(fields as unknown as FieldSet);
  return convertRecord<Invoice>(record);
}

export async function updateInvoice(id: string, fields: Partial<Invoice['fields']>): Promise<Invoice> {
  const record = await base(TABLES.INVOICES).update(id, fields as unknown as FieldSet);
  return convertRecord<Invoice>(record);
}

export async function deleteInvoice(id: string): Promise<void> {
  await base(TABLES.INVOICES).destroy(id);
}

// Get invoices by status
export async function getInvoicesByStatus(status: Invoice['fields']['Status']): Promise<Invoice[]> {
  const formula = `{Status} = '${status}'`;
  return getInvoices({ filterByFormula: formula });
}

// Get pending invoices
export async function getPendingInvoices(): Promise<Invoice[]> {
  return getInvoicesByStatus('Pending');
}

// Get next invoice number
export async function getNextInvoiceNumber(): Promise<string> {
  const invoices = await getInvoices();
  const maxNum = invoices.reduce((max, inv) => {
    const match = inv.fields['Invoice Number']?.match(/INV-(\d+)/);
    const num = match ? parseInt(match[1], 10) : 0;
    return num > max ? num : max;
  }, 0);
  return `INV-${String(maxNum + 1).padStart(4, '0')}`;
}

// ===== SMS TEMPLATES =====
export async function getSMSTemplates(options?: {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
}): Promise<SMSTemplate[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectOptions: any = {
    view: options?.view || 'Grid view',
  };

  if (options?.filterByFormula) {
    selectOptions.filterByFormula = options.filterByFormula;
  }
  if (options?.maxRecords !== undefined) {
    selectOptions.maxRecords = options.maxRecords;
  }

  const records = await base(TABLES.SMS_TEMPLATES).select(selectOptions).all();
  return records.map(convertRecord<SMSTemplate>);
}

export async function getSMSTemplate(id: string): Promise<SMSTemplate | null> {
  try {
    const record = await base(TABLES.SMS_TEMPLATES).find(id);
    return convertRecord<SMSTemplate>(record);
  } catch (error) {
    console.error('Error fetching SMS template:', error);
    return null;
  }
}

export async function createSMSTemplate(fields: SMSTemplate['fields']): Promise<SMSTemplate> {
  const record = await base(TABLES.SMS_TEMPLATES).create(fields as unknown as FieldSet);
  return convertRecord<SMSTemplate>(record);
}

export async function updateSMSTemplate(id: string, fields: Partial<SMSTemplate['fields']>): Promise<SMSTemplate> {
  const record = await base(TABLES.SMS_TEMPLATES).update(id, fields as unknown as FieldSet);
  return convertRecord<SMSTemplate>(record);
}

export async function deleteSMSTemplate(id: string): Promise<void> {
  await base(TABLES.SMS_TEMPLATES).destroy(id);
}

// Get active templates only
export async function getActiveSMSTemplates(): Promise<SMSTemplate[]> {
  const formula = `{Active} = TRUE()`;
  return getSMSTemplates({ filterByFormula: formula });
}

// Get templates by category
export async function getSMSTemplatesByCategory(category: SMSTemplate['fields']['Category']): Promise<SMSTemplate[]> {
  const formula = `{Category} = '${category}'`;
  return getSMSTemplates({ filterByFormula: formula });
}

// ===== DRIP CAMPAIGNS =====
export async function getDripCampaigns(options?: {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
}): Promise<DripCampaign[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectOptions: any = {
    view: options?.view || 'Grid view',
  };

  if (options?.filterByFormula) {
    selectOptions.filterByFormula = options.filterByFormula;
  }
  if (options?.maxRecords !== undefined) {
    selectOptions.maxRecords = options.maxRecords;
  }

  const records = await base(TABLES.DRIP_CAMPAIGNS).select(selectOptions).all();
  return records.map(convertRecord<DripCampaign>);
}

export async function getDripCampaign(id: string): Promise<DripCampaign | null> {
  try {
    const record = await base(TABLES.DRIP_CAMPAIGNS).find(id);
    return convertRecord<DripCampaign>(record);
  } catch (error) {
    console.error('Error fetching drip campaign:', error);
    return null;
  }
}

export async function createDripCampaign(fields: DripCampaign['fields']): Promise<DripCampaign> {
  const record = await base(TABLES.DRIP_CAMPAIGNS).create(fields as unknown as FieldSet);
  return convertRecord<DripCampaign>(record);
}

export async function updateDripCampaign(id: string, fields: Partial<DripCampaign['fields']>): Promise<DripCampaign> {
  const record = await base(TABLES.DRIP_CAMPAIGNS).update(id, fields as unknown as FieldSet);
  return convertRecord<DripCampaign>(record);
}

export async function deleteDripCampaign(id: string): Promise<void> {
  await base(TABLES.DRIP_CAMPAIGNS).destroy(id);
}

// Get active campaigns only
export async function getActiveDripCampaigns(): Promise<DripCampaign[]> {
  const formula = `{Status} = 'Active'`;
  return getDripCampaigns({ filterByFormula: formula });
}

// ===== CAMPAIGN ENROLLMENTS =====
export async function getCampaignEnrollments(options?: {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
}): Promise<CampaignEnrollment[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectOptions: any = {
    view: options?.view || 'Grid view',
  };

  if (options?.filterByFormula) {
    selectOptions.filterByFormula = options.filterByFormula;
  }
  if (options?.maxRecords !== undefined) {
    selectOptions.maxRecords = options.maxRecords;
  }

  const records = await base(TABLES.CAMPAIGN_ENROLLMENTS).select(selectOptions).all();
  return records.map(convertRecord<CampaignEnrollment>);
}

export async function getCampaignEnrollment(id: string): Promise<CampaignEnrollment | null> {
  try {
    const record = await base(TABLES.CAMPAIGN_ENROLLMENTS).find(id);
    return convertRecord<CampaignEnrollment>(record);
  } catch (error) {
    console.error('Error fetching campaign enrollment:', error);
    return null;
  }
}

export async function createCampaignEnrollment(fields: CampaignEnrollment['fields']): Promise<CampaignEnrollment> {
  const record = await base(TABLES.CAMPAIGN_ENROLLMENTS).create(fields as unknown as FieldSet);
  return convertRecord<CampaignEnrollment>(record);
}

export async function updateCampaignEnrollment(id: string, fields: Partial<CampaignEnrollment['fields']>): Promise<CampaignEnrollment> {
  const record = await base(TABLES.CAMPAIGN_ENROLLMENTS).update(id, fields as unknown as FieldSet);
  return convertRecord<CampaignEnrollment>(record);
}

export async function deleteCampaignEnrollment(id: string): Promise<void> {
  await base(TABLES.CAMPAIGN_ENROLLMENTS).destroy(id);
}

// Get active enrollments only
export async function getActiveEnrollments(): Promise<CampaignEnrollment[]> {
  const formula = `{Status} = 'Active'`;
  return getCampaignEnrollments({ filterByFormula: formula });
}

// Get enrollments for a specific lead
export async function getEnrollmentsForLead(leadId: string): Promise<CampaignEnrollment[]> {
  const formula = `FIND("${leadId}", ARRAYJOIN({Lead}))`;
  return getCampaignEnrollments({ filterByFormula: formula });
}

// Get enrollments with upcoming messages (for scheduled messages display)
export async function getScheduledEnrollments(): Promise<CampaignEnrollment[]> {
  const today = new Date().toISOString().split('T')[0];
  const formula = `AND({Status} = 'Active', {Next Message Date} >= '${today}')`;
  return getCampaignEnrollments({ filterByFormula: formula });
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

// ===== DISPOSITION TAGS =====
export async function getDispositionTags(options?: {
  view?: string;
  filterByFormula?: string;
}): Promise<DispositionTag[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectOptions: any = {
    view: options?.view || 'Grid view',
  };

  if (options?.filterByFormula) {
    selectOptions.filterByFormula = options.filterByFormula;
  }

  const records = await base(TABLES.DISPOSITION_TAGS).select(selectOptions).all();
  return records.map(convertRecord<DispositionTag>);
}

export async function getDispositionTag(id: string): Promise<DispositionTag | null> {
  try {
    const record = await base(TABLES.DISPOSITION_TAGS).find(id);
    return convertRecord<DispositionTag>(record);
  } catch (error) {
    console.error('Error fetching disposition tag:', error);
    return null;
  }
}

export async function createDispositionTag(fields: DispositionTag['fields']): Promise<DispositionTag> {
  const record = await base(TABLES.DISPOSITION_TAGS).create(fields as unknown as FieldSet);
  return convertRecord<DispositionTag>(record);
}

export async function updateDispositionTag(id: string, fields: Partial<DispositionTag['fields']>): Promise<DispositionTag> {
  const record = await base(TABLES.DISPOSITION_TAGS).update(id, fields as unknown as FieldSet);
  return convertRecord<DispositionTag>(record);
}

export async function deleteDispositionTag(id: string): Promise<void> {
  await base(TABLES.DISPOSITION_TAGS).destroy(id);
}

// Get active disposition tags only
export async function getActiveDispositionTags(): Promise<DispositionTag[]> {
  const formula = `{Active} = TRUE()`;
  return getDispositionTags({ filterByFormula: formula });
}

// ===== LEAD ACTIVITIES =====
export async function getLeadActivities(options?: {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
}): Promise<LeadActivity[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectOptions: any = {
    view: options?.view || 'Grid view',
  };

  if (options?.filterByFormula) {
    selectOptions.filterByFormula = options.filterByFormula;
  }
  if (options?.maxRecords !== undefined) {
    selectOptions.maxRecords = options.maxRecords;
  }

  const records = await base(TABLES.LEAD_ACTIVITIES).select(selectOptions).all();
  return records.map(convertRecord<LeadActivity>);
}

export async function getLeadActivity(id: string): Promise<LeadActivity | null> {
  try {
    const record = await base(TABLES.LEAD_ACTIVITIES).find(id);
    return convertRecord<LeadActivity>(record);
  } catch (error) {
    console.error('Error fetching lead activity:', error);
    return null;
  }
}

export async function createLeadActivity(fields: LeadActivity['fields']): Promise<LeadActivity> {
  const record = await base(TABLES.LEAD_ACTIVITIES).create(fields as unknown as FieldSet);
  return convertRecord<LeadActivity>(record);
}

export async function updateLeadActivity(id: string, fields: Partial<LeadActivity['fields']>): Promise<LeadActivity> {
  const record = await base(TABLES.LEAD_ACTIVITIES).update(id, fields as unknown as FieldSet);
  return convertRecord<LeadActivity>(record);
}

export async function deleteLeadActivity(id: string): Promise<void> {
  await base(TABLES.LEAD_ACTIVITIES).destroy(id);
}

// Get activities for a specific lead (sorted by date descending)
export async function getActivitiesForLead(leadId: string): Promise<LeadActivity[]> {
  const formula = `FIND("${leadId}", ARRAYJOIN({Lead}))`;
  const activities = await getLeadActivities({ filterByFormula: formula });
  // Sort by Activity Date descending (most recent first)
  return activities.sort((a, b) => {
    const dateA = a.fields['Activity Date'] || '';
    const dateB = b.fields['Activity Date'] || '';
    return dateB.localeCompare(dateA);
  });
}

// Get recent activities across all leads
export async function getRecentLeadActivities(limit: number = 20): Promise<LeadActivity[]> {
  const activities = await getLeadActivities({ maxRecords: limit * 2 }); // Fetch extra to allow sorting
  // Sort by Activity Date descending and limit
  return activities
    .sort((a, b) => {
      const dateA = a.fields['Activity Date'] || '';
      const dateB = b.fields['Activity Date'] || '';
      return dateB.localeCompare(dateA);
    })
    .slice(0, limit);
}
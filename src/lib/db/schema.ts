import { mysqlTable, varchar, char, text, datetime, decimal, int, boolean, mysqlEnum, index, uniqueIndex, primaryKey } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Enums
export const JobStatus = mysqlEnum('JobStatus', ['PENDING', 'PROSES', 'REVISI', 'REVISI_PROSES', 'VERIFIKASI', 'SELESAI', 'CANCELLED']);
export const JobPriority = mysqlEnum('JobPriority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const InvoiceStatus = mysqlEnum('InvoiceStatus', ['PENDING', 'DP', 'PAYMENT']);
export const UserRole = mysqlEnum('user_role', ['ADMINISTRATOR', 'PIMPINAN', 'STAFFADMIN', 'OB']);
export const FinanceRecordType = mysqlEnum('financerecord_type', ['INCOME', 'EXPENSE']);

// Badan Hukum table
export const badanHukum = mysqlTable('badan_hukum', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  trackingCode: varchar('trackingCode', { length: 255 }).notNull().unique(),
  clientId: varchar('clientId', { length: 255 }).notNull(),
  staffId: varchar('staffId', { length: 255 }),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  companyName: varchar('companyName', { length: 255 }),
  status: mysqlEnum('status', ['PENDING', 'PROSES', 'REVISI', 'REVISI_PROSES', 'VERIFIKASI', 'SELESAI', 'CANCELLED']).default('PENDING').notNull(),
  priority: mysqlEnum('priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM').notNull(),
  deadline: datetime('deadline', { mode: 'date' }),
  saksi: varchar('saksi', { length: 255 }),
  notes: text('notes'),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date' }).default(sql`now()`).$onUpdate(() => sql`now()`).notNull(),
  invoiceStatus: mysqlEnum('invoiceStatus', ['PENDING', 'DP', 'PAYMENT']).default('PENDING').notNull(),
}, (table) => ({
  clientIdx: index('badan_hukum_clientId_fkey').on(table.clientId),
  staffIdx: index('badan_hukum_staffId_fkey').on(table.staffId),
}));

// Non Badan Hukum table
export const nonBadanHukum = mysqlTable('non_badan_hukum', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  trackingCode: varchar('trackingCode', { length: 255 }).notNull().unique(),
  clientId: varchar('clientId', { length: 255 }).notNull(),
  staffId: varchar('staffId', { length: 255 }),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  companyName: varchar('companyName', { length: 255 }),
  status: mysqlEnum('status', ['PENDING', 'PROSES', 'REVISI', 'REVISI_PROSES', 'VERIFIKASI', 'SELESAI', 'CANCELLED']).default('PENDING').notNull(),
  priority: mysqlEnum('priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM').notNull(),
  deadline: datetime('deadline', { mode: 'date' }),
  saksi: varchar('saksi', { length: 255 }),
  notes: text('notes'),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date' }).default(sql`now()`).$onUpdate(() => sql`now()`).notNull(),
  invoiceStatus: mysqlEnum('invoiceStatus', ['PENDING', 'DP', 'PAYMENT']).default('PENDING').notNull(),
}, (table) => ({
  clientIdx: index('non_badan_hukum_clientId_fkey').on(table.clientId),
  staffIdx: index('non_badan_hukum_staffId_fkey').on(table.staffId),
}));

// PPAT table
export const ppat = mysqlTable('ppat', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  trackingCode: varchar('trackingCode', { length: 255 }).notNull().unique(),
  clientId: varchar('clientId', { length: 255 }).notNull(),
  staffId: varchar('staffId', { length: 255 }),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  companyName: varchar('companyName', { length: 255 }),
  status: mysqlEnum('status', ['PENDING', 'PROSES', 'REVISI', 'REVISI_PROSES', 'VERIFIKASI', 'SELESAI', 'CANCELLED']).default('PENDING').notNull(),
  priority: mysqlEnum('priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM').notNull(),
  deadline: datetime('deadline', { mode: 'date' }),
  saksi: varchar('saksi', { length: 255 }),
  notes: text('notes'),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date' }).default(sql`now()`).$onUpdate(() => sql`now()`).notNull(),
  invoiceStatus: mysqlEnum('invoiceStatus', ['PENDING', 'DP', 'PAYMENT']).default('PENDING').notNull(),
}, (table) => ({
  clientIdx: index('ppat_clientId_fkey').on(table.clientId),
  staffIdx: index('ppat_staffId_fkey').on(table.staffId),
}));

// Activity Log table
export const activitylog = mysqlTable('activitylog', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  userId: varchar('userId', { length: 255 }),
  activity: varchar('activity', { length: 255 }).notNull(),
  details: text('details'),
  ipAddress: varchar('ipAddress', { length: 255 }),
  device: varchar('device', { length: 255 }),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
}, (table) => ({
  userIdx: index('ActivityLog_userId_fkey').on(table.userId),
}));

// Attachment table
export const attachment = mysqlTable('attachment', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  userId: varchar('userId', { length: 255 }).notNull(),
  fileName: varchar('fileName', { length: 255 }).notNull(),
  filePath: varchar('filePath', { length: 255 }).notNull(),
  fileType: varchar('fileType', { length: 255 }).notNull(),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  badanHukumId: varchar('badanHukumId', { length: 255 }),
  nonBadanHukumId: varchar('nonBadanHukumId', { length: 255 }),
  ppatId: varchar('ppatId', { length: 255 }),
  description: varchar('description', { length: 255 }),
}, (table) => ({
  badanHukumIdx: index('Attachment_badanHukumId_fkey').on(table.badanHukumId),
  nonBadanHukumIdx: index('Attachment_nonBadanHukumId_fkey').on(table.nonBadanHukumId),
  ppatIdx: index('Attachment_ppatId_fkey').on(table.ppatId),
  userIdx: index('Attachment_userId_fkey').on(table.userId),
}));

// Client table
export const client = mysqlTable('client', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  indexNo: int('indexNo').notNull().unique().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 255 }),
  address: text('address'),
  country: varchar('country', { length: 255 }),
  province: varchar('province', { length: 255 }),
  city: varchar('city', { length: 255 }),
  district: varchar('district', { length: 255 }),
  village: varchar('village', { length: 255 }),
  type: varchar('type', { length: 255 }).default('individual'),
  gender: varchar('gender', { length: 255 }),
  citizenship: varchar('citizenship', { length: 255 }),
  picName: varchar('picName', { length: 255 }),
  npwp: varchar('npwp', { length: 255 }),
  birthday: datetime('birthday', { mode: 'date' }),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date' }).default(sql`now()`).$onUpdate(() => sql`now()`).notNull(),
});

// Expense table
export const expense = mysqlTable('expense', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  category: varchar('category', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  expenseDate: datetime('expenseDate', { mode: 'date' }).default(sql`now()`).notNull(),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
});

// Founder table
export const founder = mysqlTable('founder', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }),
  email: varchar('email', { length: 255 }),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  badanHukumId: varchar('badanHukumId', { length: 255 }),
  nonBadanHukumId: varchar('nonBadanHukumId', { length: 255 }),
  ppatId: varchar('ppatId', { length: 255 }),
}, (table) => ({
  badanHukumIdx: index('Founder_badanHukumId_fkey').on(table.badanHukumId),
  nonBadanHukumIdx: index('Founder_nonBadanHukumId_fkey').on(table.nonBadanHukumId),
  ppatIdx: index('Founder_ppatId_fkey').on(table.ppatId),
}));

// Job Progress table
export const jobprogress = mysqlTable('jobprogress', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  userId: varchar('userId', { length: 255 }).notNull(),
  statusBefore: mysqlEnum('statusBefore', ['PENDING', 'PROSES', 'REVISI', 'REVISI_PROSES', 'VERIFIKASI', 'SELESAI', 'CANCELLED']).notNull(),
  statusAfter: mysqlEnum('statusAfter', ['PENDING', 'PROSES', 'REVISI', 'REVISI_PROSES', 'VERIFIKASI', 'SELESAI', 'CANCELLED']).notNull(),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  badanHukumId: varchar('badanHukumId', { length: 255 }),
  description: text('description'),
  nonBadanHukumId: varchar('nonBadanHukumId', { length: 255 }),
  ppatId: varchar('ppatId', { length: 255 }),
}, (table) => ({
  badanHukumIdx: index('JobProgress_badanHukumId_fkey').on(table.badanHukumId),
  nonBadanHukumIdx: index('JobProgress_nonBadanHukumId_fkey').on(table.nonBadanHukumId),
  ppatIdx: index('JobProgress_ppatId_fkey').on(table.ppatId),
  userIdx: index('JobProgress_userId_fkey').on(table.userId),
}));

// Notification table
export const notification = mysqlTable('notification', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  userId: varchar('userId', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 255 }).default('INFO'),
  isRead: boolean('isRead').default(false).notNull(),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
}, (table) => ({
  userIdx: index('Notification_userId_fkey').on(table.userId),
}));

// Reminder table
export const reminder = mysqlTable('reminder', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  userId: varchar('userId', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  remindAt: datetime('remindAt', { mode: 'date' }).notNull(),
  isRead: boolean('isRead').default(false).notNull(),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
}, (table) => ({
  userIdx: index('Reminder_userId_fkey').on(table.userId),
}));

// User table
export const user = mysqlTable('user', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 255 }).unique(),
  passwordHash: varchar('passwordHash', { length: 255 }).notNull(),
  fullName: varchar('fullName', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['ADMINISTRATOR', 'PIMPINAN', 'STAFFADMIN', 'OB']).default('STAFFADMIN').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date' }).default(sql`now()`).$onUpdate(() => sql`now()`).notNull(),
  birthday: datetime('birthday', { mode: 'date' }),
}, (table) => ({
  usernameIdx: uniqueIndex('User_username_key').on(table.username),
  emailIdx: uniqueIndex('User_email_key').on(table.email),
  phoneIdx: uniqueIndex('User_phone_key').on(table.phone),
}));

// Staff table
export const staff = mysqlTable('staff', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  userId: varchar('userId', { length: 255 }).notNull().unique(),
  ktpPath: text('ktpPath'),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date' }).default(sql`now()`).$onUpdate(() => sql`now()`).notNull(),
  photoPath: text('photoPath'),
}, (table) => ({
  userIdx: uniqueIndex('staff_userId_key').on(table.userId),
}));

// Attendance table
export const attendance = mysqlTable('attendance', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  staffId: varchar('staffId', { length: 255 }).notNull(),
  date: datetime('date', { mode: 'date' }).default(sql`now()`).notNull(),
  checkIn: datetime('checkIn', { mode: 'date' }),
  checkOut: datetime('checkOut', { mode: 'date' }),
  status: varchar('status', { length: 255 }).default('Hadir'),
  notes: text('notes'),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date' }).default(sql`now()`).$onUpdate(() => sql`now()`).notNull(),
}, (table) => ({
  staffIdx: index('attendance_staffId_fkey').on(table.staffId),
  dateIdx: index('attendance_date_idx').on(table.date),
}));

// Invoice table
export const invoice = mysqlTable('invoice', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  invoiceNumber: varchar('invoiceNumber', { length: 255 }).notNull().unique(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 255 }).default('Belum Bayar'),
  description: text('description'),
  dueDate: datetime('dueDate', { mode: 'date' }),
  date: datetime('date', { mode: 'date' }).default(sql`now()`).notNull(),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date' }).default(sql`now()`).$onUpdate(() => sql`now()`).notNull(),
  badanHukumId: varchar('badanHukumId', { length: 255 }),
  nonBadanHukumId: varchar('nonBadanHukumId', { length: 255 }),
  ppatId: varchar('ppatId', { length: 255 }),
}, (table) => ({
  badanHukumIdx: index('invoice_badanHukumId_fkey').on(table.badanHukumId),
  nonBadanHukumIdx: index('invoice_nonBadanHukumId_fkey').on(table.nonBadanHukumId),
  ppatIdx: index('invoice_ppatId_fkey').on(table.ppatId),
}));

// Finance Record table
export const financerecord = mysqlTable('financerecord', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => sql`cuid()`),
  badanHukumId: varchar('badanHukumId', { length: 255 }),
  nonBadanHukumId: varchar('nonBadanHukumId', { length: 255 }),
  ppatId: varchar('ppatId', { length: 255 }),
  invoiceId: varchar('invoiceId', { length: 255 }),
  type: mysqlEnum('type', ['INCOME', 'EXPENSE']).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  date: datetime('date', { mode: 'date' }).default(sql`now()`).notNull(),
  createdAt: datetime('createdAt', { mode: 'date' }).default(sql`now()`).notNull(),
}, (table) => ({
  badanHukumIdx: index('FinanceRecord_badanHukumId_fkey').on(table.badanHukumId),
  nonBadanHukumIdx: index('FinanceRecord_nonBadanHukumId_fkey').on(table.nonBadanHukumId),
  ppatIdx: index('FinanceRecord_ppatId_fkey').on(table.ppatId),
  invoiceIdx: index('financerecord_invoiceId_fkey').on(table.invoiceId),
}));

// Sequence table
export const sequence = mysqlTable('sequence', {
  id: varchar('id', { length: 255 }).primaryKey(),
  category: varchar('category', { length: 255 }).notNull(),
  year: int('year').notNull(),
  lastNum: int('lastNum').default(0).notNull(),
  updatedAt: datetime('updatedAt', { mode: 'date' }).default(sql`now()`).$onUpdate(() => sql`now()`).notNull(),
}, (table) => ({
  categoryYearIdx: uniqueIndex('Sequence_category_year_key').on(table.category, table.year),
}));

// Types
export type BadanHukum = typeof badanHukum.$inferSelect;
export type NewBadanHukum = typeof badanHukum.$inferInsert;
export type NonBadanHukum = typeof nonBadanHukum.$inferSelect;
export type NewNonBadanHukum = typeof nonBadanHukum.$inferInsert;
export type Ppat = typeof ppat.$inferSelect;
export type NewPpat = typeof ppat.$inferInsert;
export type Client = typeof client.$inferSelect;
export type NewClient = typeof client.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
export type Invoice = typeof invoice.$inferSelect;
export type NewInvoice = typeof invoice.$inferInsert;
export type FinanceRecord = typeof financerecord.$inferSelect;
export type NewFinanceRecord = typeof financerecord.$inferInsert;
export type Founder = typeof founder.$inferSelect;
export type NewFounder = typeof founder.$inferInsert;
export type Attachment = typeof attachment.$inferSelect;
export type NewAttachment = typeof attachment.$inferInsert;
export type JobProgress = typeof jobprogress.$inferSelect;
export type NewJobProgress = typeof jobprogress.$inferInsert;
export type ActivityLog = typeof activitylog.$inferSelect;
export type NewActivityLog = typeof activitylog.$inferInsert;
export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;
export type Reminder = typeof reminder.$inferSelect;
export type NewReminder = typeof reminder.$inferInsert;
export type Expense = typeof expense.$inferSelect;
export type NewExpense = typeof expense.$inferInsert;
export type Sequence = typeof sequence.$inferSelect;
export type NewSequence = typeof sequence.$inferInsert;

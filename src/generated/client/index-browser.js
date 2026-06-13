
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.2.1
 * Query Engine version: 4123509d24aa4dede1e864b46351bf2790323b69
 */
Prisma.prismaVersion = {
  client: "6.2.1",
  engine: "4123509d24aa4dede1e864b46351bf2790323b69"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.BadanHukumScalarFieldEnum = {
  id: 'id',
  trackingCode: 'trackingCode',
  clientId: 'clientId',
  staffId: 'staffId',
  title: 'title',
  type: 'type',
  companyName: 'companyName',
  status: 'status',
  priority: 'priority',
  deadline: 'deadline',
  saksi: 'saksi',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  invoiceStatus: 'invoiceStatus'
};

exports.Prisma.NonBadanHukumScalarFieldEnum = {
  id: 'id',
  trackingCode: 'trackingCode',
  clientId: 'clientId',
  staffId: 'staffId',
  title: 'title',
  type: 'type',
  companyName: 'companyName',
  status: 'status',
  priority: 'priority',
  deadline: 'deadline',
  saksi: 'saksi',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  invoiceStatus: 'invoiceStatus'
};

exports.Prisma.PpatScalarFieldEnum = {
  id: 'id',
  trackingCode: 'trackingCode',
  clientId: 'clientId',
  staffId: 'staffId',
  title: 'title',
  type: 'type',
  companyName: 'companyName',
  status: 'status',
  priority: 'priority',
  deadline: 'deadline',
  saksi: 'saksi',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  invoiceStatus: 'invoiceStatus'
};

exports.Prisma.ActivitylogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  activity: 'activity',
  details: 'details',
  ipAddress: 'ipAddress',
  device: 'device',
  createdAt: 'createdAt'
};

exports.Prisma.AttachmentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  fileName: 'fileName',
  filePath: 'filePath',
  fileType: 'fileType',
  createdAt: 'createdAt',
  badanHukumId: 'badanHukumId',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId',
  description: 'description'
};

exports.Prisma.ClientScalarFieldEnum = {
  id: 'id',
  indexNo: 'indexNo',
  name: 'name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  country: 'country',
  province: 'province',
  city: 'city',
  district: 'district',
  village: 'village',
  type: 'type',
  gender: 'gender',
  citizenship: 'citizenship',
  picName: 'picName',
  npwp: 'npwp',
  birthday: 'birthday',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  category: 'category',
  amount: 'amount',
  description: 'description',
  expenseDate: 'expenseDate',
  createdAt: 'createdAt'
};

exports.Prisma.FounderScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  createdAt: 'createdAt',
  badanHukumId: 'badanHukumId',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId'
};

exports.Prisma.JobprogressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  statusBefore: 'statusBefore',
  statusAfter: 'statusAfter',
  createdAt: 'createdAt',
  badanHukumId: 'badanHukumId',
  description: 'description',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.ReminderScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  description: 'description',
  remindAt: 'remindAt',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  email: 'email',
  phone: 'phone',
  passwordHash: 'passwordHash',
  fullName: 'fullName',
  role: 'role',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  birthday: 'birthday'
};

exports.Prisma.StaffScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  ktpPath: 'ktpPath',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  photoPath: 'photoPath'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  invoiceNumber: 'invoiceNumber',
  amount: 'amount',
  status: 'status',
  description: 'description',
  dueDate: 'dueDate',
  date: 'date',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  badanHukumId: 'badanHukumId',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId'
};

exports.Prisma.FinancerecordScalarFieldEnum = {
  id: 'id',
  badanHukumId: 'badanHukumId',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId',
  invoiceId: 'invoiceId',
  type: 'type',
  amount: 'amount',
  description: 'description',
  date: 'date',
  createdAt: 'createdAt'
};

exports.Prisma.SequenceScalarFieldEnum = {
  id: 'id',
  category: 'category',
  year: 'year',
  lastNum: 'lastNum',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.BadanHukumOrderByRelevanceFieldEnum = {
  id: 'id',
  trackingCode: 'trackingCode',
  clientId: 'clientId',
  staffId: 'staffId',
  title: 'title',
  type: 'type',
  companyName: 'companyName',
  saksi: 'saksi',
  notes: 'notes'
};

exports.Prisma.NonBadanHukumOrderByRelevanceFieldEnum = {
  id: 'id',
  trackingCode: 'trackingCode',
  clientId: 'clientId',
  staffId: 'staffId',
  title: 'title',
  type: 'type',
  companyName: 'companyName',
  saksi: 'saksi',
  notes: 'notes'
};

exports.Prisma.PpatOrderByRelevanceFieldEnum = {
  id: 'id',
  trackingCode: 'trackingCode',
  clientId: 'clientId',
  staffId: 'staffId',
  title: 'title',
  type: 'type',
  companyName: 'companyName',
  saksi: 'saksi',
  notes: 'notes'
};

exports.Prisma.activitylogOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  activity: 'activity',
  details: 'details',
  ipAddress: 'ipAddress',
  device: 'device'
};

exports.Prisma.attachmentOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  fileName: 'fileName',
  filePath: 'filePath',
  fileType: 'fileType',
  badanHukumId: 'badanHukumId',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId',
  description: 'description'
};

exports.Prisma.clientOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  country: 'country',
  province: 'province',
  city: 'city',
  district: 'district',
  village: 'village',
  type: 'type',
  gender: 'gender',
  citizenship: 'citizenship',
  picName: 'picName',
  npwp: 'npwp'
};

exports.Prisma.expenseOrderByRelevanceFieldEnum = {
  id: 'id',
  category: 'category',
  description: 'description'
};

exports.Prisma.founderOrderByRelevanceFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  badanHukumId: 'badanHukumId',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId'
};

exports.Prisma.jobprogressOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  badanHukumId: 'badanHukumId',
  description: 'description',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId'
};

exports.Prisma.notificationOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type'
};

exports.Prisma.reminderOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  description: 'description'
};

exports.Prisma.userOrderByRelevanceFieldEnum = {
  id: 'id',
  username: 'username',
  email: 'email',
  phone: 'phone',
  passwordHash: 'passwordHash',
  fullName: 'fullName'
};

exports.Prisma.staffOrderByRelevanceFieldEnum = {
  id: 'id',
  userId: 'userId',
  ktpPath: 'ktpPath',
  photoPath: 'photoPath'
};

exports.Prisma.invoiceOrderByRelevanceFieldEnum = {
  id: 'id',
  invoiceNumber: 'invoiceNumber',
  status: 'status',
  description: 'description',
  badanHukumId: 'badanHukumId',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId'
};

exports.Prisma.financerecordOrderByRelevanceFieldEnum = {
  id: 'id',
  badanHukumId: 'badanHukumId',
  nonBadanHukumId: 'nonBadanHukumId',
  ppatId: 'ppatId',
  invoiceId: 'invoiceId',
  description: 'description'
};

exports.Prisma.sequenceOrderByRelevanceFieldEnum = {
  id: 'id',
  category: 'category'
};
exports.JobStatus = exports.$Enums.JobStatus = {
  PENDING: 'PENDING',
  PROSES: 'PROSES',
  REVISI: 'REVISI',
  REVISI_PROSES: 'REVISI_PROSES',
  VERIFIKASI: 'VERIFIKASI',
  SELESAI: 'SELESAI',
  CANCELLED: 'CANCELLED'
};

exports.JobPriority = exports.$Enums.JobPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.InvoiceStatus = exports.$Enums.InvoiceStatus = {
  PENDING: 'PENDING',
  DP: 'DP',
  PAYMENT: 'PAYMENT'
};

exports.jobprogress_statusBefore = exports.$Enums.jobprogress_statusBefore = {
  PENDING: 'PENDING',
  PROSES: 'PROSES',
  REVISI: 'REVISI',
  REVISI_PROSES: 'REVISI_PROSES',
  VERIFIKASI: 'VERIFIKASI',
  SELESAI: 'SELESAI',
  CANCELLED: 'CANCELLED'
};

exports.jobprogress_statusAfter = exports.$Enums.jobprogress_statusAfter = {
  PENDING: 'PENDING',
  PROSES: 'PROSES',
  REVISI: 'REVISI',
  REVISI_PROSES: 'REVISI_PROSES',
  VERIFIKASI: 'VERIFIKASI',
  SELESAI: 'SELESAI',
  CANCELLED: 'CANCELLED'
};

exports.user_role = exports.$Enums.user_role = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  PIMPINAN: 'PIMPINAN',
  STAFFADMIN: 'STAFFADMIN',
  OB: 'OB'
};

exports.financerecord_type = exports.$Enums.financerecord_type = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE'
};

exports.Prisma.ModelName = {
  BadanHukum: 'BadanHukum',
  NonBadanHukum: 'NonBadanHukum',
  Ppat: 'Ppat',
  activitylog: 'activitylog',
  attachment: 'attachment',
  client: 'client',
  expense: 'expense',
  founder: 'founder',
  jobprogress: 'jobprogress',
  notification: 'notification',
  reminder: 'reminder',
  user: 'user',
  staff: 'staff',
  invoice: 'invoice',
  financerecord: 'financerecord',
  sequence: 'sequence'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)

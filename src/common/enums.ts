export enum Role {
  ADMIN = 'admin',
  ACCOUNTS_MANAGER = 'accounts_manager',
  PURCHASE_TEAM = 'purchase_team',
  SITE_ENGINEER = 'site_engineer',
  OFFICE_STAFF = 'office_staff',
  VIEWER = 'viewer',
}

export enum OfficeStaffType {
  ARCHITECT = 'Architect',
  PROJECT_COORDINATOR = 'Project Coordinator',
  ENGINEER = 'Engineer',
  RESEARCH_ASSOCIATE = 'Research Associate',
}

export enum WorkOrderStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
}

export enum SubcontractWorkOrderStatus {
  PENDING = 'pending',
  ADMIN_APPROVED = 'admin_approved',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PENDING = 'pending',
  ADMIN_APPROVED = 'admin_approved',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum BillStatus {
  PENDING = 'pending',
  ADMIN_APPROVED = 'admin_approved',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PaymentMode {
  CASH = 'cash',
  UPI = 'upi',
  RTGS = 'rtgs',
  CHEQUE = 'cheque',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
}

export enum SnagStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum RfiStatus {
  OPEN = 'open',
  RESPONDED = 'responded',
  CLOSED = 'closed',
}

export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum DrawingCategory {
  STRUCTURAL = 'structural',
  AS_BUILT = 'as_built',
  GENERAL_ARRANGEMENT = 'general_arrangement',
  ARCHITECTURAL = 'architectural',
  HVAC = 'hvac',
  MEP = 'mep',
}

export enum ExpenseCategory {
  STAFF = 'staff',
  OFFICE = 'office',
  TRANSPORT = 'transport',
  TRAVEL = 'travel',
}

export enum MaterialReceivedStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  ADMIN_APPROVED = 'admin_approved',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PaymentType {
  MATERIAL = 'material',
  LABOUR = 'labour',
  RENT = 'rent',
  ACCOMMODATION = 'accommodation',
  OFFICE_MAINTENANCE = 'office_maintenance',
  STAFF_EXPENSE = 'staff_expense',
  TRAVEL = 'travel',
  TRANSPORT = 'transport',
  REVENUE = 'revenue',
}

export enum AdvanceEntityType {
  VENDOR = 'vendor',
  CUSTOMER = 'customer',
  EMPLOYEE = 'employee',
}

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
}

export enum ProjectNature {
  BROWNFIELD = 'brownfield',
  GREENFIELD = 'greenfield',
}

export enum JobType {
  CONTRACTING = 'contracting',
  DESIGN_BUILD = 'design_build',
  DESIGN = 'design',
}

export enum JobStatus {
  BIDDING = 'bidding',
  AWARDED = 'awarded',
}

export enum WorkCategory {
  CIVIL = 'civil',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  PAINTING = 'painting',
  HVAC = 'hvac',
  FIRE_FIGHTING = 'fire_fighting',
  INTERIOR = 'interior',
  LANDSCAPING = 'landscaping',
  OTHER = 'other',
}

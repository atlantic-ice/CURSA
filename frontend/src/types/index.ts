/**
 * Type definitions for CURSA Frontend
 * Comprehensive TypeScript interfaces for all major systems
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  created_at: string;
  last_login_at?: string;
  subscription?: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    expires_at?: string;
  };
  settings?: UserSettings;
}

export type UserRole = "guest" | "user" | "pro" | "team" | "enterprise" | "admin";

export type SubscriptionPlan = "free" | "pro" | "team" | "enterprise";

export type SubscriptionStatus = "active" | "expired" | "canceled" | "pending";

export interface UserSettings {
  theme: "light" | "dark" | "system";
  language: "ru" | "en";
  notifications_email: boolean;
  notifications_push: boolean;
  default_profile?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (userPatch: Partial<User>) => void;
}

export interface ColorModeContextType {
  toggleColorMode: () => void;
}

// ============================================================================
// Document Types
// ============================================================================

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  profile_id: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  validation_result?: ValidationResult;
  download_url?: string;
  corrected_download_url?: string;
}

export type DocumentStatus =
  | "uploading"
  | "analyzing"
  | "validating"
  | "correcting"
  | "completed"
  | "error";

export interface DocumentContextType {
  currentDocument: Document | null;
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  uploadDocument: (file: File, profileId: string) => Promise<string>;
  fetchDocument: (id: string) => Promise<Document>;
  fetchDocuments: () => Promise<Document[]>;
  deleteDocument: (id: string) => Promise<void>;
}

// ============================================================================
// Validation & Check Types
// ============================================================================

export interface ValidationResult {
  document_id: string;
  status: ValidationStatus;
  summary: ValidationSummary;
  issues: ValidationIssue[];
  issues_by_severity: IssuesBySeverity;
  recommendations: string[];
  completion_percentage: number;
  metadata: ValidationMetadata;
}

export type ValidationStatus = "passed" | "warning" | "failed" | "critical";

export interface ValidationSummary {
  total_issues: number;
  critical_issues: number;
  error_issues: number;
  warning_issues: number;
  info_issues: number;
  autocorrectable: number;
  issues_by_category: Record<string, number>;
  completion_time_ms: number;
}

export interface ValidationIssue {
  id: string;
  rule_id: number;
  rule_name: string;
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
  location?: string;
  line_number?: number;
  page_number?: number;
  expected?: string;
  actual?: string;
  suggestion?: string;
  can_autocorrect: boolean;
  autocorrect_status?: AutocorrectStatus;
}

export type IssueCategory =
  | "font"
  | "margins"
  | "spacing"
  | "pagination"
  | "headings"
  | "structure"
  | "bibliography"
  | "tables"
  | "images"
  | "formulas"
  | "typography"
  | "formatting"
  | "other";

export type IssueSeverity = "critical" | "error" | "warning" | "info";

export type AutocorrectStatus = "pending" | "applied" | "failed" | "skipped";

export interface BackendCheckIssue extends Partial<Omit<ValidationIssue, "severity">> {
  severity?: string;
  auto_fixable?: boolean;
  type?: string;
}

export interface IssuesBySeverity {
  critical: ValidationIssue[];
  error: ValidationIssue[];
  warning: ValidationIssue[];
  info: ValidationIssue[];
}

export interface ValidationMetadata {
  validators_executed: string[];
  total_validators: number;
  skipped_validators: string[];
  external_tools_used: string[];
}

// ============================================================================
// Profile / Template Types
// ============================================================================

export interface ValidationProfile {
  id: string;
  name: string;
  version: string;
  university?: string;
  description?: string;
  rules: ProfileRules;
  is_custom: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProfileRules {
  font?: FontRules;
  margins?: MarginRules;
  spacing?: SpacingRules;
  pagination?: PaginationRules;
  headings?: HeadingRules;
  bibliography?: BibliographyRules;
  tables?: TableRules;
  images?: ImageRules;
  formulas?: FormulaRules;
  [key: string]: any;
}

export interface FontRules {
  name: string;
  size: number;
  allowed_fonts?: string[];
  color?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface MarginRules {
  left: number; // in cm
  right: number;
  top: number;
  bottom: number;
  tolerance?: number; // cm
}

export interface SpacingRules {
  line_spacing: number; // e.g., 1.5
  paragraph_indent: number; // in cm
  paragraph_spacing_before?: number;
  paragraph_spacing_after?: number;
  table_line_spacing?: number;
}

export interface PaginationRules {
  position:
    | "top_left"
    | "top_center"
    | "top_right"
    | "bottom_left"
    | "bottom_center"
    | "bottom_right";
  start_page: number;
  font_size: number;
  font_name?: string;
}

export interface HeadingRules {
  chapter_case: "upper" | "lower" | "title" | "sentence";
  chapter_bold: boolean;
  chapter_alignment: "left" | "center" | "right" | "justify";
  subsection_case: "upper" | "lower" | "title" | "sentence";
  subsection_bold: boolean;
  new_page_for_chapter: boolean;
  max_depth: number;
}

export interface BibliographyRules {
  min_sources: number;
  bracket_style: "square" | "round" | "curly";
  order: "alphabetical" | "appearance" | "custom";
  russian_first: boolean;
  format_standard: string; // 'GOST 7.1-2003', etc.
}

export interface TableRules {
  caption_format: string;
  numbering: "continuous" | "per_chapter";
  numbered_rows: boolean;
  caption_alignment: "left" | "center";
  continuation_text?: string;
}

export interface ImageRules {
  caption_format: string;
  numbering: "continuous" | "per_chapter";
  caption_alignment: "left" | "center" | "right";
  min_width: number; // pixels
  max_width: number;
}

export interface FormulaRules {
  numbering: "continuous" | "per_chapter";
  position: "center" | "left" | "right";
  bracket_style: "round" | "square";
  notation_required: boolean;
}

export interface ProfileContextType {
  profiles: ValidationProfile[];
  currentProfile: ValidationProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<ValidationProfile[]>;
  fetchProfile: (id: string) => Promise<ValidationProfile>;
  createProfile: (
    profile: Omit<ValidationProfile, "id" | "created_at">,
  ) => Promise<ValidationProfile>;
  updateProfile: (id: string, updates: Partial<ValidationProfile>) => Promise<ValidationProfile>;
  deleteProfile: (id: string) => Promise<void>;
  setCurrentProfile: (id: string) => void;
}

// ============================================================================
// Report Types
// ============================================================================

export interface ValidationReport {
  id: string;
  document_id: string;
  document_name: string;
  profile_id: string;
  profile_name: string;
  created_at: string;
  validation_result: ValidationResult;
  corrections_applied?: {
    count: number;
    by_category: Record<string, number>;
  };
  download_links: {
    pdf?: string;
    html?: string;
    json?: string;
  };
  // Backend compatibility fields
  issues?: ValidationIssue[];
  document_token?: string;
  original_preview_path?: string;
  corrected_document_url?: string;
  corrected_file_path?: string;
  temp_path?: string;
  success?: boolean;
  filename?: string;
  check_results?: {
    score?: number;
    total_issues_count?: number;
    issues?: BackendCheckIssue[];
    profile?: {
      id?: string;
      name?: string;
    };
  };
  report?: {
    passes_completed?: number;
    total_issues_found?: number;
    total_issues_fixed?: number;
    remaining_issues?: number;
    success_rate?: number;
    duration_seconds?: number;
    actions_by_phase?: Record<string, number>;
    actions_by_type?: Record<string, number>;
    verification_results?: Record<string, { passed?: boolean; message?: string }>;
  };
  improvement?: {
    before_total_issues?: number;
    after_total_issues?: number;
    resolved_total_issues?: number;
    before_font_issues?: number;
    after_font_issues?: number;
    resolved_font_issues?: number;
  };
  correction_success?: boolean;
  score?: number;
}

export interface ReportContextType {
  currentReport: ValidationReport | null;
  reports: ValidationReport[];
  isLoading: boolean;
  fetchReport: (id: string) => Promise<ValidationReport>;
  fetchReports: (limit?: number, offset?: number) => Promise<ValidationReport[]>;
  generateReport: (documentId: string) => Promise<ValidationReport>;
  downloadReport: (id: string, format: "pdf" | "html" | "json") => Promise<Blob>;
}

// ============================================================================
// Check History Types
// ============================================================================

export interface CheckHistoryEntry {
  id: string;
  document_id: string;
  document_name: string;
  profile_id: string;
  profile_name: string;
  timestamp: string | number;
  issues_count: number;
  critical_count: number;
  status: ValidationStatus;
  processing_time_ms: number;
  score?: number;
  validation_result?: ValidationResult;
  corrected_file_path?: string;
  reportData?: ValidationReport;
  fileName?: string;
  profileId?: string;
  profileName?: string;
  totalIssues?: number;
  correctedFilePath?: string;
}

// Type aliases for backward compatibility
export type HistoryItem = CheckHistoryEntry;
export type LocationState = {
  reportData?: ValidationReport;
  fileName?: string;
  profileId?: string;
  profileName?: string;
};

export interface CheckHistoryContextType {
  history: CheckHistoryEntry[];
  addToHistory: (entry: Omit<CheckHistoryEntry, "id" | "timestamp">) => void;
  removeFromHistory: (id: string | number) => void;
  clearHistory: () => void;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface UIState {
  isDarkMode: boolean;
  showMobileMenu: boolean;
  activeTab: string;
  selectedIssueId?: string;
  filterSeverity?: IssueSeverity | null;
  filterCategory?: IssueCategory | null;
  searchQuery: string;
}

export interface UIContextType extends UIState {
  setDarkMode: (isDark: boolean) => void;
  setShowMobileMenu: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  selectIssue: (id: string | undefined) => void;
  setFilterSeverity: (severity: IssueSeverity | null) => void;
  setFilterCategory: (category: IssueCategory | null) => void;
  setSearchQuery: (query: string) => void;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status_code: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// Upload Types
// ============================================================================

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: UploadStatus;
  documentId?: string;
  error?: string;
}

export type UploadStatus = "pending" | "uploading" | "processing" | "completed" | "error";

export interface UploadContextType {
  progress: UploadProgress | null;
  isUploading: boolean;
  uploadFile: (file: File, profileId: string) => Promise<string>;
  cancelUpload: () => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface PageProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  disabled?: boolean;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
    unit?: string;
  };
  onClick?: () => void;
  loading?: boolean;
}

export interface IssueCardProps {
  issue: ValidationIssue;
  isSelected: boolean;
  onSelect: (issue: ValidationIssue) => void;
  onAutoFix?: (issueId: string) => Promise<void>;
  isFixing?: boolean;
}

// ============================================================================
// WebSocket Types
// ============================================================================

export type WebSocketEventType =
  | "validation_progress"
  | "validation_complete"
  | "correction_progress"
  | "correction_complete"
  | "error"
  | "notification";

export interface WebSocketMessage<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
  id?: string;
}

export interface ValidationProgressPayload {
  document_id: string;
  stage: string;
  progress: number;
  issues_found: number;
  estimated_time_remaining_sec?: number;
}

export interface NotificationPayload {
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
}

// ============================================================================
// Helper Types
// ============================================================================

export type Optional<T> = T | undefined | null;

export type Nullable<T> = T | null;

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

export interface FilterOptions {
  severity?: IssueSeverity[];
  category?: IssueCategory[];
  searchQuery?: string;
  autocorrectable?: boolean;
}

// ============================================================================
// Form Types
// ============================================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData extends LoginFormData {
  name: string;
  passwordConfirm: string;
}

export interface ProfileFormData extends Omit<
  ValidationProfile,
  "id" | "created_at" | "updated_at"
> {}

// ============================================================================
// AsyncThunk Action Types (for Redux/Zustand)
// ============================================================================

export interface AsyncState<T> {
  data: Optional<T>;
  isLoading: boolean;
  error: Optional<string>;
}

export type AsyncAction<T> = {
  pending: () => void;
  fulfilled: (data: T) => void;
  rejected: (error: string) => void;
};

// ============================================================================
// Custom Hooks Return Types
// ============================================================================

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => (e: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  reset: () => void;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((val: T) => T)) => void;
  removeValue: () => void;
}

export interface UseFetchReturn<T> {
  data: Optional<T>;
  isLoading: boolean;
  error: Optional<string>;
  refetch: () => Promise<void>;
}

/**
 * Frappe API Client for Kairos Mobile App
 *
 * This module provides the Frappe client configuration and type definitions
 * for all DocTypes used in the Kairos school-parent communication platform.
 *
 * Uses frappe-js-sdk with TanStack Query for caching (not frappe-react-sdk
 * which uses SWR, to maintain compatibility with existing query infrastructure).
 */
import { FrappeApp } from 'frappe-js-sdk';
import { Platform } from 'react-native';
import * as Storage from '../utils/storage';
import {
  API_CONFIG,
  isValidApiUrl,
  createSecureHeaders,
  logSecurityEvent,
} from '../config/security';

// Frappe API URL - uses environment variable or fallback for web production builds
const FRAPPE_URL =
  process.env.EXPO_PUBLIC_FRAPPE_URL ||
  (Platform.OS === 'web' ? API_CONFIG.FRAPPE_URL : null);

if (!FRAPPE_URL) {
  throw new Error('EXPO_PUBLIC_FRAPPE_URL environment variable is required');
}

// Security: Enforce HTTPS in production, allow HTTP for localhost in dev
if (!isValidApiUrl(FRAPPE_URL)) {
  logSecurityEvent('invalid_url', { url: FRAPPE_URL, reason: 'Invalid URL for environment' });
  throw new Error('FRAPPE_URL must use HTTPS (or HTTP localhost in development)');
}

export { FRAPPE_URL };

// =============================================================================
// TYPE DEFINITIONS - Matching Frappe DocTypes
// =============================================================================

export interface Institution {
  name: string;
  institution_name: string;
  slug?: string;
  logo?: string;
  primary_color?: string;
  settings?: Record<string, unknown>;
  campuses?: Campus[];
}

export interface Campus {
  name: string;
  institution: string;
  campus_name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  logo?: string;
  primary_color?: string;
  settings?: Record<string, unknown>;
  status: 'Active' | 'Inactive';
  creation?: string;
  modified?: string;
}

export interface Guardian {
  name: string;
  user: string;
  guardian_name: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  relationship?: string;
  status: 'Active' | 'Inactive';
  institution?: string;
}

export interface Grade {
  name: string;
  institution: string;
  grade_name: string;
  level?: 'Initial' | 'Primary' | 'Secondary';
  order?: number;
}

export interface Section {
  name: string;
  institution: string;
  grade: string;
  section_name: string;
  homeroom_teacher?: string;
  school_year?: number;
  capacity?: number;
  grade_details?: Grade;
}

export interface Student {
  name: string;
  /** Alias for name - provided for backward compatibility */
  id: string;
  institution: string;
  student_name: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  current_section?: string;
  current_grade?: string;
  photo?: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Transferred';
  section_details?: Section;
}

export interface StudentGuardian {
  name: string;
  student: string;
  guardian: string;
  relationship: string;
  is_primary: boolean;
  can_pickup: boolean;
}

export interface News {
  name: string;
  institution: string;
  title: string;
  content: string;
  image?: string;
  priority: 'Urgent' | 'Important' | 'Normal';
  scope_type: 'Institution' | 'Campus' | 'Grade' | 'Section';
  campus?: string;
  grade?: string;
  section?: string;
  status: 'Draft' | 'Published' | 'Archived';
  publish_date?: string;
  is_pinned?: boolean;
  requires_acknowledgment?: boolean;
  video_url?: string;
  attachments?: NewsAttachment[];
  owner?: string;
  creation?: string;
}

export interface NewsAttachment {
  name: string;
  news: string;
  file: string;
  title?: string;
  sort?: number;
}

export interface SchoolEvent {
  name: string;
  institution: string;
  title: string;
  description?: string;
  image?: string;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  location?: string;
  location_external?: string;
  requires_confirmation: boolean;
  confirmation_deadline?: string;
  scope_type: 'Institution' | 'Campus' | 'Grade' | 'Section';
  campus?: string;
  grade?: string;
  section?: string;
  status: 'Draft' | 'Published' | 'Cancelled';
  owner?: string;
  creation?: string;
}

export interface EventRSVP {
  name: string;
  event: string;
  guardian: string;
  student?: string;
  response: 'Attending' | 'Not Attending' | 'Maybe';
  notes?: string;
  creation?: string;
}

export interface Message {
  name: string;
  institution: string;
  subject: string;
  content: string;
  message_type: 'Individual' | 'Broadcast';
  priority: 'Normal' | 'Urgent';
  status: 'Draft' | 'Sent' | 'Archived';
  owner?: string;
  creation?: string;
}

export interface MessageRecipient {
  name: string;
  message: string;
  guardian: string;
  student?: string;
  delivered_at?: string;
  read_at?: string;
  creation?: string;
}

export interface Conversation {
  name: string;
  institution: string;
  conversation_type: 'Private' | 'Group';
  subject: string;
  started_by: string;
  channel?: 'Secretaria' | 'Profesores' | 'General' | string;
  status: 'Open' | 'Closed' | 'Archived';
  closed_by?: string;
  closed_at?: string;
  closed_reason?: string;
  creation?: string;
  modified?: string;
  participants?: ConversationParticipant[];
  messages?: ConversationMessage[];
}

export interface ConversationParticipant {
  name: string;
  conversation: string;
  user: string;
  role: 'Teacher' | 'Parent' | 'Admin';
  can_reply: boolean;
  is_blocked: boolean;
  is_muted: boolean;
  last_read_at?: string;
  creation?: string;
  user_details?: FrappeUser;
}

export interface ConversationMessage {
  name: string;
  conversation: string;
  sender: string;
  content: string;
  content_type: 'Text' | 'HTML';
  is_urgent: boolean;
  attachments?: { name: string; url: string; size: number }[];
  deleted_at?: string;
  creation?: string;
}

export interface FrappeUser {
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_image?: string;
  full_name?: string;
}

export interface PickupRequest {
  name: string;
  institution: string;
  student: string;
  requested_by: string;
  request_type: 'Different Time' | 'Different Person' | 'Both';
  pickup_date: string;
  pickup_time?: string;
  authorized_person?: string;
  authorized_dni?: string;
  authorized_relationship?: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  creation?: string;
}

export interface Report {
  name: string;
  institution: string;
  student: string;
  report_type: string;
  title: string;
  content?: string;
  file?: string;
  period?: string;
  visible_to_parents: boolean;
  published_at?: string;
  owner?: string;
  creation?: string;
}

export interface PushToken {
  name: string;
  user: string;
  token: string;
  platform: 'iOS' | 'Android';
  creation?: string;
  modified?: string;
}

export interface ContentRead {
  name: string;
  user: string;
  content_type: 'News' | 'School Event' | 'Report' | 'Message';
  content_id: string;
  read_at: string;
}

export interface UserPinnedNews {
  name: string;
  user: string;
  news: string;
  creation?: string;
}

export interface UserArchivedNews {
  name: string;
  user: string;
  news: string;
  creation?: string;
}

export interface NewsAcknowledgment {
  name: string;
  user: string;
  news: string;
  acknowledged_at: string;
}

// =============================================================================
// FRAPPE CLIENT TYPES
// =============================================================================

// Filter operators for Frappe queries
export type FrappeFilterOperator =
  | '='
  | '!='
  | '<'
  | '>'
  | '<='
  | '>='
  | 'like'
  | 'not like'
  | 'in'
  | 'not in'
  | 'is'
  | 'between';

// Filter tuple: [field, operator, value]
export type FrappeFilter = [string, FrappeFilterOperator, unknown];

// Query options for getDocList
export interface FrappeListOptions {
  fields?: string[];
  filters?: FrappeFilter[];
  orFilters?: FrappeFilter[];
  orderBy?: {
    field: string;
    order?: 'asc' | 'desc';
  };
  limit?: number;
  limitStart?: number;
  groupBy?: string;
  asDict?: boolean;
}

// =============================================================================
// TOKEN STORAGE
// =============================================================================

const TOKEN_KEY = 'frappe_token';
const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

export async function saveToken(token: string): Promise<void> {
  await Storage.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await Storage.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await Storage.deleteItemAsync(TOKEN_KEY);
}

// Biometric authentication helpers
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await Storage.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await Storage.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return value === 'true';
}

export async function clearBiometricSetting(): Promise<void> {
  await Storage.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

// =============================================================================
// FRAPPE CLIENT INITIALIZATION
// =============================================================================

/**
 * Create Frappe client with token-based authentication
 */
function createFrappeClient() {
  return new FrappeApp(FRAPPE_URL, {
    useToken: true,
    token: getToken,
    type: 'token', // Uses "token api_key:api_secret" format or Bearer token
  });
}

// Singleton instance
let frappeApp: FrappeApp | null = null;

export function getFrappeApp(): FrappeApp {
  if (!frappeApp) {
    frappeApp = createFrappeClient();
  }
  return frappeApp;
}

/**
 * Reset the Frappe client (useful after logout)
 */
export function resetFrappeClient(): void {
  frappeApp = null;
}

// =============================================================================
// DATABASE HELPER FUNCTIONS
// =============================================================================

/**
 * Get the database interface for CRUD operations
 */
export function db() {
  return getFrappeApp().db();
}

/**
 * Get the authentication interface
 */
export function auth() {
  return getFrappeApp().auth();
}

/**
 * Get the file interface for uploads
 */
export function file() {
  return getFrappeApp().file();
}

/**
 * Call a whitelisted Frappe method
 */
export function call() {
  return getFrappeApp().call();
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON OPERATIONS
// =============================================================================

/**
 * Get a list of documents
 */
export async function getDocList<T>(
  doctype: string,
  options?: FrappeListOptions
): Promise<T[]> {
  const result = await db().getDocList(doctype, options);
  return result as T[];
}

/**
 * Get a single document by name
 */
export async function getDoc<T>(doctype: string, name: string): Promise<T> {
  const result = await db().getDoc(doctype, name);
  return result as T;
}

/**
 * Create a new document
 */
export async function createDoc<T>(doctype: string, data: Partial<T>): Promise<T> {
  const result = await db().createDoc(doctype, data);
  return result as T;
}

/**
 * Update an existing document
 */
export async function updateDoc<T>(
  doctype: string,
  name: string,
  data: Partial<T>
): Promise<T> {
  const result = await db().updateDoc(doctype, name, data);
  return result as T;
}

/**
 * Delete a document
 */
export async function deleteDoc(doctype: string, name: string): Promise<void> {
  await db().deleteDoc(doctype, name);
}

/**
 * Get count of documents
 */
export async function getCount(
  doctype: string,
  filters?: FrappeFilter[]
): Promise<number> {
  const result = await db().getCount(doctype, filters);
  return result;
}

/**
 * Check if a document exists
 */
export async function exists(doctype: string, name: string): Promise<boolean> {
  try {
    await db().getDoc(doctype, name);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// ASSET URL HELPER
// =============================================================================

/**
 * Get the full URL for a file attachment
 * In Frappe, files are stored with paths like /files/filename.ext
 */
export function getAssetUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;

  // If it's already a full URL, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // If it starts with /, prepend the base URL
  if (filePath.startsWith('/')) {
    return `${FRAPPE_URL}${filePath}`;
  }

  // Otherwise, assume it's a relative path under /files/
  return `${FRAPPE_URL}/files/${filePath}`;
}

// =============================================================================
// LEGACY COMPATIBILITY - AppUser type for AuthContext
// =============================================================================

/**
 * AppUser type for compatibility with existing AuthContext
 * Maps Guardian DocType fields to the expected interface
 */
export interface AppUser {
  id: string;
  organization_id: string;
  frappe_user_id?: string;
  role: 'admin' | 'teacher' | 'parent' | 'staff';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  children?: string[];
}

/**
 * Convert a Guardian to AppUser format
 */
export function guardianToAppUser(guardian: Guardian): AppUser {
  return {
    id: guardian.name,
    organization_id: guardian.institution || '',
    frappe_user_id: guardian.user,
    role: 'parent',
    first_name: guardian.first_name,
    last_name: guardian.last_name,
    email: guardian.email || '',
    phone: guardian.phone,
    status: guardian.status === 'Active' ? 'active' : 'inactive',
  };
}

// =============================================================================
// TYPE ALIASES (for naming consistency)
// =============================================================================

// Announcement → News (app uses "Announcement" terminology)
export type Announcement = News;
export type AnnouncementAttachment = NewsAttachment;

// Event → SchoolEvent (app uses "Event" terminology)
export type Event = SchoolEvent;

// Organization → Institution (app uses "Organization" terminology)
export type Organization = Institution;

// Location type (referenced by events)
export interface Location {
  name: string;
  institution: string;
  location_name: string;
  location_type?: 'Classroom' | 'Gym' | 'Auditorium' | 'Outdoor' | 'Office';
  capacity?: number;
  custom_fields?: Record<string, unknown>;
}

// Token helpers (wrapper for compatibility)
export async function getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const token = await getToken();
  return { accessToken: token, refreshToken: null };
}

export async function saveTokens(accessToken: string, _refreshToken?: string): Promise<void> {
  await saveToken(accessToken);
}

export async function clearTokens(): Promise<void> {
  await clearToken();
}

// =============================================================================
// EXPORTS
// =============================================================================

export const frappe = {
  db,
  auth,
  file,
  call,
  getDocList,
  getDoc,
  createDoc,
  updateDoc,
  deleteDoc,
  getCount,
  exists,
  getAssetUrl,
  getToken,
};

export default frappe;

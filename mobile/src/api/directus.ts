import { createDirectus, rest, authentication } from '@directus/sdk';
import * as SecureStore from 'expo-secure-store';

// Use environment variable with fallback to production URL
const DIRECTUS_URL = process.env.EXPO_PUBLIC_DIRECTUS_URL || 'https://kairos-directus-684614817316.us-central1.run.app';

// Define schema types matching our Directus collections
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primary_color?: string; // Hex color for header/branding (e.g., "#1E40AF")
  settings?: Record<string, any>;
  // O2M relation to campuses
  campuses?: Campus[];
}

export interface Campus {
  id: string;
  organization_id: string;
  name: string;
  code?: string; // Short identifier (e.g., "NORTH", "CENTRAL")
  address?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  logo?: string;
  primary_color?: string; // Override org color for this campus
  settings?: Record<string, any>;
  status: 'active' | 'inactive';
  date_created?: string;
  date_updated?: string;
}

export interface AppUser {
  id: string;
  organization_id: string;
  directus_user_id?: string;
  role: 'admin' | 'teacher' | 'parent' | 'staff';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  // Direct M2M relationship to students (for parents)
  children?: string[];
}

export interface Student {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  section_id: string;
  photo?: string;
  status: 'active' | 'inactive';
}

export interface Announcement {
  id: string;
  organization_id: string;
  author_id: string;
  title: string;
  content: string;
  image?: string;
  priority: 'urgent' | 'important' | 'normal';
  target_type: 'all' | 'grade' | 'section';
  target_id?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  // Note: Schema uses publish_at, client uses published_at (both supported via setup-schema-v2.sh)
  published_at?: string;
  publish_at?: string;
  // Novedades V2 fields
  is_pinned?: boolean;           // Global admin pinning (for all users)
  requires_acknowledgment?: boolean;  // Requires explicit user confirmation
  video_url?: string;            // YouTube/Vimeo embed URL
  // Attachments (populated via M2M or fetched separately)
  attachments?: AnnouncementAttachment[];
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  type?: 'classroom' | 'gym' | 'auditorium' | 'outdoor' | 'office';
  capacity?: number;
  custom_fields?: Record<string, any>;
}

export interface Event {
  id: string;
  organization_id: string;
  author_id: string;
  title: string;
  description?: string;
  image?: string;
  start_date: string;
  end_date?: string;
  all_day: boolean;
  location_id?: string | Location;
  location_external?: string;
  requires_confirmation: boolean;
  confirmation_deadline?: string;
  target_type: 'all' | 'grade' | 'section';
  target_id?: string;
  status: 'draft' | 'published' | 'cancelled';
  created_at: string;
}

export interface Message {
  id: string;
  organization_id: string;
  parent_id?: string;
  author_id: string;
  subject: string;
  content: string;
  target_type: 'user' | 'section' | 'grade' | 'all';
  target_id?: string;
  // Schema uses: sent | archived (legacy messages collection)
  status: 'sent' | 'archived';
  created_at: string;
}

export interface MessageRecipient {
  id: string;
  message_id: string | Message;
  user_id: string;
  delivered_at?: string;
  read_at?: string;
  date_created: string;
}

// New conversation-based messaging system (WhatsApp-style)
export interface Conversation {
  id: string;
  organization_id: string;
  type: 'private' | 'group';
  subject: string;
  started_by: string;
  status: 'open' | 'closed' | 'archived';
  closed_by?: string;
  closed_at?: string;
  closed_reason?: string;
  date_created: string;
  date_updated: string;
  // Populated relations
  participants?: ConversationParticipant[];
  messages?: ConversationMessage[];
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string | Conversation;
  user_id: string | DirectusUser;
  role: 'teacher' | 'parent' | 'admin';
  can_reply: boolean;
  is_blocked: boolean;
  is_muted: boolean;
  last_read_at?: string;
  date_created: string;
  // Populated user info
  user?: DirectusUser;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string | Conversation;
  sender_id: string | DirectusUser; // Can be populated with DirectusUser object
  content: string;
  content_type: 'text' | 'html';
  is_urgent: boolean;
  attachments?: { name: string; url: string; size: number }[];
  deleted_at?: string;
  date_created: string;
}

export interface DirectusUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
}

export interface PickupRequest {
  id: string;
  organization_id: string;
  student_id: string;
  requested_by: string;
  // Schema uses: different_time | different_person | both
  request_type: 'different_time' | 'different_person' | 'both';
  pickup_date: string;
  pickup_time?: string;
  authorized_person?: string;
  authorized_dni?: string;
  authorized_relationship?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
}

export interface Report {
  id: string;
  organization_id: string;
  student_id: string;
  author_id: string;
  type: string;  // report_card, progress, etc.
  title: string;
  content?: string;
  file?: string;
  period?: string;
  visible_to_parents: boolean;
  published_at?: string;
  created_at: string;
}

export interface StudentGuardian {
  id: string;
  student_id: string;
  user_id: string; // References app_users.id (the guardian/parent)
  relationship: string;
  is_primary: boolean;
  can_pickup: boolean;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at?: string;
}

export interface ContentRead {
  id: string;
  user_id: string;
  content_type: 'announcement' | 'event' | 'report' | 'message';
  content_id: string;
  read_at: string;
}

// Novedades V2 - User-specific announcement actions
export interface UserPinnedAnnouncement {
  id: string;
  user_id: string;
  announcement_id: string;
  pinned_at: string;
}

export interface UserArchivedAnnouncement {
  id: string;
  user_id: string;
  announcement_id: string;
  archived_at: string;
}

export interface AnnouncementAcknowledgment {
  id: string;
  user_id: string;
  announcement_id: string;
  acknowledged_at: string;
}

export interface AnnouncementAttachment {
  id: string;
  announcement_id: string;
  file: string;  // directus_files ID
  title?: string;
  sort?: number;
}

// Schema definition for Directus SDK
interface Schema {
  organizations: Organization[];
  campuses: Campus[];
  app_users: AppUser[];
  students: Student[];
  student_guardians: StudentGuardian[];
  announcements: Announcement[];
  events: Event[];
  messages: Message[];
  message_recipients: MessageRecipient[];
  conversations: Conversation[];
  conversation_participants: ConversationParticipant[];
  conversation_messages: ConversationMessage[];
  pickup_requests: PickupRequest[];
  reports: Report[];
  push_tokens: PushToken[];
  content_reads: ContentRead[];
  directus_users: DirectusUser[];
  // Novedades V2 collections
  user_pinned_announcements: UserPinnedAnnouncement[];
  user_archived_announcements: UserArchivedAnnouncement[];
  announcement_acknowledgments: AnnouncementAcknowledgment[];
  announcement_attachments: AnnouncementAttachment[];
}

// Token storage helpers
const TOKEN_KEY = 'directus_token';
const REFRESH_TOKEN_KEY = 'directus_refresh_token';
const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getTokens() {
  const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  return { accessToken, refreshToken };
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// Biometric authentication helpers
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return value === 'true';
}

export async function clearBiometricSetting(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

// Create Directus client
export const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(rest())
  .with(authentication('json'));

export default directus;

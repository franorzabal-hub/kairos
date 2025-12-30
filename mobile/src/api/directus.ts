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
  settings?: Record<string, any>;
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
  location_id?: string;
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
  user_id: string;
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
  user_id: string;
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

// Schema definition for Directus SDK
interface Schema {
  organizations: Organization[];
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

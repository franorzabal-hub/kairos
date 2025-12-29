import { createDirectus, rest, authentication } from '@directus/sdk';
import * as SecureStore from 'expo-secure-store';

const DIRECTUS_URL = 'https://kairos-directus-684614817316.us-central1.run.app';

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
  published_at?: string;
}

export interface Event {
  id: string;
  organization_id: string;
  author_id: string;
  title: string;
  description?: string;
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
  status: 'active' | 'closed';
  created_at: string;
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface PickupRequest {
  id: string;
  organization_id: string;
  student_id: string;
  requested_by: string;
  request_type: 'early' | 'different_person' | 'both';
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
  report_type: string;
  title: string;
  content?: string;
  file?: string;
  period?: string;
  visible_to_parents: boolean;
  status: 'draft' | 'published';
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

// Schema definition for Directus SDK
interface Schema {
  organizations: Organization[];
  app_users: AppUser[];
  students: Student[];
  student_guardians: StudentGuardian[];
  announcements: Announcement[];
  events: Event[];
  messages: Message[];
  message_reads: MessageRead[];
  pickup_requests: PickupRequest[];
  reports: Report[];
}

// Token storage helpers
const TOKEN_KEY = 'directus_token';
const REFRESH_TOKEN_KEY = 'directus_refresh_token';

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

// Create Directus client
export const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(rest())
  .with(authentication('json'));

export default directus;

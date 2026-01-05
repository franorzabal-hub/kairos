/**
 * Field Trips Hooks
 *
 * React Query hooks for managing field trip authorizations.
 * Parents use these hooks to view pending trips and authorize their children.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocList,
  getDoc,
  updateDoc,
  FieldTrip,
  FieldTripStudent,
  FrappeFilter,
  call,
} from '../frappe';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../context/ChildrenContext';
import { queryKeys } from './queryKeys';

/**
 * Fetch field trip students pending authorization for the current user's children.
 *
 * Returns trips where the student is linked to the guardian and authorization is pending.
 */
export function useFieldTripsPendingAuthorization() {
  const { user } = useAuth();
  const { selectedChildId, children } = useChildren();

  return useQuery({
    queryKey: queryKeys.fieldTripStudents(user?.id || '', selectedChildId),
    queryFn: async () => {
      if (!user?.id || !children?.length) return [];

      // Get student IDs for the guardian's children
      const studentIds = selectedChildId
        ? [selectedChildId]
        : children.map((c) => c.name);

      const filters: FrappeFilter[] = [
        ['student', 'in', studentIds],
        ['authorization_status', '=', 'Pending'],
      ];

      const items = await getDocList<FieldTripStudent>('Field Trip Student', {
        fields: ['*'],
        filters,
        orderBy: { field: 'creation', order: 'desc' },
        limit: 50,
      });

      // Fetch field trip details for each item
      const itemsWithTrips = await Promise.all(
        items.map(async (item) => {
          try {
            const trip = await getDoc<FieldTrip>('Field Trip', item.field_trip);
            return { ...item, field_trip_details: trip };
          } catch {
            return item;
          }
        })
      );

      return itemsWithTrips;
    },
    enabled: !!user?.id && (children?.length ?? 0) > 0,
  });
}

/**
 * Fetch a single field trip student record with trip details.
 */
export function useFieldTripStudent(id: string) {
  return useQuery({
    queryKey: queryKeys.fieldTripStudent(id),
    queryFn: async () => {
      if (!id) return null;

      const item = await getDoc<FieldTripStudent>('Field Trip Student', id);

      // Fetch field trip details
      if (item.field_trip) {
        try {
          const trip = await getDoc<FieldTrip>('Field Trip', item.field_trip);
          return { ...item, field_trip_details: trip };
        } catch {
          return item;
        }
      }

      return item;
    },
    enabled: !!id,
  });
}

/**
 * Fetch a single field trip by ID.
 */
export function useFieldTrip(id: string) {
  return useQuery({
    queryKey: queryKeys.fieldTrip(id),
    queryFn: async () => {
      if (!id) return null;
      return await getDoc<FieldTrip>('Field Trip', id);
    },
    enabled: !!id,
  });
}

/**
 * Authorization data submitted by the parent.
 */
export interface AuthorizeFieldTripData {
  fieldTripStudentId: string;
  authorize: boolean; // true = authorize, false = decline
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  specialNeeds?: string;
  notes?: string;
}

/**
 * Mutation to authorize or decline a field trip for a student.
 */
export function useAuthorizeFieldTrip() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: AuthorizeFieldTripData) => {
      const updateData: Partial<FieldTripStudent> = {
        authorization_status: data.authorize ? 'Authorized' : 'Declined',
        authorized_by: user?.id,
        authorization_date: new Date().toISOString().split('T')[0],
        authorization_method: 'App',
      };

      // Add emergency contact if provided
      if (data.emergencyContactName) {
        updateData.emergency_contact_name = data.emergencyContactName;
      }
      if (data.emergencyContactPhone) {
        updateData.emergency_contact_phone = data.emergencyContactPhone;
      }
      if (data.emergencyContactRelationship) {
        updateData.emergency_contact_relationship = data.emergencyContactRelationship;
      }

      // Add medical info if provided
      if (data.medicalConditions) {
        updateData.medical_conditions = data.medicalConditions;
      }
      if (data.allergies) {
        updateData.allergies = data.allergies;
      }
      if (data.medications) {
        updateData.medications = data.medications;
      }
      if (data.specialNeeds) {
        updateData.special_needs = data.specialNeeds;
      }
      if (data.notes) {
        updateData.notes = data.notes;
      }

      return await updateDoc<FieldTripStudent>(
        'Field Trip Student',
        data.fieldTripStudentId,
        updateData
      );
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.fieldTripStudent(variables.fieldTripStudentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fieldTripStudents(user?.id || ''),
      });
    },
  });
}

/**
 * Upload a paper authorization form.
 */
export function useUploadAuthorizationDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      fieldTripStudentId,
      fileUri,
      fileName,
    }: {
      fieldTripStudentId: string;
      fileUri: string;
      fileName: string;
    }) => {
      // First upload the file
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: 'application/pdf',
      } as unknown as Blob);
      formData.append('doctype', 'Field Trip Student');
      formData.append('docname', fieldTripStudentId);
      formData.append('fieldname', 'authorization_document');

      const uploadResult = await call().post('upload_file', formData);

      // Then update the record
      return await updateDoc<FieldTripStudent>(
        'Field Trip Student',
        fieldTripStudentId,
        {
          authorization_document: uploadResult.message.file_url,
          authorization_method: 'Paper Form',
          authorization_status: 'Authorized',
          authorized_by: user?.id,
          authorization_date: new Date().toISOString().split('T')[0],
        }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fieldTripStudent(variables.fieldTripStudentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fieldTripStudents(user?.id || ''),
      });
    },
  });
}

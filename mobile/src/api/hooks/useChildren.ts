import { useQuery } from '@tanstack/react-query';
import { readItems } from '@directus/sdk';
import { directus, Student } from '../directus';
import { useAuth } from '../../context/AuthContext';
import { useChildren as useChildrenContext } from '../../context/ChildrenContext';
import { queryKeys } from './queryKeys';

// Fetch children for the current user
// Uses student_guardians junction table to find the parent's children
export function useChildren() {
  const { user } = useAuth();
  const { setChildren } = useChildrenContext();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: queryKeys.children.user(userId),
    queryFn: async () => {
      if (!user?.id) return [];

      // Get student_guardians for this user (user_id references app_users.id)
      const guardians = await directus.request(
        readItems('student_guardians', {
          filter: { user_id: { _eq: user.id } },
        })
      );

      if (!guardians.length) return [];

      // Get students for these guardians
      const studentIds = guardians.map(g => g.student_id);

      // Note: Don't request grade_id - Parent role may not have permission for that field
      const students = await directus.request(
        readItems('students', {
          filter: { id: { _in: studentIds }, status: { _eq: 'active' } },
          fields: ['id', 'organization_id', 'first_name', 'last_name', 'birth_date', 'photo', 'section_id', 'status'],
        })
      );

      setChildren(students as Student[]);
      return students as Student[];
    },
    enabled: !!user?.id,
  });
}

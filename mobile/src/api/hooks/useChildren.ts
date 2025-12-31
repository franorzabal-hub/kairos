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

      // Fetch students with section info (includes grade_id for content filtering)
      // The section relation is needed to properly filter announcements by grade
      const students = await directus.request(
        readItems('students', {
          filter: { id: { _in: studentIds }, status: { _eq: 'active' } },
          fields: [
            'id',
            'organization_id',
            'first_name',
            'last_name',
            'birth_date',
            'photo',
            'section_id',
            'status',
            // Include section with grade_id for filtering announcements by grade
            { section_id: ['id', 'grade_id', 'name'] },
          ] as any,
        })
      );

      const typedStudents = students as unknown as Student[];
      setChildren(typedStudents);
      return typedStudents;
    },
    enabled: !!user?.id,
  });
}

import { useQuery } from '@tanstack/react-query';
import { getDocList, Student, StudentGuardian, Guardian } from '../frappe';
import { useAuth } from '../../context/AuthContext';
import { useChildren as useChildrenContext } from '../../context/ChildrenContext';
import { queryKeys } from './queryKeys';

// Fetch children for the current user
// Uses Student Guardian junction DocType to find the parent's children
export function useChildren() {
  const { user } = useAuth();
  const { setChildren } = useChildrenContext();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: queryKeys.children.user(userId),
    queryFn: async () => {
      if (!user?.id) return [];

      // Get Student Guardian records for this guardian (user.id references Guardian.name)
      const guardianLinks = await getDocList<StudentGuardian>('Student Guardian', {
        filters: [['guardian', '=', user.id]],
      });

      if (!guardianLinks.length) return [];

      // Get students for these guardian links
      const studentNames = guardianLinks.map(g => g.student);

      // Fetch students with section info (includes grade for content filtering)
      // The section relation is needed to properly filter announcements by grade
      const students = await getDocList<Student>('Student', {
        filters: [
          ['name', 'in', studentNames],
          ['status', '=', 'Active'],
        ],
        fields: [
          'name',
          'institution',
          'student_name',
          'first_name',
          'last_name',
          'birth_date',
          'photo',
          'current_section',
          'current_grade',
          'status',
        ],
      });

      setChildren(students);
      return students;
    },
    enabled: !!user?.id,
  });
}

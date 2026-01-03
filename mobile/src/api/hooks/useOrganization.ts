import { useQuery } from '@tanstack/react-query';
import { getDoc, Institution } from '../frappe';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from './queryKeys';

// Fetch organization (institution) data
export function useOrganization() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.organization(user?.organization_id || ''),
    queryFn: async () => {
      if (!user?.organization_id) return null;

      const institution = await getDoc<Institution>('Institution', user.organization_id);
      return institution;
    },
    enabled: !!user?.organization_id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - institution data rarely changes
  });
}

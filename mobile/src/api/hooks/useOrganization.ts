import { useQuery } from '@tanstack/react-query';
import { readItem } from '@directus/sdk';
import { directus, Organization } from '../directus';
import { useAppContext } from '../../context/AppContext';
import { queryKeys } from './queryKeys';

// Fetch organization data
export function useOrganization() {
  const { user } = useAppContext();

  return useQuery({
    queryKey: queryKeys.organization(user?.organization_id || ''),
    queryFn: async () => {
      if (!user?.organization_id) return null;

      const org = await directus.request(
        readItem('organizations', user.organization_id)
      );
      return org as Organization;
    },
    enabled: !!user?.organization_id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - org data rarely changes
  });
}

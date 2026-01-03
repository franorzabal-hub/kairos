/**
 * useInvitation - Hook para manejar invitaciones de padres/tutores
 *
 * Proporciona:
 * - useInvitation(token): Obtiene los detalles de una invitacion
 * - useAcceptInvitation(): Mutacion para aceptar una invitacion
 *
 * Endpoints de Frappe:
 * - GET /api/method/kairos.api.invitations.get_invitation?token=xxx
 * - POST /api/method/kairos.api.invitations.accept_invitation
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FRAPPE_URL, getToken } from '../frappe';
import { createSecureHeaders } from '../../config/security';
import { queryKeys } from './queryKeys';

// =============================================================================
// TYPES
// =============================================================================

export interface InvitationStudent {
  name: string;
  student_name: string;
  first_name: string;
  last_name: string;
  photo?: string;
  current_grade?: string;
  current_section?: string;
}

export interface InvitationDetails {
  token: string;
  institution: string;
  institution_name: string;
  institution_logo?: string;
  students: InvitationStudent[];
  invited_email: string;
  invited_name?: string;
  status: 'Pending' | 'Accepted' | 'Expired' | 'Revoked';
  expires_at?: string;
  created_at?: string;
}

export interface AcceptInvitationParams {
  token: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  message?: string;
  guardian_id?: string;
  students_linked?: string[];
}

// =============================================================================
// QUERY KEYS
// =============================================================================

export const invitationQueryKeys = {
  invitation: (token: string) => ['invitation', token] as const,
};

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function fetchInvitation(token: string): Promise<InvitationDetails> {
  const authToken = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...createSecureHeaders(),
  };

  // Solo agregar Authorization si el usuario esta logueado
  if (authToken) {
    headers['Authorization'] = `token ${authToken}`;
  }

  const response = await fetch(
    `${FRAPPE_URL}/api/method/kairos.api.invitations.get_invitation?token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
      headers,
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 404) {
      throw new Error('Invitacion no encontrada');
    }
    if (response.status === 410) {
      throw new Error('Esta invitacion ha expirado');
    }

    throw new Error(
      errorData.message || errorData.exc || `Error ${response.status}`
    );
  }

  const data = await response.json();

  // Frappe envuelve la respuesta en un objeto "message"
  return data.message || data;
}

async function acceptInvitation(params: AcceptInvitationParams): Promise<AcceptInvitationResult> {
  const authToken = await getToken();

  if (!authToken) {
    throw new Error('Debes iniciar sesion para aceptar la invitacion');
  }

  const response = await fetch(
    `${FRAPPE_URL}/api/method/kairos.api.invitations.accept_invitation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${authToken}`,
        ...createSecureHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({ token: params.token }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new Error('Sesion expirada. Por favor inicia sesion nuevamente.');
    }
    if (response.status === 404) {
      throw new Error('Invitacion no encontrada');
    }
    if (response.status === 410) {
      throw new Error('Esta invitacion ha expirado');
    }
    if (response.status === 409) {
      throw new Error('Esta invitacion ya fue aceptada');
    }

    throw new Error(
      errorData.message || errorData.exc || `Error al aceptar invitacion`
    );
  }

  const data = await response.json();
  return data.message || data;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook para obtener los detalles de una invitacion
 *
 * @param token - Token de la invitacion (de deep link o QR)
 * @returns { invitation, isLoading, error, isValid, isExpired, isAccepted }
 *
 * @example
 * ```tsx
 * const { invitation, isLoading, error, isValid } = useInvitation(token);
 *
 * if (isLoading) return <ActivityIndicator />;
 * if (error) return <Text>Error: {error.message}</Text>;
 * if (!isValid) return <Text>Invitacion invalida</Text>;
 *
 * return <Text>Invitacion de {invitation.institution_name}</Text>;
 * ```
 */
export function useInvitation(token: string) {
  const query = useQuery({
    queryKey: invitationQueryKeys.invitation(token),
    queryFn: () => fetchInvitation(token),
    enabled: !!token && token.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: (failureCount, error) => {
      // No reintentar errores de negocio (404, 410, etc.)
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes('no encontrada') ||
          msg.includes('expirado') ||
          msg.includes('expired')
        ) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });

  const invitation = query.data;
  const isExpired = invitation?.status === 'Expired' || invitation?.status === 'Revoked';
  const isAccepted = invitation?.status === 'Accepted';
  const isValid = !!invitation && invitation.status === 'Pending';

  return {
    invitation,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isValid,
    isExpired,
    isAccepted,
    refetch: query.refetch,
  };
}

/**
 * Hook para aceptar una invitacion
 *
 * @returns { acceptInvitation, isLoading, error, isSuccess, reset }
 *
 * @example
 * ```tsx
 * const { acceptInvitation, isLoading, isSuccess, error } = useAcceptInvitation();
 *
 * const handleAccept = async () => {
 *   try {
 *     await acceptInvitation({ token });
 *     // Navegar a pantalla de exito
 *   } catch (err) {
 *     // Mostrar error
 *   }
 * };
 * ```
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (result, variables) => {
      // Invalidar la cache de la invitacion
      queryClient.invalidateQueries({
        queryKey: invitationQueryKeys.invitation(variables.token),
      });

      // Invalidar la cache de children ya que se vincularon nuevos estudiantes
      queryClient.invalidateQueries({
        queryKey: queryKeys.children.all,
      });
    },
  });

  return {
    acceptInvitation: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
    data: mutation.data,
  };
}

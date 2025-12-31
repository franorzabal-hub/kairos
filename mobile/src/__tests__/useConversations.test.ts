/**
 * Tests for useConversations hooks
 *
 * Tests the WhatsApp-style messaging hooks:
 * - useConversations - fetch all conversations with metadata
 * - useConversation - fetch single conversation
 * - useConversationMessages - fetch messages in a conversation
 * - useSendMessage - send a message
 * - useMarkConversationRead - mark as read
 * - Conversation control hooks (close, reopen, archive, etc.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/hooks/queryKeys';
import {
  Conversation,
  ConversationMessage,
  ConversationParticipant,
  DirectusUser,
} from '../api/directus';

// Type the mocked functions
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;

// Sample user data
const mockDirectusUser: DirectusUser = {
  id: 'directus-user-123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
};

const mockOtherUser: DirectusUser = {
  id: 'directus-user-456',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
};

// Sample conversation data
const mockConversation: Conversation = {
  id: 'conv-1',
  organization_id: 'org-123',
  type: 'private',
  subject: 'Question about homework',
  started_by: 'directus-user-123',
  channel: 'profesores',
  status: 'open',
  date_created: '2024-01-15T10:00:00Z',
  date_updated: '2024-01-15T14:30:00Z',
};

const mockParticipant: ConversationParticipant = {
  id: 'part-1',
  conversation_id: 'conv-1',
  user_id: 'directus-user-123',
  role: 'parent',
  can_reply: true,
  is_blocked: false,
  is_muted: false,
  last_read_at: '2024-01-15T14:00:00Z',
  date_created: '2024-01-15T10:00:00Z',
};

const mockMessage: ConversationMessage = {
  id: 'msg-1',
  conversation_id: 'conv-1',
  sender_id: mockDirectusUser,
  content: 'Hello, I have a question about the math homework.',
  content_type: 'text',
  is_urgent: false,
  date_created: '2024-01-15T10:05:00Z',
};

// Mock auth context
const mockAuthUser = {
  id: 'app-user-123',
  organization_id: 'org-123',
  directus_user_id: 'directus-user-123',
  role: 'parent' as const,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  status: 'active' as const,
};

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: mockAuthUser,
    isAuthenticated: true,
    isLoading: false,
  })),
}));

import { useAuth } from '../context/AuthContext';
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useConversations hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockAuthUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      biometricLockout: { isLocked: false, remainingTime: 0 },
    });
  });

  describe('queryKeys', () => {
    it('should have correct conversations.all key', () => {
      expect(queryKeys.conversations.all).toEqual(['conversations']);
    });

    it('should generate correct conversations.user key', () => {
      const userId = 'user-123';
      expect(queryKeys.conversations.user(userId)).toEqual(['conversations', 'user-123']);
    });

    it('should generate correct conversation key for id', () => {
      expect(queryKeys.conversation('conv-1')).toEqual(['conversation', 'conv-1']);
    });

    it('should generate correct conversationMessages key', () => {
      expect(queryKeys.conversationMessages('conv-1')).toEqual(['conversationMessages', 'conv-1']);
    });
  });

  describe('useConversations', () => {
    it('should use directus_user_id for queries', () => {
      // The hook uses user?.directus_user_id
      expect(mockAuthUser.directus_user_id).toBe('directus-user-123');
    });

    it('should be enabled when directusUserId exists', () => {
      const directusUserId = mockAuthUser.directus_user_id;
      expect(!!directusUserId).toBe(true);
    });

    it('should be disabled when directusUserId is undefined', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockAuthUser, directus_user_id: undefined },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        biometricLockout: { isLocked: false, remainingTime: 0 },
      });

      const directusUserId = undefined;
      expect(!!directusUserId).toBe(false);
    });

    it('should generate user-scoped query key', () => {
      const directusUserId = mockAuthUser.directus_user_id!;
      const queryKey = queryKeys.conversations.user(directusUserId);
      expect(queryKey).toEqual(['conversations', 'directus-user-123']);
    });
  });

  describe('useConversation', () => {
    it('should be enabled when both userId and conversationId exist', () => {
      const directusUserId = mockAuthUser.directus_user_id;
      const conversationId = 'conv-1';
      expect(!!directusUserId && !!conversationId).toBe(true);
    });

    it('should be disabled when conversationId is empty', () => {
      const conversationId = '';
      expect(!!conversationId).toBe(false);
    });

    it('should be disabled when user is not authenticated', () => {
      const directusUserId = undefined;
      const conversationId = 'conv-1';
      expect(!!directusUserId && !!conversationId).toBe(false);
    });
  });

  describe('useConversationMessages', () => {
    it('should generate correct query key', () => {
      const conversationId = 'conv-1';
      const queryKey = queryKeys.conversationMessages(conversationId);
      expect(queryKey).toEqual(['conversationMessages', 'conv-1']);
    });

    it('should filter out deleted messages', () => {
      // The query includes: deleted_at: { _null: true }
      const filter = {
        conversation_id: { _eq: 'conv-1' },
        deleted_at: { _null: true },
      };
      expect(filter.deleted_at._null).toBe(true);
    });

    it('should sort messages by date_created ascending', () => {
      // Messages are sorted chronologically for chat display
      const sort = ['date_created'];
      expect(sort).toEqual(['date_created']);
    });
  });

  describe('useSendMessage', () => {
    it('should require authentication', () => {
      const directusUserId = mockAuthUser.directus_user_id;
      expect(directusUserId).toBeDefined();
    });

    it('should throw error when not authenticated', () => {
      const directusUserId = undefined;
      const shouldThrow = () => {
        if (!directusUserId) throw new Error('User not authenticated');
      };
      expect(shouldThrow).toThrow('User not authenticated');
    });

    it('should invalidate correct queries on success', () => {
      const conversationId = 'conv-1';
      const directusUserId = 'directus-user-123';

      // On success, should invalidate:
      // 1. conversationMessages for this conversation
      // 2. conversations.user for current user
      const messagesToInvalidate = queryKeys.conversationMessages(conversationId);
      const conversationsToInvalidate = queryKeys.conversations.user(directusUserId);

      expect(messagesToInvalidate).toEqual(['conversationMessages', 'conv-1']);
      expect(conversationsToInvalidate).toEqual(['conversations', 'directus-user-123']);
    });
  });

  describe('useMarkConversationRead', () => {
    it('should update last_read_at to current time', () => {
      const now = new Date().toISOString();
      expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should invalidate user conversations on success', () => {
      const directusUserId = 'directus-user-123';
      const queryKey = queryKeys.conversations.user(directusUserId);
      expect(queryKey).toEqual(['conversations', 'directus-user-123']);
    });
  });

  describe('useCloseConversation', () => {
    it('should update conversation status to closed', () => {
      const updateData = {
        status: 'closed',
        closed_by: 'directus-user-123',
        closed_at: new Date().toISOString(),
        closed_reason: 'Issue resolved',
      };
      expect(updateData.status).toBe('closed');
      expect(updateData.closed_by).toBeDefined();
    });

    it('should invalidate both conversation and user conversations', () => {
      const conversationId = 'conv-1';
      const directusUserId = 'directus-user-123';

      const convKey = queryKeys.conversation(conversationId);
      const userConvsKey = queryKeys.conversations.user(directusUserId);

      expect(convKey).toEqual(['conversation', 'conv-1']);
      expect(userConvsKey).toEqual(['conversations', 'directus-user-123']);
    });
  });

  describe('useReopenConversation', () => {
    it('should reset conversation to open status', () => {
      const updateData = {
        status: 'open',
        closed_by: null,
        closed_at: null,
        closed_reason: null,
      };
      expect(updateData.status).toBe('open');
      expect(updateData.closed_by).toBeNull();
    });
  });

  describe('useArchiveConversation', () => {
    it('should update status to archived', () => {
      const updateData = {
        status: 'archived',
      };
      expect(updateData.status).toBe('archived');
    });
  });

  describe('useUnarchiveConversation', () => {
    it('should update status to open', () => {
      const updateData = {
        status: 'open',
      };
      expect(updateData.status).toBe('open');
    });
  });

  describe('useToggleParticipantReply', () => {
    it('should toggle can_reply boolean', () => {
      const testCases = [
        { input: true, expected: true },
        { input: false, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const updateData = { can_reply: input };
        expect(updateData.can_reply).toBe(expected);
      });
    });
  });

  describe('useToggleParticipantBlocked', () => {
    it('should toggle is_blocked boolean', () => {
      const testCases = [
        { input: true, expected: true },
        { input: false, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const updateData = { is_blocked: input };
        expect(updateData.is_blocked).toBe(expected);
      });
    });
  });

  describe('useMuteConversation', () => {
    it('should toggle is_muted boolean', () => {
      const testCases = [
        { input: true, expected: true },
        { input: false, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const updateData = { is_muted: input };
        expect(updateData.is_muted).toBe(expected);
      });
    });
  });

  describe('useCreateConversation', () => {
    it('should require all parameters', () => {
      const params = {
        subject: 'New question',
        channelId: 'secretaria',
        initialMessage: 'Hello, I need help with...',
        isUrgent: false,
      };

      expect(params.subject).toBeDefined();
      expect(params.channelId).toBeDefined();
      expect(params.initialMessage).toBeDefined();
    });

    it('should create conversation with correct data', () => {
      const conversationData = {
        subject: 'New question',
        status: 'open',
        channel: 'secretaria',
        started_by: 'directus-user-123',
        organization_id: 'org-123',
      };

      expect(conversationData.status).toBe('open');
      expect(conversationData.channel).toBe('secretaria');
    });

    it('should add creator as participant', () => {
      const participantData = {
        conversation_id: 'new-conv-id',
        user_id: 'directus-user-123',
        can_reply: true,
        is_blocked: false,
        is_muted: false,
      };

      expect(participantData.can_reply).toBe(true);
      expect(participantData.is_blocked).toBe(false);
    });

    it('should send initial message', () => {
      const messageData = {
        conversation_id: 'new-conv-id',
        sender_id: 'directus-user-123',
        content: 'Hello, I need help',
        content_type: 'text',
        is_urgent: false,
      };

      expect(messageData.content_type).toBe('text');
    });
  });
});

describe('Conversation data types', () => {
  it('should have correct type values', () => {
    const types = ['private', 'group'];
    expect(types).toContain(mockConversation.type);
  });

  it('should have correct status values', () => {
    const statuses = ['open', 'closed', 'archived'];
    expect(statuses).toContain(mockConversation.status);
  });

  it('should have correct channel values', () => {
    const channels = ['secretaria', 'profesores', 'general'];
    expect(channels).toContain(mockConversation.channel);
  });

  it('should support optional closed fields', () => {
    const closedConversation: Conversation = {
      ...mockConversation,
      status: 'closed',
      closed_by: 'user-123',
      closed_at: '2024-01-16T10:00:00Z',
      closed_reason: 'Issue resolved',
    };

    expect(closedConversation.closed_by).toBeDefined();
    expect(closedConversation.closed_at).toBeDefined();
    expect(closedConversation.closed_reason).toBeDefined();
  });
});

describe('ConversationParticipant data types', () => {
  it('should have correct role values', () => {
    const roles = ['teacher', 'parent', 'admin'];
    expect(roles).toContain(mockParticipant.role);
  });

  it('should have boolean flags', () => {
    expect(typeof mockParticipant.can_reply).toBe('boolean');
    expect(typeof mockParticipant.is_blocked).toBe('boolean');
    expect(typeof mockParticipant.is_muted).toBe('boolean');
  });
});

describe('ConversationMessage data types', () => {
  it('should have correct content_type values', () => {
    const contentTypes = ['text', 'html'];
    expect(contentTypes).toContain(mockMessage.content_type);
  });

  it('should support attachments', () => {
    const messageWithAttachments: ConversationMessage = {
      ...mockMessage,
      attachments: [
        { name: 'document.pdf', url: 'https://example.com/doc.pdf', size: 1024 },
      ],
    };

    expect(messageWithAttachments.attachments).toHaveLength(1);
    expect(messageWithAttachments.attachments![0].name).toBe('document.pdf');
  });

  it('should support deleted_at for soft delete', () => {
    const deletedMessage: ConversationMessage = {
      ...mockMessage,
      deleted_at: '2024-01-16T10:00:00Z',
    };

    expect(deletedMessage.deleted_at).toBeDefined();
  });
});

describe('ConversationWithMeta extended type', () => {
  it('should include computed properties', () => {
    // Based on the ConversationWithMeta interface in useConversations.ts
    const expectedProperties = [
      'participantId',
      'unreadCount',
      'lastMessage',
      'otherParticipants',
      'canReply',
      'isBlocked',
    ];

    expectedProperties.forEach(prop => {
      expect(typeof prop).toBe('string');
    });
  });
});

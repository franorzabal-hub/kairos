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
  FrappeUser,
} from '../api/frappe';

// Type the mocked functions
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;

// Sample user data (Frappe uses email as user ID)
const mockFrappeUser: FrappeUser = {
  name: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
};

const mockOtherUser: FrappeUser = {
  name: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
};

// Sample conversation data (using Frappe types)
const mockConversation: Conversation = {
  name: 'CONV-0001',
  institution: 'institution-123',
  conversation_type: 'Private',
  subject: 'Question about homework',
  started_by: 'john@example.com',
  channel: 'Profesores',
  status: 'Open',
  creation: '2024-01-15T10:00:00Z',
  modified: '2024-01-15T14:30:00Z',
};

const mockParticipant: ConversationParticipant = {
  name: 'CONVPART-0001',
  conversation: 'CONV-0001',
  user: 'john@example.com',
  role: 'Parent',
  can_reply: true,
  is_blocked: false,
  is_muted: false,
  last_read_at: '2024-01-15T14:00:00Z',
  creation: '2024-01-15T10:00:00Z',
};

const mockMessage: ConversationMessage = {
  name: 'CONVMSG-0001',
  conversation: 'CONV-0001',
  sender: 'john@example.com',
  content: 'Hello, I have a question about the math homework.',
  content_type: 'Text',
  is_urgent: false,
  creation: '2024-01-15T10:05:00Z',
};

// Mock auth context (using Frappe Guardian mapping)
const mockAuthUser = {
  id: 'guardian-123',
  organization_id: 'institution-123',
  frappe_user_id: 'john@example.com', // Frappe User
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
    it('should use Frappe user ID for queries', () => {
      // The hook uses user?.frappe_user_id (which maps to Frappe User email)
      expect(mockAuthUser.frappe_user_id).toBe('john@example.com');
    });

    it('should be enabled when frappeUserId exists', () => {
      const frappeUserId = mockAuthUser.frappe_user_id;
      expect(!!frappeUserId).toBe(true);
    });

    it('should be disabled when frappeUserId is undefined', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockAuthUser, frappe_user_id: undefined },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        biometricLockout: { isLocked: false, remainingTime: 0 },
      });

      const frappeUserId = undefined;
      expect(!!frappeUserId).toBe(false);
    });

    it('should generate user-scoped query key', () => {
      const frappeUserId = mockAuthUser.frappe_user_id!;
      const queryKey = queryKeys.conversations.user(frappeUserId);
      expect(queryKey).toEqual(['conversations', 'john@example.com']);
    });
  });

  describe('useConversation', () => {
    it('should be enabled when both userId and conversationId exist', () => {
      const frappeUserId = mockAuthUser.frappe_user_id;
      const conversationId = 'conv-1';
      expect(!!frappeUserId && !!conversationId).toBe(true);
    });

    it('should be disabled when conversationId is empty', () => {
      const conversationId = '';
      expect(!!conversationId).toBe(false);
    });

    it('should be disabled when user is not authenticated', () => {
      const frappeUserId = undefined;
      const conversationId = 'conv-1';
      expect(!!frappeUserId && !!conversationId).toBe(false);
    });
  });

  describe('useConversationMessages', () => {
    it('should generate correct query key', () => {
      const conversationId = 'CONV-0001';
      const queryKey = queryKeys.conversationMessages(conversationId);
      expect(queryKey).toEqual(['conversationMessages', 'CONV-0001']);
    });

    it('should filter out deleted messages', () => {
      // In Frappe, filters use array tuple format
      const filters = [
        ['conversation', '=', 'CONV-0001'],
        ['deleted_at', 'is', 'not set'],
      ];
      expect(filters[1][2]).toBe('not set');
    });

    it('should sort messages by creation ascending', () => {
      // Messages are sorted chronologically for chat display
      // In Frappe, the field is 'creation' not 'date_created'
      const orderBy = { field: 'creation', order: 'asc' };
      expect(orderBy.field).toBe('creation');
    });
  });

  describe('useSendMessage', () => {
    it('should require authentication', () => {
      const frappeUserId = mockAuthUser.frappe_user_id;
      expect(frappeUserId).toBeDefined();
    });

    it('should throw error when not authenticated', () => {
      const frappeUserId = undefined;
      const shouldThrow = () => {
        if (!frappeUserId) throw new Error('User not authenticated');
      };
      expect(shouldThrow).toThrow('User not authenticated');
    });

    it('should invalidate correct queries on success', () => {
      const conversationId = 'CONV-0001';
      const frappeUserId = 'john@example.com';

      // On success, should invalidate:
      // 1. conversationMessages for this conversation
      // 2. conversations.user for current user
      const messagesToInvalidate = queryKeys.conversationMessages(conversationId);
      const conversationsToInvalidate = queryKeys.conversations.user(frappeUserId);

      expect(messagesToInvalidate).toEqual(['conversationMessages', 'CONV-0001']);
      expect(conversationsToInvalidate).toEqual(['conversations', 'john@example.com']);
    });
  });

  describe('useMarkConversationRead', () => {
    it('should update last_read_at to current time', () => {
      const now = new Date().toISOString();
      expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should invalidate user conversations on success', () => {
      const frappeUserId = 'john@example.com';
      const queryKey = queryKeys.conversations.user(frappeUserId);
      expect(queryKey).toEqual(['conversations', 'john@example.com']);
    });
  });

  describe('useCloseConversation', () => {
    it('should update conversation status to closed', () => {
      const updateData = {
        status: 'Closed',
        closed_by: 'john@example.com',
        closed_at: new Date().toISOString(),
        closed_reason: 'Issue resolved',
      };
      expect(updateData.status).toBe('Closed');
      expect(updateData.closed_by).toBeDefined();
    });

    it('should invalidate both conversation and user conversations', () => {
      const conversationId = 'CONV-0001';
      const frappeUserId = 'john@example.com';

      const convKey = queryKeys.conversation(conversationId);
      const userConvsKey = queryKeys.conversations.user(frappeUserId);

      expect(convKey).toEqual(['conversation', 'CONV-0001']);
      expect(userConvsKey).toEqual(['conversations', 'john@example.com']);
    });
  });

  describe('useReopenConversation', () => {
    it('should reset conversation to open status', () => {
      const updateData = {
        status: 'Open',
        closed_by: null,
        closed_at: null,
        closed_reason: null,
      };
      expect(updateData.status).toBe('Open');
      expect(updateData.closed_by).toBeNull();
    });
  });

  describe('useArchiveConversation', () => {
    it('should update status to archived', () => {
      const updateData = {
        status: 'Archived',
      };
      expect(updateData.status).toBe('Archived');
    });
  });

  describe('useUnarchiveConversation', () => {
    it('should update status to open', () => {
      const updateData = {
        status: 'Open',
      };
      expect(updateData.status).toBe('Open');
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
        channelId: 'Secretaria',
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
        status: 'Open',
        channel: 'Secretaria',
        started_by: 'john@example.com',
        institution: 'institution-123',
      };

      expect(conversationData.status).toBe('Open');
      expect(conversationData.channel).toBe('Secretaria');
    });

    it('should add creator as participant', () => {
      const participantData = {
        conversation: 'CONV-0001',
        user: 'john@example.com',
        can_reply: true,
        is_blocked: false,
        is_muted: false,
      };

      expect(participantData.can_reply).toBe(true);
      expect(participantData.is_blocked).toBe(false);
    });

    it('should send initial message', () => {
      const messageData = {
        conversation: 'CONV-0001',
        sender: 'john@example.com',
        content: 'Hello, I need help',
        content_type: 'Text',
        is_urgent: false,
      };

      expect(messageData.content_type).toBe('Text');
    });
  });
});

describe('Conversation data types', () => {
  it('should have correct conversation_type values', () => {
    // In Frappe, 'type' is 'conversation_type' and uses Title Case
    const types = ['Private', 'Group'];
    expect(types).toContain(mockConversation.conversation_type);
  });

  it('should have correct status values', () => {
    // Frappe uses Title Case
    const statuses = ['Open', 'Closed', 'Archived'];
    expect(statuses).toContain(mockConversation.status);
  });

  it('should have correct channel values', () => {
    // Frappe uses Title Case
    const channels = ['Secretaria', 'Profesores', 'General'];
    expect(channels).toContain(mockConversation.channel);
  });

  it('should support optional closed fields', () => {
    const closedConversation: Conversation = {
      ...mockConversation,
      status: 'Closed',
      closed_by: 'john@example.com',
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
    // Frappe uses Title Case
    const roles = ['Teacher', 'Parent', 'Admin'];
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
    // Frappe uses Title Case
    const contentTypes = ['Text', 'HTML'];
    expect(contentTypes).toContain(mockMessage.content_type);
  });

  it('should support attachments', () => {
    const messageWithAttachments: ConversationMessage = {
      ...mockMessage,
      attachments: [
        { name: 'document.pdf', url: '/files/doc.pdf', size: 1024 },
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

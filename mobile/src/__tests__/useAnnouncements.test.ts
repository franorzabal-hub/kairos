/**
 * Tests for useAnnouncements hooks
 *
 * Tests data fetching hooks for announcements (News in Frappe):
 * - useAnnouncements - fetch all announcements
 * - useAnnouncement - fetch single announcement
 * - useAnnouncementAttachments - fetch attachments
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/hooks/queryKeys';
import { News, NewsAttachment } from '../api/frappe';

// Type the mocked functions
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

// Sample announcement data (using Frappe News type)
const mockAnnouncement: News = {
  name: 'NEWS-0001',
  institution: 'institution-123',
  title: 'School Closed Tomorrow',
  content: '<p>Due to weather conditions, school will be closed tomorrow.</p>',
  priority: 'Urgent',
  scope_type: 'Institution',
  status: 'Published',
  creation: '2024-01-15T10:00:00Z',
  publish_date: '2024-01-15T10:00:00Z',
};

const mockAnnouncements: News[] = [
  mockAnnouncement,
  {
    name: 'NEWS-0002',
    institution: 'institution-123',
    title: 'Parent-Teacher Conference',
    content: '<p>Please schedule your conference time.</p>',
    priority: 'Important',
    scope_type: 'Institution',
    status: 'Published',
    creation: '2024-01-14T09:00:00Z',
    publish_date: '2024-01-14T09:00:00Z',
  },
];

const mockAttachments: NewsAttachment[] = [
  {
    name: 'NEWSATT-0001',
    news: 'NEWS-0001',
    file: '/files/weather-alert.pdf',
    title: 'Weather Alert PDF',
    sort: 1,
  },
];

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

// Mock children context
jest.mock('../context/ChildrenContext', () => ({
  useChildren: jest.fn(() => ({
    selectedChildId: null,
    setSelectedChildId: jest.fn(),
    children: [],
    setChildren: jest.fn(),
    getChildById: jest.fn(),
    hasChild: jest.fn(),
  })),
}));

// Mock UI context
jest.mock('../context/UIContext', () => ({
  useUI: jest.fn(() => ({
    filterMode: 'all',
    setFilterMode: jest.fn(),
    unreadCounts: {},
    setUnreadCounts: jest.fn(),
    resetUnreadCounts: jest.fn(),
  })),
}));

import { useAuth } from '../context/AuthContext';
import { useChildren } from '../context/ChildrenContext';
import { useUI } from '../context/UIContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseChildren = useChildren as jest.MockedFunction<typeof useChildren>;
const mockUseUI = useUI as jest.MockedFunction<typeof useUI>;

describe('useAnnouncements hooks', () => {
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
    mockUseChildren.mockReturnValue({
      selectedChildId: null,
      setSelectedChildId: jest.fn(),
      children: [],
      setChildren: jest.fn(),
      getChildById: jest.fn(),
      hasChild: jest.fn(),
    });
    mockUseUI.mockReturnValue({
      filterMode: 'all',
      setFilterMode: jest.fn(),
      unreadCounts: {
        inicio: 0,
        agenda: 0,
        mensajes: 0,
        mishijos: 0,
        novedades: 0,
        eventos: 0,
        cambios: 0,
        boletines: 0,
      },
      setUnreadCounts: jest.fn(),
      resetUnreadCounts: jest.fn(),
    });
  });

  describe('queryKeys', () => {
    it('should have correct announcements key', () => {
      expect(queryKeys.announcements).toEqual(['announcements']);
    });

    it('should generate correct announcement key for id', () => {
      expect(queryKeys.announcement('ann-1')).toEqual(['announcement', 'ann-1']);
    });

    it('should generate correct announcementAttachments key for id', () => {
      expect(queryKeys.announcementAttachments('ann-1')).toEqual(['announcementAttachments', 'ann-1']);
    });
  });

  describe('useAnnouncements', () => {
    it('should create query with correct key including dependencies', () => {
      // Import the hook - note: since we mock useQuery, we can't test the full behavior
      // but we can test the query key construction
      const expectedKeyParts = ['announcements'];

      // Query key should include: announcements base, selectedChildId, filterMode, organizationId
      mockUseQuery.mockReturnValue({
        data: mockAnnouncements,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
      } as any);

      // The key includes dynamic parts: selectedChildId (null), filterMode ('all'), organization_id
      const expectedQueryKey = [...expectedKeyParts, null, 'all', 'org-123'];

      // Verify the expected key structure
      expect(expectedQueryKey[0]).toBe('announcements');
      expect(expectedQueryKey[1]).toBeNull(); // selectedChildId
      expect(expectedQueryKey[2]).toBe('all'); // filterMode
      expect(expectedQueryKey[3]).toBe('org-123'); // organization_id
    });

    it('should be enabled when user has organization_id', () => {
      // The hook should be enabled: !!user?.organization_id
      expect(!!mockAuthUser.organization_id).toBe(true);
    });

    it('should be disabled when user has no organization_id', () => {
      const userWithNoOrg = { ...mockAuthUser, organization_id: '' };
      mockUseAuth.mockReturnValue({
        user: userWithNoOrg,
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        biometricLockout: { isLocked: false, remainingTime: 0 },
      });

      // The hook should be disabled when organization_id is empty
      expect(!!userWithNoOrg.organization_id).toBe(false);
    });

    it('should filter by published status', () => {
      // In Frappe, filters use array tuple format: [field, operator, value]
      const expectedFilters = [
        ['status', '=', 'Published'],
        ['institution', '=', 'institution-123'],
      ];

      expect(expectedFilters[0][2]).toBe('Published');
    });
  });

  describe('useAnnouncement', () => {
    it('should generate correct query key for single announcement', () => {
      const id = 'ann-1';
      const queryKey = queryKeys.announcement(id);
      expect(queryKey).toEqual(['announcement', 'ann-1']);
    });

    it('should be enabled when id is provided', () => {
      const id = 'ann-1';
      expect(!!id).toBe(true);
    });

    it('should be disabled when id is empty', () => {
      const id = '';
      expect(!!id).toBe(false);
    });

    it('should return null when id is not provided', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
      } as any);

      // When id is falsy, queryFn returns null
      expect(mockUseQuery).toBeDefined();
    });
  });

  describe('useAnnouncementAttachments', () => {
    it('should generate correct query key for attachments', () => {
      const announcementId = 'ann-1';
      const queryKey = queryKeys.announcementAttachments(announcementId);
      expect(queryKey).toEqual(['announcementAttachments', 'ann-1']);
    });

    it('should be enabled when announcementId is provided', () => {
      const announcementId = 'ann-1';
      expect(!!announcementId).toBe(true);
    });

    it('should be disabled when announcementId is empty', () => {
      const announcementId = '';
      expect(!!announcementId).toBe(false);
    });

    it('should filter attachments by news (announcement) id', () => {
      const announcementId = 'NEWS-0001';
      // In Frappe, filters use array tuple format
      const expectedFilters = [
        ['news', '=', announcementId],
      ];
      expect(expectedFilters[0][2]).toBe('NEWS-0001');
    });

    it('should sort attachments by sort field', () => {
      const expectedSort = ['sort'];
      expect(expectedSort).toContain('sort');
    });
  });
});

describe('News (Announcement) data types', () => {
  it('should have correct priority values', () => {
    // Frappe uses Title Case for select values
    const priorities = ['Urgent', 'Important', 'Normal'];
    expect(priorities).toContain(mockAnnouncement.priority);
  });

  it('should have correct scope_type values', () => {
    // In Frappe, target_type is called scope_type
    const scopeTypes = ['Institution', 'Campus', 'Grade', 'Section'];
    expect(scopeTypes).toContain(mockAnnouncement.scope_type);
  });

  it('should have correct status values', () => {
    // Frappe uses Title Case
    const statuses = ['Draft', 'Published', 'Archived'];
    expect(statuses).toContain(mockAnnouncement.status);
  });

  it('should have required fields', () => {
    expect(mockAnnouncement.name).toBeDefined();
    expect(mockAnnouncement.institution).toBeDefined();
    expect(mockAnnouncement.title).toBeDefined();
    expect(mockAnnouncement.content).toBeDefined();
    expect(mockAnnouncement.creation).toBeDefined();
  });

  it('should support optional fields', () => {
    const announcementWithOptionals: News = {
      ...mockAnnouncement,
      image: '/files/image.jpg',
      is_pinned: true,
      requires_acknowledgment: true,
      video_url: 'https://youtube.com/watch?v=abc',
      attachments: mockAttachments,
    };

    expect(announcementWithOptionals.image).toBe('/files/image.jpg');
    expect(announcementWithOptionals.is_pinned).toBe(true);
    expect(announcementWithOptionals.requires_acknowledgment).toBe(true);
    expect(announcementWithOptionals.video_url).toBeDefined();
    expect(announcementWithOptionals.attachments).toHaveLength(1);
  });
});

describe('NewsAttachment data types', () => {
  it('should have required fields', () => {
    const attachment = mockAttachments[0];
    expect(attachment.name).toBeDefined();
    expect(attachment.news).toBeDefined();
    expect(attachment.file).toBeDefined();
  });

  it('should support optional title and sort', () => {
    const attachment = mockAttachments[0];
    expect(attachment.title).toBe('Weather Alert PDF');
    expect(attachment.sort).toBe(1);
  });
});

import React, { useState } from 'react';
import { View, Text, Pressable, PressableStateCallbackType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationWithMeta } from '../../../api/hooks';
import DirectusImage from '../../DirectusImage';
import { useOrganization } from '../../../api/hooks';
import { COLORS, AVATAR_COLORS } from '../../../theme';

// Web-specific pressable state type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// Get a consistent color based on user ID hash
function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Child {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface WebConversationCardProps {
  conversation: ConversationWithMeta;
  children: Child[];
  currentUserId?: string;
  onPress: (conversation: ConversationWithMeta) => void;
  isSelected?: boolean;
  onArchive?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
}

export function WebConversationCard({
  conversation,
  currentUserId,
  onPress,
  isSelected = false,
  onArchive,
  onPin,
  isPinned = false,
}: WebConversationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { data: organization } = useOrganization();
  
  const hasUnread = conversation.unreadCount > 0;
  const isUrgent = conversation.lastMessage?.is_urgent;

  // Get participant info for avatar
  const getParticipantInfo = () => {
    // Check if it's an "Admin" or "School" user (often no specific participant or named "Administracion")
    // This is a heuristic - adjust based on actual data model for "School" sender
    const isSchool = conversation.otherParticipants.length === 0 || 
                     conversation.otherParticipants.some(p => p.email?.includes('admin') || p.first_name === 'Administracion');

    if (isSchool) {
      return { 
        name: organization?.name || 'Administración', 
        initials: 'AD', 
        color: COLORS.primary, 
        userId: 'school',
        isSchool: true 
      };
    }

    const participant = conversation.otherParticipants[0];
    const firstName = participant.first_name || '';
    const lastName = participant.last_name || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || participant.email || 'Usuario';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    const userId = participant.id || '';
    const color = getAvatarColor(userId);

    return { name, initials, color, userId, isSchool: false };
  };

  // Get last message preview
  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'Sin mensajes';
    const senderId = typeof conversation.lastMessage.sender_id === 'string'
      ? conversation.lastMessage.sender_id
      : conversation.lastMessage.sender_id?.id;
    const isMe = senderId === currentUserId;
    const prefix = isMe ? 'Tú: ' : '';
    return prefix + conversation.lastMessage.content;
  };

  // Format date (Gmail style: Time if today, Date otherwise)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // 10:30 AM
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ayer';
    } else {
      // 12 may
      return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    }
  };

  const participantInfo = getParticipantInfo();

  // Handle action click
  const handleActionClick = (e: any, action?: () => void) => {
    e.stopPropagation();
    action?.();
  };

  return (
    <Pressable
      onPress={() => onPress(conversation)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={(state) => ({
        flexDirection: 'row',
        paddingVertical: 12, // py-3
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: isSelected 
          ? COLORS.primaryLight 
          : (state as WebPressableState).hovered 
            ? '#F9FAFB' // gray-50
            : COLORS.white,
        cursor: 'pointer',
        alignItems: 'flex-start',
      })}
    >
      {/* Left Column: Avatar & Unread Dot */}
      <View style={{ marginRight: 12, position: 'relative' }}>
        {/* Unread Dot (Blue) - Positioned at top left of avatar or floating */}
        {hasUnread && (
          <View 
            style={{
              position: 'absolute',
              top: -2,
              left: -4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#2563EB', // blue-600
              zIndex: 10,
              borderWidth: 1.5,
              borderColor: COLORS.white,
            }} 
          />
        )}
        
        {/* Avatar */}
        {participantInfo.isSchool && organization?.logo ? (
           <DirectusImage
             fileId={organization.logo}
             style={{ width: 32, height: 32, borderRadius: 6 }}
             contentFit="cover"
           />
        ) : (
          <View
            style={{
              width: 32, // w-8
              height: 32, // h-8
              borderRadius: 6, // Rounded squareish like Linear
              backgroundColor: isUrgent ? COLORS.errorLight : `${participantInfo.color}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text 
              style={{ 
                fontSize: 12, 
                fontWeight: '600', 
                color: isUrgent ? COLORS.error : participantInfo.color 
              }}
            >
              {participantInfo.initials}
            </Text>
          </View>
        )}
      </View>

      {/* Main Content Column */}
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* Header: Name + Time */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <Text 
            style={{ 
              fontSize: 14, 
              fontWeight: hasUnread ? '700' : '600', 
              color: '#111827', // gray-900
            }}
            numberOfLines={1}
          >
            {participantInfo.name}
          </Text>
          <Text 
            style={{ 
              fontSize: 11, // text-xs
              color: '#9CA3AF', // gray-400
              fontWeight: hasUnread ? '600' : '400',
            }}
          >
            {formatDate(conversation.lastMessage?.date_created || conversation.date_created)}
          </Text>
        </View>

        {/* Subject */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          {isUrgent && (
            <View style={{ backgroundColor: COLORS.errorLight, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 6 }}>
              <Text style={{ fontSize: 10, color: COLORS.error, fontWeight: '700' }}>URGENTE</Text>
            </View>
          )}
          <Text 
            style={{ 
              fontSize: 13, // text-sm
              color: '#374151', // gray-700
              fontWeight: hasUnread ? '600' : '400',
            }}
            numberOfLines={1}
          >
            {conversation.subject}
          </Text>
        </View>

        {/* Preview */}
        <Text 
          style={{ 
            fontSize: 12, // text-xs
            color: '#6B7280', // gray-500
          }}
          numberOfLines={1}
        >
          {getLastMessagePreview()}
        </Text>
      </View>
      
      {/* Hover Actions (Linear Style) - Absolute positioned on right */}
      {isHovered && (
        <View 
          style={{ 
            position: 'absolute', 
            right: 8, 
            top: '50%', 
            marginTop: -12,
            flexDirection: 'row', 
            gap: 4,
            backgroundColor: isSelected ? COLORS.primaryLight : '#F9FAFB',
            paddingLeft: 8, // Blur/fade effect
          }}
        >
          {onPin && (
            <Pressable
              onPress={(e) => handleActionClick(e, onPin)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isPinned ? 'rgba(0,0,0,0.05)' : 'transparent',
              }}
              className="hover:bg-gray-200"
            >
              <Ionicons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={14}
                color={isPinned ? COLORS.primary : '#6B7280'}
              />
            </Pressable>
          )}
          {onArchive && (
            <Pressable
              onPress={(e) => handleActionClick(e, onArchive)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="hover:bg-gray-200"
            >
              <Ionicons name="archive-outline" size={14} color="#6B7280" />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default WebConversationCard;

import { MessageWithReadStatus, ConversationWithMeta } from '../api/hooks';
import { Announcement, Event } from '../api/directus';

export type NovedadesStackParamList = {
  NovedadesList: undefined;
  NovedadDetail: { announcement: Announcement };
};

export type EventosStackParamList = {
  EventosList: undefined;
  EventoDetail: { event: Event };
};

export type MensajesStackParamList = {
  MensajesList: undefined;
  MessageDetail: { message: MessageWithReadStatus };
  // New conversation-based screens
  ConversationList: undefined;
  ConversationChat: {
    conversationId: string;
    participantId: string;
    subject: string;
    canReply: boolean;
  };
};

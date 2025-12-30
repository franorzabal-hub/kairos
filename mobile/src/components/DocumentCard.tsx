/**
 * DocumentCard Component
 *
 * Generic card for displaying non-PDF attachments
 * (documents, videos, audio, etc.)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Attachment } from '../api/directus';
import { useDirectusAsset } from '../hooks/useDirectusAsset';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

interface DocumentCardProps {
  attachment: Attachment;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function DocumentCard({
  attachment,
  icon = 'document',
  iconColor = COLORS.primary,
}: DocumentCardProps) {
  const { url } = useDirectusAsset(attachment.file_id);

  const fileName = attachment.title ||
    attachment.file?.filename_download ||
    'Documento';

  const fileSize = attachment.file?.filesize
    ? formatFileSize(attachment.file.filesize)
    : null;

  const handleOpen = () => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleShare = async () => {
    if (url) {
      try {
        await Share.share({
          url,
          title: fileName,
        });
      } catch (error) {
        console.error('Error sharing document:', error);
      }
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleOpen}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>
          {fileName}
        </Text>
        {fileSize && (
          <Text style={styles.fileSize}>{fileSize}</Text>
        )}
      </View>
      <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
        <Ionicons name="share-outline" size={20} color={COLORS.gray} />
      </TouchableOpacity>
      <Ionicons name="download-outline" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    borderRadius: BORDERS.radius.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDERS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  info: {
    flex: 1,
  },
  fileName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  fileSize: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  actionButton: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
});

export default DocumentCard;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnnouncementAttachment } from '../api/directus';
import { useDirectusAsset, getDirectusAssetUrl } from '../hooks/useDirectusAsset';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

interface AttachmentsListProps {
  attachments: AnnouncementAttachment[];
}

// File metadata type from directus_files
interface DirectusFile {
  id: string;
  filename_download: string;
  title?: string;
  type: string;
  filesize: number;
}

// Get icon based on file type
function getFileIcon(mimeType: string): { name: keyof typeof MaterialCommunityIcons.glyphMap; color: string } {
  if (mimeType.startsWith('image/')) {
    return { name: 'image', color: '#4CAF50' };
  }
  if (mimeType === 'application/pdf') {
    return { name: 'file-pdf-box', color: '#E53935' };
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return { name: 'file-word', color: '#2196F3' };
  }
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return { name: 'file-excel', color: '#4CAF50' };
  }
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return { name: 'file-powerpoint', color: '#FF9800' };
  }
  return { name: 'file-document', color: COLORS.gray };
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Individual attachment item
function AttachmentItem({ attachment }: { attachment: AnnouncementAttachment }) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // The file field should contain the populated directus_files data
  const fileData = attachment.file as unknown as DirectusFile | string;
  const fileId = typeof fileData === 'string' ? fileData : fileData?.id;
  const fileName = typeof fileData === 'object' ? (fileData.filename_download || fileData.title || 'Archivo') : 'Archivo';
  const mimeType = typeof fileData === 'object' ? fileData.type : 'application/octet-stream';
  const fileSize = typeof fileData === 'object' ? fileData.filesize : 0;

  const displayTitle = attachment.title || fileName;
  const icon = getFileIcon(mimeType);
  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');

  const handlePress = async () => {
    if (!fileId) return;

    setIsLoadingUrl(true);
    try {
      const url = await getDirectusAssetUrl(fileId);

      if (isPdf) {
        // Open PDF in preview modal
        setPreviewUrl(url);
        setShowPreview(true);
      } else if (isImage) {
        // For images, just open in browser/viewer
        await Linking.openURL(url);
      } else {
        // For other files, prompt to download
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el archivo');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleDownload = async () => {
    if (!fileId) return;

    try {
      const url = await getDirectusAssetUrl(fileId);
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'No se pudo descargar el archivo');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.attachmentItem}
        onPress={handlePress}
        disabled={isLoadingUrl}
      >
        <View style={[styles.fileIcon, { backgroundColor: `${icon.color}15` }]}>
          <MaterialCommunityIcons name={icon.name} size={24} color={icon.color} />
        </View>

        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>{displayTitle}</Text>
          {fileSize > 0 && (
            <Text style={styles.fileSize}>{formatFileSize(fileSize)}</Text>
          )}
        </View>

        {isLoadingUrl ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="download-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* PDF Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <SafeAreaView style={styles.previewContainer} edges={['top']}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPreview(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
            <Text style={styles.previewTitle} numberOfLines={1}>{displayTitle}</Text>
            <TouchableOpacity
              style={styles.downloadButtonHeader}
              onPress={handleDownload}
            >
              <Ionicons name="download-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {previewUrl && (
            <WebView
              source={{ uri: previewUrl }}
              style={styles.webview}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

export default function AttachmentsList({ attachments }: AttachmentsListProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="attach" size={18} color={COLORS.gray} />
        <Text style={styles.headerText}>
          Archivos adjuntos ({attachments.length})
        </Text>
      </View>

      <View style={styles.list}>
        {attachments.map((attachment) => (
          <AttachmentItem key={attachment.id} attachment={attachment} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  headerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    fontWeight: '600',
  },
  list: {
    gap: SPACING.sm,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDERS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  fileSize: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Preview modal styles
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  previewTitle: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  downloadButtonHeader: {
    padding: SPACING.xs,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
});

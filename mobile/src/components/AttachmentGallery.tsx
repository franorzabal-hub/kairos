/**
 * AttachmentGallery Component
 *
 * Displays a list of attachments grouped by type:
 * - Images: Displayed as a horizontal gallery
 * - PDFs: Individual cards with preview option
 * - Videos: Video player cards
 * - Documents: Download cards
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Attachment } from '../api/directus';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import PDFCard from './PDFCard';
import DocumentCard from './DocumentCard';
import ImageGallery from './ImageGallery';

interface AttachmentGalleryProps {
  attachments: Attachment[];
}

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Group attachments by type
  const images = attachments.filter(a => a.file_type === 'image');
  const pdfs = attachments.filter(a => a.file_type === 'pdf');
  const videos = attachments.filter(a => a.file_type === 'video');
  const documents = attachments.filter(a => a.file_type === 'document');
  const audio = attachments.filter(a => a.file_type === 'audio');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="attach" size={18} color={COLORS.gray} />
        <Text style={styles.title}>
          Adjuntos ({attachments.length})
        </Text>
      </View>

      {/* Images Gallery */}
      {images.length > 0 && (
        <View style={styles.section}>
          <ImageGallery attachments={images} />
        </View>
      )}

      {/* PDFs */}
      {pdfs.length > 0 && (
        <View style={styles.section}>
          {pdfs.map(pdf => (
            <PDFCard key={pdf.id} attachment={pdf} />
          ))}
        </View>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <View style={styles.section}>
          {videos.map(video => (
            <DocumentCard
              key={video.id}
              attachment={video}
              icon="videocam"
              iconColor="#E91E63"
            />
          ))}
        </View>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <View style={styles.section}>
          {documents.map(doc => (
            <DocumentCard
              key={doc.id}
              attachment={doc}
              icon="document"
              iconColor="#2196F3"
            />
          ))}
        </View>
      )}

      {/* Audio */}
      {audio.length > 0 && (
        <View style={styles.section}>
          {audio.map(aud => (
            <DocumentCard
              key={aud.id}
              attachment={aud}
              icon="musical-notes"
              iconColor="#9C27B0"
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.gray,
  },
  section: {
    marginBottom: SPACING.md,
  },
});

export default AttachmentGallery;

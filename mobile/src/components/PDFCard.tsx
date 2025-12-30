/**
 * PDFCard Component
 *
 * Displays a PDF attachment with preview capability.
 * Opens the PDF in a modal WebView or external app.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Attachment } from '../api/directus';
import { useDirectusAsset } from '../hooks/useDirectusAsset';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

interface PDFCardProps {
  attachment: Attachment;
}

export function PDFCard({ attachment }: PDFCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { url: pdfUrl } = useDirectusAsset(attachment.file_id);

  const fileName = attachment.title ||
    attachment.file?.filename_download ||
    'Documento PDF';

  const handleOpen = () => {
    if (Platform.OS === 'ios') {
      // iOS can preview PDFs in WebView
      setShowModal(true);
    } else {
      // Android: open in external app
      if (pdfUrl) {
        Linking.openURL(pdfUrl);
      }
    }
  };

  const handleShare = async () => {
    if (pdfUrl) {
      try {
        await Share.share({
          url: pdfUrl,
          title: fileName,
        });
      } catch (error) {
        console.error('Error sharing PDF:', error);
      }
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={handleOpen}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={styles.hint}>Toca para ver</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={COLORS.gray} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      {/* PDF Preview Modal (iOS) */}
      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {fileName}
            </Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {pdfUrl && (
            <WebView
              source={{ uri: pdfUrl }}
              style={styles.webview}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              startInLoadingState={true}
              scalesPageToFit={true}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
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
    backgroundColor: COLORS.primaryLight,
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
  hint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  actionButton: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
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
  modalTitle: {
    flex: 1,
    ...TYPOGRAPHY.subtitle,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  shareButton: {
    padding: SPACING.xs,
  },
  webview: {
    flex: 1,
  },
});

export default PDFCard;

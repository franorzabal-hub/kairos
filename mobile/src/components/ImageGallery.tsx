/**
 * ImageGallery Component
 *
 * Displays a horizontal scrollable gallery of images.
 * Tapping an image opens it in a full-screen modal.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Attachment } from '../api/directus';
import DirectusImage from './DirectusImage';
import { COLORS, SPACING, BORDERS } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THUMBNAIL_SIZE = 100;

interface ImageGalleryProps {
  attachments: Attachment[];
}

export function ImageGallery({ attachments }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleImagePress = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < attachments.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <>
      {/* Thumbnail Gallery */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryContainer}
      >
        {attachments.map((attachment, index) => (
          <TouchableOpacity
            key={attachment.id}
            style={styles.thumbnail}
            onPress={() => handleImagePress(index)}
          >
            <DirectusImage
              fileId={attachment.file_id}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
            {attachments.length > 1 && index === 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{attachments.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Full Screen Modal */}
      <Modal
        visible={selectedIndex !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.imageCounter}>
              {selectedIndex !== null ? `${selectedIndex + 1} / ${attachments.length}` : ''}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Image */}
          <View style={styles.imageContainer}>
            {selectedIndex !== null && (
              <DirectusImage
                fileId={attachments[selectedIndex].file_id}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Navigation */}
          {attachments.length > 1 && (
            <View style={styles.navigation}>
              <TouchableOpacity
                onPress={handlePrevious}
                style={[
                  styles.navButton,
                  selectedIndex === 0 && styles.navButtonDisabled,
                ]}
                disabled={selectedIndex === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={32}
                  color={selectedIndex === 0 ? COLORS.gray : COLORS.white}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                style={[
                  styles.navButton,
                  selectedIndex === attachments.length - 1 && styles.navButtonDisabled,
                ]}
                disabled={selectedIndex === attachments.length - 1}
              >
                <Ionicons
                  name="chevron-forward"
                  size={32}
                  color={
                    selectedIndex === attachments.length - 1
                      ? COLORS.gray
                      : COLORS.white
                  }
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Caption */}
          {selectedIndex !== null && attachments[selectedIndex].title && (
            <View style={styles.captionContainer}>
              <Text style={styles.caption}>
                {attachments[selectedIndex].title}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  galleryContainer: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: BORDERS.radius.md,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  countBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BORDERS.radius.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  countText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  imageCounter: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  navButton: {
    padding: SPACING.md,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  captionContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  caption: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ImageGallery;

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CachedImage from './CachedImage';
import { COLORS, SPACING, BORDERS } from '../theme';

interface VideoEmbedProps {
  url: string;
  title?: string;
}

// Extract video ID and platform from URL
function parseVideoUrl(url: string): { platform: 'youtube' | 'vimeo' | 'unknown'; videoId: string | null } {
  // YouTube formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return { platform: 'youtube', videoId: youtubeMatch[1] };
  }

  // Vimeo formats:
  // - https://vimeo.com/VIDEO_ID
  // - https://player.vimeo.com/video/VIDEO_ID
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return { platform: 'vimeo', videoId: vimeoMatch[1] };
  }

  return { platform: 'unknown', videoId: null };
}

// Get embed URL for the platform
function getEmbedUrl(platform: 'youtube' | 'vimeo' | 'unknown', videoId: string | null): string | null {
  if (!videoId) return null;

  switch (platform) {
    case 'youtube':
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${videoId}`;
    default:
      return null;
  }
}

// Get thumbnail URL for the platform
function getThumbnailUrl(platform: 'youtube' | 'vimeo' | 'unknown', videoId: string | null): string | null {
  if (!videoId) return null;

  switch (platform) {
    case 'youtube':
      // YouTube high-quality thumbnail
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    case 'vimeo':
      // Vimeo thumbnails require API call, so we'll just show a placeholder
      return null;
    default:
      return null;
  }
}

export default function VideoEmbed({ url, title }: VideoEmbedProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { width } = useWindowDimensions();

  const { platform, videoId } = useMemo(() => parseVideoUrl(url), [url]);
  const embedUrl = useMemo(() => getEmbedUrl(platform, videoId), [platform, videoId]);
  const thumbnailUrl = useMemo(() => getThumbnailUrl(platform, videoId), [platform, videoId]);

  // Calculate aspect ratio (16:9)
  const inlineHeight = (width - SPACING.screenPadding * 2) * (9 / 16);
  const fullscreenHeight = width * (9 / 16);

  if (!embedUrl) {
    return null;
  }

  const platformLabel = platform === 'youtube' ? 'YouTube' : platform === 'vimeo' ? 'Vimeo' : 'Video';

  return (
    <>
      {/* Inline video thumbnail/player */}
      <TouchableOpacity
        style={[styles.container, { height: inlineHeight }]}
        onPress={() => setShowPlayer(true)}
        activeOpacity={0.9}
      >
        {thumbnailUrl ? (
          <View style={styles.thumbnailContainer}>
            <CachedImage
              uri={thumbnailUrl}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>
        ) : (
          <View style={styles.placeholderBackground}>
            <Ionicons
              name={platform === 'youtube' ? 'logo-youtube' : 'play-circle'}
              size={64}
              color={platform === 'youtube' ? '#FF0000' : '#1AB7EA'}
            />
            <Text style={styles.platformLabel}>{platformLabel}</Text>
          </View>
        )}

        {/* Play button overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={32} color={COLORS.white} />
          </View>
        </View>

        {/* Video label */}
        <View style={styles.videoLabel}>
          <Ionicons name="videocam" size={14} color={COLORS.white} />
          <Text style={styles.videoLabelText}>
            {title || 'Ver video'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Fullscreen player modal */}
      <Modal
        visible={showPlayer}
        animationType="slide"
        onRequestClose={() => setShowPlayer(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPlayer(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {title || 'Video'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.playerContainer, { height: fullscreenHeight }]}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
            <WebView
              source={{ uri: embedUrl }}
              style={styles.webview}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
            />
          </View>

          <View style={styles.modalInfo}>
            <Text style={styles.platformInfo}>
              <Ionicons
                name={platform === 'youtube' ? 'logo-youtube' : 'logo-vimeo'}
                size={16}
                color={platform === 'youtube' ? '#FF0000' : '#1AB7EA'}
              />
              {' '}{platformLabel}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    borderRadius: BORDERS.radius.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.darkGray,
  },
  thumbnailContainer: {
    flex: 1,
  },
  placeholderBackground: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformLabel: {
    color: COLORS.white,
    fontSize: 14,
    marginTop: SPACING.sm,
    opacity: 0.8,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4, // Visual centering for play icon
  },
  videoLabel: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDERS.radius.sm,
    gap: SPACING.xs,
  },
  videoLabelText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: SPACING.md,
    color: COLORS.darkGray,
  },
  headerSpacer: {
    width: 32,
  },
  playerContainer: {
    width: '100%',
    backgroundColor: COLORS.black,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    zIndex: 1,
  },
  modalInfo: {
    flex: 1,
    backgroundColor: COLORS.black,
    padding: SPACING.lg,
  },
  platformInfo: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },
});

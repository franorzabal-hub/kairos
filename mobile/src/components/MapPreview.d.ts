/**
 * Type declaration for MapPreview platform-specific components
 *
 * Metro bundler resolves MapPreview.native.tsx or MapPreview.web.tsx at runtime
 * This declaration file allows TypeScript to resolve the module statically
 */
import { StyleProp, ViewStyle } from 'react-native';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

declare const MapPreview: React.FC<MapPreviewProps>;
export default MapPreview;

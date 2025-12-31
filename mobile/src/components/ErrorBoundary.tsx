import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors in its child component tree.
 * Displays a fallback UI instead of crashing the entire app.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourScreen />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
            </View>
            <Text style={styles.title}>Algo salió mal</Text>
            <Text style={styles.message}>
              Ocurrió un error inesperado. Por favor, intenta de nuevo.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.devInfo}>
                <Text style={styles.devTitle}>Debug Info:</Text>
                <Text style={styles.devMessage}>{this.state.error.message}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.screenPadding,
  },
  content: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.xxl,
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  devInfo: {
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDERS.radius.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  devTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  devMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.darkGray,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDERS.radius.md,
    gap: SPACING.sm,
  },
  retryText: {
    ...TYPOGRAPHY.listItemTitle,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default ErrorBoundary;

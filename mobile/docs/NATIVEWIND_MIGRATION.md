# NativeWind Migration Guide

This document provides guidance for migrating components from `StyleSheet.create()` to NativeWind (Tailwind CSS) in the Kairos mobile app.

## Current Status

NativeWind is **fully configured** and ready to use:

- **NativeWind**: v4.2.1
- **Tailwind CSS**: v3.4.19
- **Expo SDK**: 54 (compatible)

### Configuration Files

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Tailwind configuration with custom theme colors |
| `babel.config.js` | Babel preset includes `nativewind/babel` |
| `global.css` | CSS entry point with Tailwind directives |
| `nativewind-env.d.ts` | TypeScript type definitions |
| `app/_layout.tsx` | Imports `global.css` at app entry |

## Theme Color Mapping

Custom colors are defined in `tailwind.config.js` and map to the existing theme:

| Theme Constant | Tailwind Class | Value |
|----------------|----------------|-------|
| `COLORS.primary` | `bg-primary`, `text-primary` | #8B1538 |
| `COLORS.primaryLight` | `bg-primaryLight` | #F5E6EA |
| `COLORS.gray` | `text-gray`, `bg-gray` | #666666 |
| `COLORS.lightGray` | `bg-lightGray` | #F5F5F5 |
| `COLORS.darkGray` | `text-darkGray` | #333333 |
| `COLORS.border` | `border-border` | #E0E0E0 |
| `COLORS.success` | `text-success`, `bg-success` | #4CAF50 |
| `COLORS.warning` | `text-warning`, `bg-warning` | #FF9800 |
| `COLORS.error` | `text-error`, `bg-error` | #F44336 |
| `COLORS.info` | `text-info`, `bg-info` | #2196F3 |
| `COLORS.pillBackground` | `bg-pillBackground` | #F2F2F7 |
| `COLORS.pillActive` | `bg-pillActive` | #007AFF |

## Migration Examples

### Before (StyleSheet)

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';

function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white,
  },
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
});
```

### After (NativeWind)

```typescript
import { View, Text } from 'react-native';

function MyComponent() {
  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-xl font-bold text-darkGray mb-2">Hello</Text>
    </View>
  );
}
```

## Common Style Mappings

### Layout

| StyleSheet | Tailwind |
|------------|----------|
| `flex: 1` | `flex-1` |
| `flexDirection: 'row'` | `flex-row` |
| `alignItems: 'center'` | `items-center` |
| `justifyContent: 'center'` | `justify-center` |
| `justifyContent: 'space-between'` | `justify-between` |

### Spacing

| StyleSheet | Tailwind |
|------------|----------|
| `padding: 4` | `p-1` |
| `padding: 8` | `p-2` |
| `padding: 12` | `p-3` |
| `padding: 16` | `p-4` |
| `paddingHorizontal: 16` | `px-4` |
| `paddingVertical: 8` | `py-2` |
| `margin: 16` | `m-4` |
| `marginBottom: 8` | `mb-2` |
| `gap: 8` | `gap-2` |

### Typography

| StyleSheet | Tailwind |
|------------|----------|
| `fontSize: 12` | `text-xs` |
| `fontSize: 14` | `text-sm` |
| `fontSize: 16` | `text-base` |
| `fontSize: 18` | `text-lg` |
| `fontSize: 20` | `text-xl` |
| `fontWeight: '400'` | `font-normal` |
| `fontWeight: '500'` | `font-medium` |
| `fontWeight: '600'` | `font-semibold` |
| `fontWeight: '700'` | `font-bold` |

### Border Radius

| StyleSheet | Tailwind |
|------------|----------|
| `borderRadius: 4` | `rounded` |
| `borderRadius: 8` | `rounded-lg` |
| `borderRadius: 12` | `rounded-xl` |
| `borderRadius: 16` | `rounded-2xl` |
| `borderRadius: 9999` | `rounded-full` |

### Shadows

NativeWind supports shadows on iOS/Android:

```typescript
<View className="shadow-sm" />   // Small shadow
<View className="shadow-md" />   // Medium shadow
<View className="shadow-lg" />   // Large shadow
```

## Migration Strategy

### Phase 1: New Components (Current)

All new components should use NativeWind classes instead of StyleSheet.

### Phase 2: Simple Components

Migrate simple, self-contained components first:
- `DateSeparator` - DONE
- `QuickAccess` - DONE
- `LockedFeature` - DONE
- Other candidates: `Toast`, `ErrorBoundary`

### Phase 3: Complex Components

Components with conditional styling or dynamic colors may need a hybrid approach:

```typescript
// Hybrid approach for dynamic colors
<View
  className="flex-1 p-4 rounded-xl"
  style={{ borderLeftColor: childColor, borderLeftWidth: 4 }}
>
```

### Phase 4: Screens

Migrate screens last, after components are stable.

## Best Practices

### 1. Keep COLORS import for dynamic values

When you need runtime color values (e.g., for icons), keep using the COLORS constant:

```typescript
import { COLORS } from '../theme';

<Ionicons name="lock-closed" size={32} color={COLORS.gray} />
```

### 2. Use `style` prop for complex values

Some styles cannot be expressed in Tailwind (e.g., percentage widths, dynamic values):

```typescript
<ScrollView
  horizontal
  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
>
```

### 3. Avoid inline style arrays

Prefer:
```typescript
<View className="flex-1 bg-white p-4" />
```

Over:
```typescript
<View style={[styles.container, isActive && styles.active]} />
```

Use conditional classes instead:
```typescript
<View className={`flex-1 bg-white p-4 ${isActive ? 'bg-primary' : ''}`} />
```

### 4. Document complex components

Add a migration note to components that have been converted:

```typescript
/**
 * MyComponent - Description
 *
 * Migrated to NativeWind (Tailwind CSS) for styling consistency.
 * Uses custom theme colors defined in tailwind.config.js.
 */
```

## Components Migrated

| Component | File | Status |
|-----------|------|--------|
| DateSeparator | `src/components/chat/DateSeparator.tsx` | Done |
| QuickAccess | `src/components/QuickAccess.tsx` | Done |
| LockedFeature | `src/components/LockedFeature.tsx` | Done |
| LockedSection | `src/components/LockedFeature.tsx` | Done |

## Components Pending (37 files)

Run this to see all files with StyleSheet.create:

```bash
grep -r "StyleSheet.create" mobile/src --include="*.tsx" -l
```

Priority order:
1. Small, simple components (Chat components, badges)
2. UI components (Cards, buttons)
3. Complex components (Forms, modals)
4. Screens (Last)

## Resources

- [NativeWind Documentation](https://www.nativewind.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NativeWind v4 Migration Guide](https://www.nativewind.dev/v4/guides/migration)

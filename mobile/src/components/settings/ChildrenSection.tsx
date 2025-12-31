import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

interface Child {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface ChildrenSectionProps {
  children: Child[];
}

const ChildrenSection = React.memo(({ children }: ChildrenSectionProps) => {
  if (children.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mis Hijos</Text>
      {children.map((child, index) => (
        <View
          key={child.id}
          style={[
            styles.childRow,
            index === children.length - 1 && styles.lastRow,
          ]}
        >
          <View style={styles.childAvatar}>
            <Text style={styles.childAvatarText}>
              {child.first_name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>
              {child.first_name} {child.last_name}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
});

ChildrenSection.displayName = 'ChildrenSection';

export default ChildrenSection;

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  childAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

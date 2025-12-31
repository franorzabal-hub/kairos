import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../theme';

interface WebQuickAccessProps {
  onReportAbsence?: () => void;
  onPickupChange?: () => void;
  onContactSchool?: () => void;
}

export function WebQuickActions({
  onReportAbsence,
  onPickupChange,
  onContactSchool
}: WebQuickAccessProps) {
  const router = useRouter();

  const actions = [
    {
      id: 'absence',
      label: 'Reportar Ausencia',
      icon: 'medical-outline',
      color: '#F97316', // Orange
      onPress: onReportAbsence,
    },
    {
      id: 'pickup',
      label: 'Cambio de Salida',
      icon: 'log-out-outline',
      color: '#10B981', // Green
      onPress: onPickupChange || (() => router.push('/mishijos')),
    },
    {
      id: 'contact',
      label: 'Contactar Colegio',
      icon: 'chatbubble-ellipses-outline',
      color: '#3B82F6', // Blue
      onPress: onContactSchool || (() => router.push('/mensajes')),
    },
  ];

  return (
    <View className="flex-row gap-4 mb-8">
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          onPress={action.onPress}
          className="flex-1 flex-row items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
          activeOpacity={0.8}
        >
          <View 
            className="w-10 h-10 rounded-lg items-center justify-center mr-3 group-hover:scale-110 transition-transform"
            style={{ backgroundColor: `${action.color}15` }}
          >
            <Ionicons name={action.icon as any} size={20} color={action.color} />
          </View>
          <View>
             <Text className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
               {action.label}
             </Text>
             <Text className="text-xs text-gray-500">
               Acceso directo
             </Text>
          </View>
          <View className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
             <Ionicons name="arrow-forward" size={16} color={COLORS.gray400} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default WebQuickActions;

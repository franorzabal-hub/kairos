import React from 'react';
import { View, Text } from 'react-native';
import { useOrganization } from '../../api/hooks';
import PermissionDebugPanel from '../PermissionDebugPanel';
import Constants from 'expo-constants';

export function WebFooter() {
  const { data: organization } = useOrganization();
  const version = Constants.expoConfig?.version || '1.0.0';

  return (
    <View 
      className="h-8 bg-slate-900 flex-row items-center justify-between px-3"
      style={{ zIndex: 50 }}
    >
      {/* Left: System Status */}
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-2">
           <View className="w-2 h-2 rounded-full bg-green-500" />
           <Text className="text-slate-400 text-xs font-medium">Conectado</Text>
        </View>
        <Text className="text-slate-600 text-xs">•</Text>
        <Text className="text-slate-500 text-xs">{organization?.name || 'Kairos'}</Text>
        <Text className="text-slate-600 text-xs">•</Text>
        <Text className="text-slate-500 text-xs">v{version}</Text>
      </View>

      {/* Right: Tools & Debug */}
      <View className="flex-row items-center gap-4">
        {/* Dev Mode Lock Button (Moved here) */}
        <PermissionDebugPanel mode="inline" />
      </View>
    </View>
  );
}

export default WebFooter;

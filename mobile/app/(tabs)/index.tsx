import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // Redirect to Inicio (Home) as the default tab
  return <Redirect href="/inicio" />;
}

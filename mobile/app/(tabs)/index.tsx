import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // Use path-based redirect (not route name)
  return <Redirect href="/novedades" />;
}

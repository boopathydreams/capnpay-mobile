import { Redirect } from 'expo-router';

// Redirect to the main tabs screen
export default function Index() {
return <Redirect href="/(tabs)" />;
}

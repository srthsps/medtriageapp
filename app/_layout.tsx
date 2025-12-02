import { ThemeContext, ThemeProvider } from '@/components/ThemeContext';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';

function AuthenticatedLayout() {
  const { isDark } = useContext(ThemeContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      setIsAuthenticated(true); // No FaceID available, skip lock
      setIsReady(true);
      return;
    }
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock MedTriage',
    });
    if (auth.success) setIsAuthenticated(true);
    setIsReady(true);
  };

  if (!isReady) {
    return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator /></View>;
  }

  if (!isAuthenticated) {
    return (
       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a237e' }}>
         <Text style={{ fontSize: 28, color: 'white', fontWeight: 'bold', marginBottom: 20 }}>MedTriage Secure</Text>
         <TouchableOpacity onPress={checkBiometrics} style={{backgroundColor: 'white', padding: 15, borderRadius: 30}}>
            <Text style={{color: '#1a237e', fontWeight: 'bold'}}>Authenticate</Text>
         </TouchableOpacity>
       </View>
    );
  }

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Details' }} />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
       <AuthenticatedLayout />
    </ThemeProvider>
  );
}
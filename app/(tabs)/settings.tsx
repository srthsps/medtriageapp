import { ThemeColors, ThemeContext } from '@/components/ThemeContext';
import React, { useContext } from 'react';
import { Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const theme = isDark ? ThemeColors.dark : ThemeColors.light;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: theme.primary, marginBottom: 20 }}>Settings</Text>

        <View style={{ backgroundColor: theme.card, padding: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Dark Mode</Text>
              <Text style={{ color: theme.subText, marginTop: 5 }}>Radiology lab mode</Text>
            </View>
            <Switch 
               value={isDark} 
               onValueChange={toggleTheme} 
               trackColor={{ false: '#767577', true: theme.tint }} 
               thumbColor={isDark ? "#fff" : "#f4f3f4"} 
            />
        </View>
      </View>
    </SafeAreaView>
  );
}
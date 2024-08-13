import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddCarScreen from './screens/AddCarScreen';
import ProfileScreen from './screens/ProfileScreen';
import CarDetailsScreen from './screens/CarDetailsScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Add Car') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen} />
      <Tab.Screen name="Add Car" component={AddCarScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CarDetails" component={CarDetailsScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: true }} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: true }} />
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ headerShown: true }} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
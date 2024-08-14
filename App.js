import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, Provider as PaperProvider, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolate, Extrapolate } from 'react-native-reanimated';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddCarScreen from './screens/AddCarScreen';
import ProfileScreen from './screens/ProfileScreen';
import CarDetailsScreen from './screens/CarDetailsScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
const theme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: '#000000',
    accent: '#ffffff',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AnimatedTabButton({ isFocused, onPress, iconName, label }) {
  const animatedValue = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    animatedValue.value = withSpring(isFocused ? 1 : 0);
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(animatedValue.value, [0, 1], [1, 1.2]);
    return {
      transform: [{ scale }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animatedValue.value, [0, 1], [0.6, 1], Extrapolate.CLAMP);
    return {
      opacity,
    };
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabButton}>
      <Animated.View style={animatedStyle}>
        <Icon name={iconName} size={24} color={isFocused ? '#000000' : '#757575'} />
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, textStyle, { color: isFocused ? '#000000' : '#757575' }]}>
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

function AnimatedAddButton({ onPress }) {
  const animatedValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(animatedValue.value, [0, 1], [1, 0.8]);
    const rotate = interpolate(animatedValue.value, [0, 1], [0, 45]);
    return {
      transform: [
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const onPressIn = () => {
    animatedValue.value = withSpring(1);
  };

  const onPressOut = () => {
    animatedValue.value = withSpring(0);
    onPress();
  };

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.addCarButton}
    >
      <Animated.View style={animatedStyle}>
        <Icon name="plus-circle" size={40} color="#000000" />
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === 'Add Car') {
          return (
            <AnimatedAddButton
              key={index}
              onPress={onPress}
            />
          );
        }

        let iconName;
        if (route.name === 'Dashboard') {
          iconName = isFocused ? 'view-dashboard' : 'view-dashboard-outline';
        } else if (route.name === 'Profile') {
          iconName = isFocused ? 'account' : 'account-outline';
        }

        return (
          <AnimatedTabButton
            key={index}
            isFocused={isFocused}
            onPress={onPress}
            iconName={iconName}
            label={label}
          />
        );
      })}
    </View>
  );
}
function MainTabs() {
  return (
    <Tab.Navigator style={{ backgroundColor: '#ffffff' }} tabBar={props => <CustomTabBar {...props} style={{ backgroundColor: '#ffffff' }} />}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Add Car" component={AddCarScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
export default function App() {
  return (
    <SafeAreaProvider >
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: '#ffffff' },
              headerTintColor: '#000000',
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CarDetails" component={CarDetailsScreen} />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ headerShown: true }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{ headerShown: true }}
            />
            <Stack.Screen
              name="PrivacySettings"
              component={PrivacySettingsScreen}
              options={{ headerShown: true }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#ffffff',
    // borderWidth: 1,
    borderColor: 'black',
    borderRadius: 15,
    marginVertical: 10,
    marginHorizontal: 15,
    marginBottom: 10,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  addCarButton: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -30,
    // marginTop: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
    elevation: 1,
  },
});

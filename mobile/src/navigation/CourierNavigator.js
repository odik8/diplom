import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../theme';

import DeliveriesScreen from '../screens/courier/DeliveriesScreen';
import DeliveryDetailScreen from '../screens/courier/DeliveryDetailScreen';
import CourierProfileScreen from '../screens/courier/CourierProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerOpts = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { color: colors.text },
};

function DeliveriesStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="Deliveries" component={DeliveriesScreen} options={{ title: 'Доставки' }} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} options={{ title: 'Детали доставки' }} />
    </Stack.Navigator>
  );
}

function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function CourierNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { borderTopColor: colors.border, paddingBottom: 4 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="DeliveriesTab" component={DeliveriesStack}
        options={{ title: 'Доставки', tabBarIcon: ({ focused }) => <TabIcon emoji="🛵" focused={focused} /> }}
      />
      <Tab.Screen
        name="CourierProfileTab" component={CourierProfileScreen}
        options={{ title: 'Профиль', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />, headerShown: true, headerTitle: 'Профиль' }}
      />
    </Tab.Navigator>
  );
}

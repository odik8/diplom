import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { useCart } from '../context/CartContext';
import { colors } from '../theme';

import HomeScreen from '../screens/customer/HomeScreen';
import MenuScreen from '../screens/customer/MenuScreen';
import ItemDetailScreen from '../screens/customer/ItemDetailScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import OrderDetailScreen from '../screens/customer/OrderDetailScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerOpts = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { color: colors.text },
  contentStyle: { backgroundColor: colors.background },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Блюдо' }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="CartMain" component={CartScreen} options={{ title: 'Корзина' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Оформление' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Мои заказы' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
    </Stack.Navigator>
  );
}

function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function CartTabIcon({ focused }) {
  const { count } = useCart();
  return (
    <View>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🛒</Text>
      {count > 0 && (
        <View style={{
          position: 'absolute', right: -6, top: -4, backgroundColor: colors.primary,
          borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{count}</Text>
        </View>
      )}
    </View>
  );
}

export default function CustomerNavigator() {
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
        name="HomeTab" component={HomeStack}
        options={{ title: 'Главная', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="CartTab" component={CartStack}
        options={{ title: 'Корзина', tabBarIcon: ({ focused }) => <CartTabIcon focused={focused} />, headerShown: false }}
      />
      <Tab.Screen
        name="OrdersTab" component={OrdersStack}
        options={{ title: 'Заказы', tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProfileTab" component={ProfileScreen}
        options={{ title: 'Профиль', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />, headerShown: true, headerTitle: 'Профиль' }}
      />
    </Tab.Navigator>
  );
}

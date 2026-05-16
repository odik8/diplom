import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { orderAPI } from '../../services/api';
import { colors, spacing, radius, shadow } from '../../theme';

const STATUS_LABELS = {
  pending:   { label: 'Ожидает подтверждения', color: '#FFC107' },
  confirmed: { label: 'Принят',                color: '#2196F3' },
  preparing: { label: 'Готовится',             color: '#FF9800' },
  ready:     { label: 'Готов к выдаче',        color: '#9C27B0' },
  picked_up: { label: 'Курьер в пути',         color: '#00BCD4' },
  delivered: { label: 'Доставлен',             color: '#4CAF50' },
  cancelled: { label: 'Отменён',               color: '#F44336' },
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await orderAPI.getMyOrders();
      setOrders(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      data={orders}
      keyExtractor={(i) => String(i.id)}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={styles.emptyText}>Заказов пока нет</Text>
        </View>
      }
      renderItem={({ item }) => {
        const status = STATUS_LABELS[item.status] || { label: item.status, color: '#999' };
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Заказ #{item.id}</Text>
              <View style={[styles.badge, { backgroundColor: status.color + '22' }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <Text style={styles.address} numberOfLines={1}>📍 {item.delivery_address}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.total}>{Number(item.total_price).toFixed(2)} ₽</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('ru-RU')}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingTop: 80 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs, ...shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: '600', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '600' },
  address: { fontSize: 13, color: colors.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  total: { fontSize: 15, fontWeight: '700', color: colors.primary },
  date: { fontSize: 12, color: colors.textSecondary },
});

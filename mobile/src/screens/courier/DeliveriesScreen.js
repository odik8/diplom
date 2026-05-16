import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { orderAPI } from '../../services/api';
import { colors, spacing, radius, shadow } from '../../theme';

const TABS = [
  { key: 'assigned', label: 'Мои доставки' },
  { key: 'available', label: 'Доступные' },
];
const STATUS_LABELS = {
  ready:     { label: 'Готов к выдаче', color: '#9C27B0' },
  picked_up: { label: 'В пути',         color: '#00BCD4' },
};

export default function DeliveriesScreen({ navigation }) {
  const [tab, setTab] = useState('assigned');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = tab === 'assigned'
        ? await orderAPI.getAssigned()
        : await orderAPI.getAvailable();
      setOrders(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        : (
          <FlatList
            contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
            data={orders}
            keyExtractor={(i) => String(i.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>{tab === 'available' ? '🎯' : '📦'}</Text>
                <Text style={styles.emptyText}>
                  {tab === 'available' ? 'Нет доступных заказов' : 'Нет активных доставок'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const status = STATUS_LABELS[item.status] || { label: item.status, color: '#999' };
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate('DeliveryDetail', { orderId: item.id, order: item })}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>#{item.id} — {item.customer_name}</Text>
                    <View style={[styles.badge, { backgroundColor: status.color + '22' }]}>
                      <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.address} numberOfLines={2}>📍 {item.delivery_address}</Text>
                  {item.customer_phone && <Text style={styles.phone}>📞 {item.customer_phone}</Text>}
                  <Text style={styles.total}>{Number(item.total_price).toFixed(2)} ₽</Text>
                </TouchableOpacity>
              );
            }}
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, padding: spacing.xs, margin: spacing.md, borderRadius: radius.md, ...shadow.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingTop: 60 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs, ...shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  orderId: { fontSize: 15, fontWeight: '600', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '600' },
  address: { fontSize: 13, color: colors.textSecondary },
  phone: { fontSize: 13, color: colors.secondary },
  total: { fontSize: 15, fontWeight: '700', color: colors.primary },
});

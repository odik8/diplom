import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { orderAPI } from '../../services/api';
import { colors, spacing, radius, shadow } from '../../theme';

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];
const STEP_LABELS = {
  pending: 'Ожидает', confirmed: 'Принят', preparing: 'Готовится',
  ready: 'Готово', picked_up: 'В пути', delivered: 'Доставлен',
};
const STATUS_LABELS = {
  pending:   { label: 'Ожидает подтверждения', color: '#FFC107' },
  confirmed: { label: 'Принят',                color: '#2196F3' },
  preparing: { label: 'Готовится',             color: '#FF9800' },
  ready:     { label: 'Готов к выдаче',        color: '#9C27B0' },
  picked_up: { label: 'Курьер в пути',         color: '#00BCD4' },
  delivered: { label: 'Доставлен ✓',           color: '#4CAF50' },
  cancelled: { label: 'Отменён',               color: '#F44336' },
};

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId, order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await orderAPI.getOrder(orderId);
      setOrder(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = () => {
    Alert.alert('Отменить заказ?', 'Это действие нельзя отменить', [
      { text: 'Нет', style: 'cancel' },
      {
        text: 'Отменить', style: 'destructive', onPress: async () => {
          await orderAPI.cancel(orderId);
          load();
        }
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!order) return <View style={styles.center}><Text>Заказ не найден</Text></View>;

  const status = STATUS_LABELS[order.status] || { label: order.status, color: '#999' };
  const currentStep = STEPS.indexOf(order.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.orderId}>Заказ #{order.id}</Text>
        <View style={[styles.badge, { backgroundColor: status.color + '22' }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {order.status !== 'cancelled' && (
        <View style={styles.progressContainer}>
          {STEPS.map((step, idx) => (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  idx <= currentStep && { backgroundColor: colors.primary },
                  idx === currentStep && styles.stepDotActive,
                ]}>
                  {idx < currentStep && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                </View>
                <Text style={[styles.stepLabel, idx <= currentStep && { color: colors.primary }]}>
                  {STEP_LABELS[step]}
                </Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.stepLine, idx < currentStep && { backgroundColor: colors.primary }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Состав заказа</Text>
        {(order.items || []).map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name} × {item.quantity}</Text>
            <Text style={styles.itemPrice}>{(item.price_at_time * item.quantity).toFixed(2)} ₽</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Итого:</Text>
          <Text style={styles.totalValue}>{Number(order.total_price).toFixed(2)} ₽</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Доставка</Text>
        <Text style={styles.address}>📍 {order.delivery_address}</Text>
        {order.courier_name && <Text style={styles.courier}>🛵 Курьер: {order.courier_name}</Text>}
        {order.notes && <Text style={styles.notes}>💬 {order.notes}</Text>}
      </View>

      {['pending', 'confirmed'].includes(order.status) && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Отменить заказ</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 20, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 12, fontWeight: '600' },
  progressContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { width: 28, height: 28, borderRadius: 14 },
  stepLabel: { fontSize: 9, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginTop: 12 },
  section: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.sm, gap: spacing.xs },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: colors.text, flex: 1 },
  itemPrice: { fontSize: 14, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  totalLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  address: { fontSize: 14, color: colors.text },
  courier: { fontSize: 14, color: colors.secondary, fontWeight: '500' },
  notes: { fontSize: 13, color: colors.textSecondary },
  cancelBtn: { borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  cancelBtnText: { color: colors.error, fontWeight: '600', fontSize: 15 },
});

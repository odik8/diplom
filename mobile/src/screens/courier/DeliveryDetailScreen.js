import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { orderAPI } from '../../services/api';
import { colors, spacing, radius, shadow } from '../../theme';

export default function DeliveryDetailScreen({ route, navigation }) {
  const { orderId, order: initial } = route.params;
  const [order, setOrder] = useState(initial || null);
  const [loading, setLoading] = useState(!initial);
  const [actionLoading, setActionLoading] = useState(false);
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

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await orderAPI.accept(orderId);
      await load();
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.message || 'Не удалось принять заказ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    Alert.alert('Подтвердить доставку?', 'Отметить заказ как доставленный?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Доставлено', onPress: async () => {
          setActionLoading(true);
          try {
            await orderAPI.updateDelivery(orderId, 'delivered');
            navigation.goBack();
          } catch {
            Alert.alert('Ошибка', 'Не удалось обновить статус');
          } finally {
            setActionLoading(false);
          }
        }
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!order) return <View style={styles.center}><Text>Заказ не найден</Text></View>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Заказ #{order.id}</Text>
        <Text style={styles.total}>{Number(order.total_price).toFixed(2)} ₽</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Клиент</Text>
        <Text style={styles.info}>👤 {order.customer_name}</Text>
        {order.customer_phone && <Text style={styles.info}>📞 {order.customer_phone}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Адрес доставки</Text>
        <Text style={styles.address}>📍 {order.delivery_address}</Text>
        {order.notes && <Text style={styles.notes}>💬 {order.notes}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Состав заказа</Text>
        {(order.items || []).map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name} × {item.quantity}</Text>
            <Text style={styles.itemPrice}>{(item.price_at_time * item.quantity).toFixed(2)} ₽</Text>
          </View>
        ))}
      </View>

      {order.status === 'ready' && !order.courier_id && (
        <TouchableOpacity style={styles.actionBtn} onPress={handleAccept} disabled={actionLoading}>
          {actionLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.actionBtnText}>🛵 Принять заказ</Text>
          }
        </TouchableOpacity>
      )}

      {order.status === 'picked_up' && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={handleDeliver} disabled={actionLoading}>
          {actionLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.actionBtnText}>✓ Заказ доставлен</Text>
          }
        </TouchableOpacity>
      )}

      {order.status === 'delivered' && (
        <View style={styles.deliveredBadge}>
          <Text style={styles.deliveredText}>✅ Доставлено</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  total: { fontSize: 22, fontWeight: '700', color: colors.primary },
  section: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.sm, gap: spacing.xs },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  info: { fontSize: 15, color: colors.text },
  address: { fontSize: 15, color: colors.text, lineHeight: 22 },
  notes: { fontSize: 13, color: colors.textSecondary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: colors.text, flex: 1 },
  itemPrice: { fontSize: 14, color: colors.text },
  actionBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deliveredBadge: { backgroundColor: '#E8F5E9', borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  deliveredText: { color: colors.success, fontSize: 16, fontWeight: '600' },
});

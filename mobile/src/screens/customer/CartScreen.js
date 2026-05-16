import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useCart } from '../../context/CartContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 64 }}>🛒</Text>
        <Text style={styles.emptyTitle}>Корзина пуста</Text>
        <Text style={styles.emptyText}>Добавьте блюда из меню</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>В меню</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 120 }}
        data={items}
        keyExtractor={(i) => String(i.menu_item_id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{(Number(item.price) * item.quantity).toFixed(2)} ₽</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.menu_item_id, item.quantity - 1)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.menu_item_id, item.quantity + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeItem(item.menu_item_id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Итого:</Text>
          <Text style={styles.totalValue}>{total.toFixed(2)} ₽</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutText}>Оформить заказ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Очистить корзину?', '', [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Очистить', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={styles.clearText}>Очистить корзину</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.background },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  button: { marginTop: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.sm },
  name: { fontSize: 15, fontWeight: '500', color: colors.text },
  price: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  qty: { fontSize: 15, fontWeight: '600', color: colors.text, minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: spacing.xs, padding: 4 },
  removeBtnText: { color: colors.error, fontSize: 14 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm, ...shadow.md,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, color: colors.textSecondary },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  checkoutBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  clearText: { color: colors.error, textAlign: 'center', fontSize: 13 },
});

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { orderAPI, paymentAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme';

export default function CheckoutScreen({ navigation }) {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const [address, setAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOrder = async () => {
    if (!address.trim()) return Alert.alert('Ошибка', 'Введите адрес доставки');
    if (!address.includes(',')) return Alert.alert('Ошибка', 'Укажите город в адресе\nНапример: Москва, ул. Ленина, 1');
    setLoading(true);
    try {
      const { data } = await orderAPI.create({
        items: items.map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        delivery_address: address.trim(),
        notes: notes.trim() || undefined,
      });
      clearCart();
      Alert.alert(
        'Заказ оформлен ✅',
        `Заказ #${data.id} на ${Number(data.total_price).toFixed(2)} ₽ создан.\nОплатить онлайн сейчас?`,
        [
          {
            text: 'Позже',
            style: 'cancel',
            onPress: () => navigation.replace('OrderDetail', { orderId: data.id, order: data }),
          },
          {
            text: 'Оплатить',
            onPress: async () => {
              navigation.replace('OrderDetail', { orderId: data.id });
              try {
                const { data: pay } = await paymentAPI.create(data.id);
                if (pay.payment_url) {
                  navigation.navigate('Payment', { url: pay.payment_url, amount: data.total_price });
                }
              } catch {
                Alert.alert('Ошибка', 'Не удалось открыть оплату — попробуйте на экране заказа');
              }
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.message || 'Не удалось оформить заказ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <Text style={styles.sectionTitle}>Ваш заказ</Text>
      {items.map((item) => (
        <View key={item.menu_item_id} style={styles.itemRow}>
          <Text style={styles.itemName}>{item.name} × {item.quantity}</Text>
          <Text style={styles.itemPrice}>{(Number(item.price) * item.quantity).toFixed(2)} ₽</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.itemRow}>
        <Text style={styles.totalLabel}>Итого к оплате:</Text>
        <Text style={styles.totalValue}>{total.toFixed(2)} ₽</Text>
      </View>

      <Text style={styles.sectionTitle}>Доставка</Text>
      <TextInput
        style={styles.input}
        placeholder="Город, улица, дом*"
        value={address}
        onChangeText={setAddress}
        multiline
      />
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        placeholder="Комментарий к заказу (необязательно)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>💳 Оплата онлайн (PayPalych) или при получении</Text>
        <Text style={styles.infoText}>⏱ Примерное время: 30–60 мин</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleOrder} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Подтвердить заказ</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 14, color: colors.text, flex: 1 },
  itemPrice: { fontSize: 14, color: colors.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border },
  totalLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  totalValue: { fontSize: 17, fontWeight: '700', color: colors.primary },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, fontSize: 15, color: colors.text,
  },
  infoBox: { backgroundColor: '#F0FBF9', borderRadius: radius.md, padding: spacing.md, gap: 6 },
  infoText: { fontSize: 14, color: colors.text },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

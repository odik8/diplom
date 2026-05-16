import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useCart } from '../../context/CartContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(1);

  const cartQty = items.find((i) => i.menu_item_id === item.id)?.quantity || 0;

  const handleAdd = () => {
    addItem(item, qty);
    Alert.alert('Добавлено в корзину', `${item.name} × ${qty}`, [
      { text: 'Продолжить покупки' },
      { text: 'В корзину', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imagePlaceholder}>
        <Text style={{ fontSize: 80 }}>🍲</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        {item.category_name && <Text style={styles.category}>{item.category_name}</Text>}

        <View style={styles.metaRow}>
          {item.weight_grams ? (
            <View style={styles.metaChip}><Text style={styles.metaText}>{item.weight_grams} г</Text></View>
          ) : null}
          {item.calories ? (
            <View style={styles.metaChip}><Text style={styles.metaText}>{item.calories} ккал</Text></View>
          ) : null}
        </View>

        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{Number(item.price).toFixed(2)} ₽</Text>
          {cartQty > 0 && <Text style={styles.cartHint}>В корзине: {cartQty} шт.</Text>}
        </View>

        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{qty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>
            Добавить в корзину — {(Number(item.price) * qty).toFixed(2)} ₽
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  imagePlaceholder: { height: 220, backgroundColor: '#FFF3EF', justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  category: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  metaChip: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  description: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  price: { fontSize: 28, fontWeight: '700', color: colors.primary },
  cartHint: { fontSize: 13, color: colors.secondary, fontWeight: '500' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 20, color: colors.primary, fontWeight: '600' },
  qtyValue: { fontSize: 20, fontWeight: '700', color: colors.text, minWidth: 32, textAlign: 'center' },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

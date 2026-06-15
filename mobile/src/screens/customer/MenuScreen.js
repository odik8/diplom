import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { menuAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function MenuScreen({ route, navigation }) {
  const { category } = route.params || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const { addItem, count } = useCart();

  const load = useCallback(async () => {
    try {
      const { data } = await menuAPI.getItems(category?.id);
      setItems(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useEffect(() => {
    navigation.setOptions({ title: category?.name || 'Меню' });
    load();
  }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (error && !items.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Не удалось загрузить меню</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
          <Text style={styles.retryBtnText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>Блюда отсутствуют</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ItemDetail', { item })}
          >
            <View style={styles.imageBox}>
              <Text style={{ fontSize: 36 }}>🍲</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
              <View style={styles.row}>
                {item.weight_grams ? <Text style={styles.meta}>{item.weight_grams} г</Text> : null}
                {item.calories ? <Text style={styles.meta}>{item.calories} ккал</Text> : null}
              </View>
              <View style={styles.footer}>
                <Text style={styles.price}>{Number(item.price).toFixed(2)} ₽</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item)}>
                  <Text style={styles.addBtnText}>+ Добавить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      {count > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => navigation.navigate('CartTab', { screen: 'CartMain' })}>
          <Text style={styles.cartBarText}>Перейти в корзину ({count} поз.)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.md, overflow: 'hidden', ...shadow.sm,
  },
  imageBox: { width: 90, height: 90, backgroundColor: '#FFF3EF', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, padding: spacing.sm, justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  desc: { fontSize: 12, color: colors.textSecondary },
  row: { flexDirection: 'row', gap: spacing.sm },
  meta: { fontSize: 11, color: colors.textSecondary, backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cartBar: {
    position: 'absolute', bottom: spacing.lg, left: spacing.md, right: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', ...shadow.md,
  },
  cartBarText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

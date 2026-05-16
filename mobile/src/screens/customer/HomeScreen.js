import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { menuAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [catRes, itemsRes] = await Promise.all([
        menuAPI.getCategories(),
        menuAPI.getItems(),
      ]);
      setCategories(catRes.data);
      setFeatured(itemsRes.data.slice(0, 6));
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <Text style={styles.greeting}>Привет, {user?.name?.split(' ')[0]}! 👋</Text>
            <Text style={styles.subtitle}>Что будем заказывать сегодня?</Text>
          </View>

          <Text style={styles.sectionTitle}>Категории</Text>
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => navigation.navigate('Menu', { category: item })}
              >
                <Text style={styles.categoryEmoji}>🍽️</Text>
                <Text style={styles.categoryName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />

          <Text style={styles.sectionTitle}>Популярные блюда</Text>
        </>
      }
      data={featured}
      keyExtractor={(i) => String(i.id)}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing.sm }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.itemCard}
          onPress={() => navigation.navigate('ItemDetail', { item })}
        >
          <View style={styles.itemImage}>
            <Text style={{ fontSize: 40 }}>🍲</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.itemPrice}>{Number(item.price).toFixed(2)} ₽</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: spacing.lg },
  greeting: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  categoryCard: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minWidth: 90, ...shadow.sm,
  },
  categoryEmoji: { fontSize: 28, marginBottom: 4 },
  categoryName: { fontSize: 12, color: colors.text, fontWeight: '500', textAlign: 'center' },
  itemCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  itemImage: { height: 100, backgroundColor: '#FFF3EF', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { padding: spacing.sm },
  itemName: { fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: colors.primary },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
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
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [catRes, popularRes] = await Promise.all([
        menuAPI.getCategories(),
        menuAPI.getPopular(),
      ]);
      setCategories(catRes.data);
      setFeatured(popularRes.data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (error && !categories.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Не удалось загрузить меню.{'\n'}Проверьте подключение к интернету.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
          <Text style={styles.retryBtnText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Привет, {user?.name?.split(' ')[0]}! 👋</Text>
        <Text style={styles.subtitle}>Что будем заказывать сегодня?</Text>
      </View>

      <Text style={styles.sectionTitle}>Категории</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
      >
        {categories.map((item) => (
          <TouchableOpacity
            key={String(item.id)}
            style={styles.categoryCard}
            onPress={() => navigation.navigate('Menu', { category: item })}
          >
            <Text style={styles.categoryEmoji}>🍽️</Text>
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Популярные блюда</Text>
      <View style={styles.itemsGrid}>
        {featured.map((item) => (
          <TouchableOpacity
            key={String(item.id)}
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
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
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
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  itemCard: {
    width: '48.5%', backgroundColor: colors.surface,
    borderRadius: radius.md, overflow: 'hidden', ...shadow.sm,
  },
  itemImage: { height: 100, backgroundColor: '#FFF3EF', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { padding: spacing.sm },
  itemName: { fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: colors.primary },
});

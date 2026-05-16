import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function CourierProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>🛵 Курьер</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Контактные данные</Text>
        <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{user?.email}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Телефон</Text><Text style={styles.value}>{user?.phone || '—'}</Text></View>
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => Alert.alert('Выйти?', '', [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Выйти', style: 'destructive', onPress: logout },
        ])}
      >
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  role: { fontSize: 15, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.sm, gap: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, color: colors.text, fontWeight: '500' },
  logoutBtn: { borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  logoutText: { color: colors.error, fontWeight: '600', fontSize: 15 },
});

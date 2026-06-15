import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data);
      setEditing(false);
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Личные данные</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editBtn}>{editing ? 'Отмена' : 'Редактировать'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Имя</Text>
          {editing
            ? <TextInput style={styles.input} value={form.name} onChangeText={set('name')} />
            : <Text style={styles.value}>{user?.name}</Text>
          }
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Телефон</Text>
          {editing
            ? <TextInput style={styles.input} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            : <Text style={styles.value}>{user?.phone || '—'}</Text>
          }
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Адрес доставки</Text>
          {editing
            ? <TextInput style={[styles.input, { minHeight: 60 }]} value={form.address} onChangeText={set('address')} multiline placeholder="Город, улица, дом" />
            : <Text style={styles.value}>{user?.address || '—'}</Text>
          }
        </View>

        {editing && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Сохранить</Text>}
          </TouchableOpacity>
        )}
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
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  email: { fontSize: 14, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.sm, gap: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  editBtn: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  field: { gap: 4 },
  label: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 15, color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, fontSize: 15, color: colors.text },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  logoutBtn: { borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  logoutText: { color: colors.error, fontWeight: '600', fontSize: 15 },
});

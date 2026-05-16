import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      return Alert.alert('Ошибка', 'Имя, email и пароль обязательны');
    }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
    } catch (err) {
      Alert.alert('Ошибка регистрации', err.response?.data?.message || 'Попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Регистрация</Text>

        <TextInput style={styles.input} placeholder="Имя" value={form.name} onChangeText={set('name')} />
        <TextInput
          style={styles.input} placeholder="Email" value={form.email}
          onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none"
        />
        <TextInput
          style={styles.input} placeholder="Пароль (мин. 6 символов)"
          value={form.password} onChangeText={set('password')} secureTextEntry
        />
        <TextInput
          style={styles.input} placeholder="Телефон (необязательно)"
          value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad"
        />

        <Text style={styles.label}>Я регистрируюсь как:</Text>
        <View style={styles.roleRow}>
          {['customer', 'courier'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
              onPress={() => set('role')(r)}
            >
              <Text style={[styles.roleBtnText, form.role === r && styles.roleBtnTextActive]}>
                {r === 'customer' ? '🛒 Покупатель' : '🛵 Курьер'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Зарегистрироваться</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={styles.linkText}>Уже есть аккаунт? <Text style={styles.linkBold}>Войти</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, padding: spacing.lg, paddingTop: 60, gap: spacing.md },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  label: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, fontSize: 16, color: colors.text,
  },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  roleBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.border, alignItems: 'center',
  },
  roleBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF3EF' },
  roleBtnText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  roleBtnTextActive: { color: colors.primary },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '600' },
});

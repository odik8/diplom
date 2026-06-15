import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import api from '../../services/api';
import { colors, spacing, radius, shadow } from '../../theme';

// Тестовые счета подтверждаются нативным экраном через JSON API: WebKit в
// iOS 26 принудительно повышает локальные http-ссылки до https и роняет
// загрузку страницы (axios-запросы это не затрагивает). Боевые страницы
// PayPalych работают по https и открываются в WebView как обычно.
export default function PaymentScreen({ route, navigation }) {
  const { url, amount } = route.params;
  const testBillId = url?.match(/\/api\/payments\/test\/([^/?#]+)/)?.[1];

  if (testBillId) {
    return <TestPayment billId={testBillId} amount={amount} navigation={navigation} />;
  }

  return (
    <View style={styles.container}>
      <WebView source={{ uri: url }} startInLoadingState />
    </View>
  );
}

function TestPayment({ billId, amount, navigation }) {
  const [processing, setProcessing] = useState(false);
  const [outcome, setOutcome] = useState(null); // 'paid' | 'failed'

  const confirm = async (result) => {
    setProcessing(true);
    try {
      const { data } = await api.post(`/payments/test/${billId}/confirm`, { result });
      setOutcome(data.payment_status);
    } catch (err) {
      setOutcome('error');
    } finally {
      setProcessing(false);
    }
  };

  if (outcome) {
    const ok = outcome === 'paid';
    return (
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.resultEmoji}>{ok ? '✅' : '❌'}</Text>
          <Text style={styles.title}>{ok ? 'Оплата прошла успешно' : 'Платёж отклонён'}</Text>
          <Text style={styles.muted}>
            {ok ? 'Спасибо! Заказ оплачен.' : 'Вы можете повторить оплату на экране заказа.'}
          </Text>
          <TouchableOpacity style={styles.payBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.payBtnText}>Вернуться к заказу</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <View style={styles.card}>
        <View style={styles.badge}><Text style={styles.badgeText}>ТЕСТОВЫЙ РЕЖИМ · PayPalych</Text></View>
        <Text style={styles.title}>Оплата заказа</Text>
        <Text style={styles.muted}>Meal Delivery — доставка готовой еды</Text>
        {amount != null && <Text style={styles.amount}>{Number(amount).toFixed(2)} ₽</Text>}
        {processing ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
        ) : (
          <>
            <TouchableOpacity style={styles.payBtn} onPress={() => confirm('success')}>
              <Text style={styles.payBtnText}>Оплатить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.failBtn} onPress={() => confirm('fail')}>
              <Text style={styles.failBtnText}>Отклонить платёж</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    width: '100%', alignItems: 'center', ...shadow.md,
  },
  badge: { backgroundColor: '#FFF3CD', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.md },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#856404' },
  title: { fontSize: 19, fontWeight: '700', color: colors.text, textAlign: 'center' },
  muted: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  amount: { fontSize: 32, fontWeight: '700', color: colors.text, marginVertical: spacing.md },
  resultEmoji: { fontSize: 48, marginBottom: spacing.sm },
  payBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', alignSelf: 'stretch', marginTop: spacing.md,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  failBtn: {
    backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', alignSelf: 'stretch', marginTop: spacing.sm,
  },
  failBtnText: { color: colors.error, fontSize: 15, fontWeight: '600' },
});

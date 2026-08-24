import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { colors, weight } from '../theme';
import { STATUS_STYLE } from '../data/requests';
import { kwh } from '../utils/format';
import { IconBadge, Pill } from './ui';

export default function IncomingRequestRow({ request, onPress, last }) {
  const tone = STATUS_STYLE[request.status] || STATUS_STYLE.Pending;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.divided, { opacity: pressed ? 0.8 : 1 }]}
    >
      <IconBadge size={42}>
        <Text style={styles.initials}>{request.initials}</Text>
      </IconBadge>

      <View style={styles.body}>
        <Text style={styles.name}>{request.name}</Text>
        <Text style={styles.detail}>{'Requested ' + kwh(request.kwh) + ' kWh'}</Text>
        <Text style={styles.when}>{request.when}</Text>
      </View>

      <View style={styles.trailing}>
        <Pill
          label={request.status.toUpperCase()}
          color={tone.color}
          background={tone.pillBg}
          dotColor={tone.color}
          style={styles.statusPill}
        />
        <ChevronRight size={14} color={colors.textFaint} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divided: { paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  initials: { fontSize: 13, fontWeight: weight.heavy, color: colors.tealLight },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: weight.heavy, color: colors.text },
  detail: { fontSize: 12, fontWeight: weight.medium, color: colors.textMuted },
  when: { fontSize: 11, fontWeight: weight.medium, color: colors.textFaint },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: { paddingVertical: 4, paddingHorizontal: 9 },
});

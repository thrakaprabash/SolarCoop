import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Activity, ChevronRight, Search, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTechnician } from '../context/TechnicianContext';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';
import { fetchSystemHealth } from '../services/systemHealthService';
import { systemHealthStatus, systemReadingFresh } from '../utils/systemHealth';
import CommunityEnergyFeed from '../components/CommunityEnergyFeed';

export default function SystemHealthScreen() {
  const { t } = useTranslation();
  const { TECH } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const { technicianId, jobs, openJob } = useTechnician();
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(Date.now());
  const offset = useRef(0), request = useRef(0);

  const refresh = useCallback(async (manual = false) => {
    const version = ++request.current;
    if (manual) setLoading(true);
    try {
      const data = await fetchSystemHealth();
      if (version !== request.current) return;
      offset.current = Date.parse(data.server_time) - Date.now();
      setSnapshot(data); setError(false);
    } catch {
      if (version === request.current) setError(true);
    } finally {
      if (version === request.current) { setLoading(false); setNow(Date.now() + offset.current); }
    }
  }, []);
  useEffect(() => {
    setSnapshot(null); setLoading(true); setError(false);
    offset.current = 0;
    refresh();
    const timer = setInterval(() => {
      setNow(Date.now() + offset.current);
      if (!AppState.currentState || AppState.currentState === 'active') refresh();
    }, 10_000);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { ++request.current; clearInterval(timer); sub.remove(); };
  }, [technicianId, refresh]);

  const systems = (snapshot?.systems ?? []).map(system => ({ ...system, health: systemHealthStatus(system, now) }));
  const healthy = systems.filter(system => system.health === 'healthy').length;
  const search = query.trim().toLowerCase();
  const visible = systems.filter(system => (filter === 'all' || system.health !== 'healthy') &&
    [system.owner_name, system.household_id, system.inverter_serial].some(value => String(value ?? '').toLowerCase().includes(search)))
    .sort((a, b) => (a.health === 'healthy' ? 1 : 0) - (b.health === 'healthy' ? 1 : 0));
  const statusColor = status => status === 'healthy' ? TECH.green : status === 'fault' || status === 'offline' ? TECH.red : TECH.amber;
  const number = (value, digits = 1) => value != null && Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '—';

  return <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
    refreshControl={<RefreshControl refreshing={loading && !!snapshot} onRefresh={() => refresh(true)} tintColor={TECH.orange} colors={[TECH.orange]}/> }>
    <View style={styles.titleRow}><Text style={[styles.title,styles.flex]}>{t('technician.health.title')}</Text><Activity size={20} color={TECH.orange}/></View>
    <View style={styles.source}><ShieldCheck size={16} color={TECH.orange}/><Text style={styles.sourceText}>{t('technician.health.source')}</Text></View>
    {error ? <View style={styles.error}><Text style={styles.caption}>{t(snapshot ? 'technician.health.refreshError' : 'technician.health.loadError')}</Text>
      <Pressable onPress={() => refresh(true)} accessibilityRole="button" style={styles.retry}><Text style={styles.actionText}>{t('common.retry')}</Text></Pressable></View> : null}
    {snapshot ? <>
      <View style={styles.summary}>{[['total',systems.length,TECH.text],['healthy',healthy,TECH.green],['attention',systems.length-healthy,TECH.red]].map(([key,count,color]) =>
        <View key={key} style={styles.summaryStat}><Text style={[styles.count,{color}]}>{count}</Text><Text style={styles.summaryLabel}>{t(`technician.health.${key}`)}</Text></View>)}</View>
      <CommunityEnergyFeed snapshot={snapshot} now={now}/>
      <View style={styles.search}><Search size={18} color={TECH.textMuted}/><TextInput value={query} onChangeText={setQuery}
        placeholder={t('technician.health.search')} accessibilityLabel={t('technician.health.search')} placeholderTextColor={TECH.textMuted} style={styles.input}/></View>
      <View style={styles.filters}>{['all','attention'].map(key => <Pressable key={key} onPress={() => setFilter(key)} accessibilityRole="tab" accessibilityState={{selected:filter===key}}
        style={[styles.filter,filter===key&&styles.filterSelected]}><Text style={[styles.caption,filter===key&&styles.actionText]}>{t(`technician.health.${key}`)}</Text></Pressable>)}</View>
      {visible.map(system => {
        const fresh = systemReadingFresh(system, now);
        const readingTime = Date.parse(system.last_reading_at);
        const age = Number.isFinite(readingTime) ? Math.max(0,Math.floor((now-readingTime)/1000)) : null;
        const canOpen = system.job_id && jobs.some(job => job.id === system.job_id && job.status !== 'completed');
        return <View key={system.id} style={styles.card} testID={`system-health-${system.id}`}>
          <View style={styles.cardTop}><Text style={styles.owner}>{system.owner_name || system.household_id || system.inverter_serial}</Text>
            <View style={[styles.status,{backgroundColor:`${statusColor(system.health)}18`}]}><View style={[styles.dot,{backgroundColor:statusColor(system.health)}]}/><Text style={[styles.statusText,{color:statusColor(system.health)}]}>{t(`technician.health.status.${system.health}`)}</Text></View></View>
          <Text style={styles.caption}>{system.inverter_serial} · {number(system.capacity_kw)} kW · {t('technician.health.panels',{count:system.panel_count})}</Text>
          {system.fault_code ? <Text style={styles.fault}>{system.fault_code} · {system.fault_title}</Text> : null}
          <View style={styles.readings}>{[['output',`${number(system.production_kw,2)}${system.production_kw!=null?' kW':''}`],['daily',`${number(system.daily_production_kwh)}${system.daily_production_kwh!=null?' kWh':''}`],['battery',`${number(system.battery_level,0)}${system.battery_level!=null?'%':''}`]].map(([key,value]) =>
            <View key={key} style={styles.stat}><Text style={styles.caption}>{t(`technician.health.${key}`)}</Text><Text style={[styles.value,!fresh&&{color:TECH.textMuted}]}>{value}</Text></View>)}</View>
          <View style={styles.cardFooter}><Text style={styles.lastSeen}>{age==null?t('technician.health.noReading'):t('technician.health.lastSeen',{seconds:age})}{!fresh&&age!=null?` · ${t('technician.health.lastKnown')}`:''}</Text>
            {canOpen ? <Pressable onPress={() => openJob(system.job_id)} accessibilityRole="button" style={styles.retry}><Text style={styles.actionText}>{t('technician.job.viewJob')}</Text><ChevronRight size={16} color={TECH.orange}/></Pressable> : null}</View>
        </View>;
      })}
      {!visible.length ? <View style={styles.empty}><ShieldCheck size={26} color={TECH.textSecondary}/><Text style={styles.caption}>{t(!systems.length?'technician.health.empty':'technician.health.noMatches')}</Text></View> : null}
    </> : loading ? <ActivityIndicator style={styles.loading} color={TECH.orange}/> : null}
  </ScrollView>;
}

const createStyles = TECH => StyleSheet.create({
  flex:{flex:1},content:{padding:16,gap:12,paddingBottom:24},titleRow:{flexDirection:'row',alignItems:'center',gap:12},
  title:{fontSize:20,fontWeight:'600',letterSpacing:-0.3,color:TECH.text},caption:{fontSize:11,lineHeight:16,color:TECH.textSecondary},
  source:{flexDirection:'row',gap:6,alignItems:'center'},sourceText:{flex:1,fontSize:10,color:TECH.textMuted,lineHeight:15},
  summary:{flexDirection:'row',gap:8,paddingVertical:2},summaryStat:{flex:1,flexDirection:'row',alignItems:'center',gap:5},summaryLabel:{flexShrink:1,fontSize:10,color:TECH.textSecondary,lineHeight:14},stat:{flex:1,gap:3},count:{fontSize:16,fontWeight:'600'},
  search:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:TECH.borderStrong,backgroundColor:TECH.card,borderRadius:12,paddingHorizontal:12},input:{flex:1,minHeight:46,fontSize:13,color:TECH.text},
  filters:{flexDirection:'row',gap:8},filter:{minHeight:44,justifyContent:'center',paddingHorizontal:14,borderRadius:10,borderWidth:1,borderColor:TECH.border},filterSelected:{borderColor:TECH.orangeBorder,backgroundColor:TECH.orangeSoft},
  card:{backgroundColor:TECH.card,borderWidth:1,borderColor:TECH.border,borderRadius:14,padding:12,gap:6},cardTop:{flexDirection:'row',alignItems:'center',gap:8},owner:{flex:1,fontSize:14,fontWeight:'600',color:TECH.text},
  status:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:8,paddingVertical:5,borderRadius:7},dot:{width:5,height:5,borderRadius:3},statusText:{fontSize:11,fontWeight:'600'},
  fault:{fontSize:11,lineHeight:16,color:TECH.red},readings:{flexDirection:'row',gap:8,paddingVertical:7,borderTopWidth:1,borderBottomWidth:1,borderColor:TECH.border},value:{fontSize:12,fontWeight:'600',color:TECH.text},
  cardFooter:{flexDirection:'row',alignItems:'center',gap:8},lastSeen:{flex:1,fontSize:11,lineHeight:17,color:TECH.textMuted},retry:{minHeight:44,flexDirection:'row',gap:3,alignItems:'center'},actionText:{fontSize:12,fontWeight:'600',color:TECH.orange},
  error:{backgroundColor:TECH.redSoft,borderRadius:12,padding:12,gap:4},empty:{padding:28,alignItems:'center',gap:12},loading:{marginTop:30},
});

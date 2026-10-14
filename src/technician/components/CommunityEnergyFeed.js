import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDown, ArrowRight, ArrowUp, Home, Sun, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';
import { communityFeed } from '../utils/systemHealth';

export default function CommunityEnergyFeed({ snapshot, now }) {
  const { TECH } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const { t } = useTranslation();
  const feed = communityFeed(snapshot, now);
  const display = value => value == null ? '—' : value.toFixed(2);
  const direction = feed.balance == null ? 'unknown' : Math.abs(feed.balance) < 0.005 ? 'balanced' : feed.balance > 0 ? 'surplus' : 'shortfall';
  const metrics = [
    ['production',display(feed.production),'kW',TECH.orange],
    ['consumption',display(feed.consumption),'kW',TECH.text],
    ['balance',display(feed.balance),'kW',feed.balance < 0 ? TECH.amber : TECH.green],
    ['pool',display(feed.pool),'kWh',TECH.text],
    ['faults',feed.faults??'—',t('technician.feed.devices'),TECH.red],
    ['repairs',feed.repairs??'—',t('technician.feed.open'),TECH.text],
  ];
  return <View style={styles.container}>
    <View style={styles.header}><View style={[styles.dot,{backgroundColor:feed.fresh ? TECH.green : TECH.amber}]}/>
      <Text style={styles.heading}>{t('technician.feed.title')}</Text>
      <Text style={styles.freshness}>{t('technician.feed.fresh',{count:feed.fresh,total:feed.total})}</Text></View>
    {feed.fresh > 0 && feed.fresh < feed.total ? <Text style={styles.partial}>{t('technician.feed.partial')}</Text> : null}
    <View style={styles.metrics}>{metrics.map(([key,value,unit,color],index)=><View key={key} style={[styles.metric,index%3!==0&&styles.separator]} testID={`community-${key}`}>
      <Text style={styles.label}>{t(`technician.feed.${key}`)}</Text><View style={styles.valueRow}><Text style={[styles.value,{color}]}>{value}</Text><Text style={styles.unit}>{unit}</Text></View>
    </View>)}</View>
    <LinearGradient colors={[TECH.heroStart,TECH.heroEnd]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.flow}>
      <Text style={styles.flowHeading}>{t('technician.feed.community')}</Text>
      <Text style={styles.explanation} testID="community-balance-description">{t(`technician.feed.${direction}`,{value:display(Math.abs(feed.balance??0))})}</Text>
      <View style={styles.diagram} accessible accessibilityLabel={t('technician.feed.diagram')}>
        <View style={styles.node}><View style={styles.circle}><Sun size={19} color={TECH.orange}/></View><Text style={styles.nodeLabel}>{t('technician.feed.owners')}</Text></View>
        <View style={styles.link}><ArrowRight size={14} color={TECH.orange}/></View>
        <View style={styles.node}><View style={[styles.circle,styles.pool]}><Zap size={15} color={TECH.orange}/><Text style={styles.poolLabel}>{t('technician.feed.coop')}</Text></View>
          <View style={styles.grid}>{direction==='shortfall'?<ArrowUp size={13} color={TECH.amber}/>:direction==='surplus'?<ArrowDown size={13} color={TECH.green}/>:null}<Text style={styles.nodeLabel}>{t('technician.feed.grid')}</Text></View>
        </View>
        <View style={styles.link}><ArrowRight size={14} color={TECH.orange}/></View>
        <View style={styles.node}><View style={styles.circle}><Home size={19} color={TECH.orange}/></View><Text style={styles.nodeLabel}>{t('technician.feed.consumers')}</Text></View>
      </View>
    </LinearGradient>
  </View>;
}
const createStyles = TECH => StyleSheet.create({
  container:{gap:10},header:{flexDirection:'row',alignItems:'center',gap:6},dot:{width:5,height:5,borderRadius:3},heading:{fontSize:12,fontWeight:'600',color:TECH.text},freshness:{flex:1,textAlign:'right',fontSize:10,color:TECH.textMuted},
  partial:{fontSize:10,lineHeight:14,color:TECH.amber},
  metrics:{flexDirection:'row',flexWrap:'wrap',rowGap:12,paddingVertical:4},metric:{width:'33.333%',paddingHorizontal:9,gap:5},separator:{borderLeftWidth:1,borderColor:TECH.border},label:{fontSize:10,color:TECH.textSecondary,lineHeight:14},
  valueRow:{flexDirection:'row',alignItems:'baseline',flexWrap:'wrap',gap:3},value:{fontSize:19,fontWeight:'600',letterSpacing:-0.4},unit:{fontSize:10,color:TECH.textMuted},
  flow:{borderWidth:1,borderColor:TECH.orangeBorder,borderRadius:14,padding:12,gap:5},flowHeading:{fontSize:10,fontWeight:'600',letterSpacing:0.6,color:TECH.orange},explanation:{fontSize:12,lineHeight:17,color:TECH.textSecondary},
  diagram:{flexDirection:'row',alignItems:'flex-start',marginTop:6},node:{width:66,alignItems:'center',gap:5},circle:{height:38,width:38,borderRadius:19,backgroundColor:TECH.orangeSoft,borderWidth:1,borderColor:TECH.orangeBorder,alignItems:'center',justifyContent:'center'},pool:{width:54,height:38,borderRadius:19,flexDirection:'row',gap:3},poolLabel:{fontSize:10,fontWeight:'600',color:TECH.orange},
  nodeLabel:{fontSize:10,color:TECH.textSecondary,textAlign:'center'},link:{flex:1,height:1,minWidth:8,borderTopWidth:1,borderStyle:'dashed',borderColor:TECH.orangeBorder,marginTop:19,alignItems:'center',justifyContent:'center'},grid:{flexDirection:'row',gap:3,alignItems:'center',marginTop:5},
});

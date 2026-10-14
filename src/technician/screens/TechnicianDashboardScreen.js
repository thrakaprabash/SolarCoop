import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';
import { useTechnician } from '../context/TechnicianContext';
import JobStatusTabs from '../components/JobStatusTabs';
import JobCard from '../components/JobCard';

// Urgent first, then medium, then low — the order a technician should work in.
const URGENCY_RANK = { urgent: 0, medium: 1, low: 2 };
const byUrgency = (a, b) => (URGENCY_RANK[a.urgency] ?? 3) - (URGENCY_RANK[b.urgency] ?? 3);

function Section({ label, children }) {
  const styles = useTechStyles(createStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Empty({ text }) {
  const styles = useTechStyles(createStyles);
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/**
 * SOL-193 — Technician dashboard.
 *
 * The "Active" view is the technician's home: their accepted ticket on top,
 * with the pending queue underneath so the next job is always one glance
 * away (as in the Figma frame). "Pending" and "Completed" are plain lists.
 */
export default function TechnicianDashboardScreen() {
  const { TECH } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const { t } = useTranslation();
  const {
    jobs, jobCounts, jobFilter, setJobFilter,
    jobsLoading, jobsError, loadJobs, openJob, setTechBottomTab,
  } = useTechnician();
  const firstLoad = jobsLoading && jobs.length === 0;

  const active    = jobs.filter(j => j.status === 'active').sort(byUrgency);
  const pending   = jobs.filter(j => j.status === 'pending').sort(byUrgency);
  const completed = jobs.filter(j => j.status === 'completed');

  const pendingSection = (
    <Section label={t('technician.dashboard.pendingJobs')}>
      {pending.length === 0
        ? <Empty text={t('technician.dashboard.noPending')} />
        : pending.map(job => <JobCard key={job.id} job={job} onPress={() => openJob(job.id)} />)}
    </Section>
  );

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={jobsLoading && jobs.length > 0}
          onRefresh={loadJobs}
          tintColor={TECH.orange}
          colors={[TECH.orange]}
        />
      }
    >
      <LinearGradient colors={[TECH.heroStart, TECH.heroEnd]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>
        <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.motif}>
          <Svg width={158} height={158} viewBox="0 0 158 158">
            <Circle cx={79} cy={79} r={30} fill={TECH.orangeSoft} stroke={TECH.orange} strokeWidth={1.5}/>
            <Circle cx={79} cy={79} r={49} fill="none" stroke={TECH.orange} strokeWidth={1}/>
            <Circle cx={79} cy={79} r={68} fill="none" stroke={TECH.orange} strokeWidth={1}/>
            {[0,45,90,135,180,225,270,315].map(angle=><Line key={angle} x1={79} y1={39} x2={79} y2={24} stroke={TECH.orange} strokeWidth={2} strokeLinecap="round" rotation={angle} origin="79,79"/>)}
          </Svg>
        </View>
      <View style={styles.workspace}>
        <Text style={styles.workspaceTitle}>{t('technician.design.jobBoard')}</Text>
        <Text style={styles.workspaceSubtitle}>{t('technician.design.boardCaption')}</Text>
      </View>
      <View style={styles.summary}>
        {[
          ['pending',jobCounts.pending,TECH.amber],
          ['active',jobCounts.active,TECH.orange],
          ['urgent',jobs.filter(job=>job.status!=='completed' && job.urgency==='urgent').length,TECH.red],
        ].map(([key,count,color],index)=>(
          <Pressable key={key} style={[styles.summaryCard,index>0&&styles.summaryDivider]} accessibilityRole="button"
            onPress={()=>key==='urgent'?setTechBottomTab('diagnostics'):setJobFilter(key)}>
            <Text style={[styles.summaryCount,{color}]}>{count}</Text>
            <Text style={styles.summaryLabel}>{t(`technician.design.${key}`)}</Text>
          </Pressable>
        ))}
      </View>
      </LinearGradient>
      <JobStatusTabs value={jobFilter} onChange={setJobFilter} counts={jobCounts} />

      {jobsError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{jobsError}</Text>
          <Pressable style={styles.retryBtn} onPress={loadJobs}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {firstLoad ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={TECH.orange} />
          <Text style={styles.loadingText}>{t('technician.dashboard.loading')}</Text>
        </View>
      ) : null}

      {!firstLoad && jobFilter === 'active' && (
        <>
          <Section label={t('technician.dashboard.activeTicket')}>
            {active.length === 0
              ? <Empty text={t('technician.dashboard.noActive')} />
              : active.map(job => <JobCard key={job.id} job={job} featured onPress={() => openJob(job.id)} />)}
          </Section>
          {pendingSection}
        </>
      )}

      {!firstLoad && jobFilter === 'pending' && pendingSection}

      {!firstLoad && jobFilter === 'completed' && (
        <Section label={t('technician.dashboard.completedJobs')}>
          {completed.length === 0
            ? <Empty text={t('technician.dashboard.noCompleted')} />
            : completed.map(job => <JobCard key={job.id} job={job} onPress={() => openJob(job.id)} />)}
        </Section>
      )}
    </ScrollView>
  );
}

const createStyles = TECH => StyleSheet.create({
  hero:{borderRadius:22,padding:18,gap:24,borderWidth:1,borderColor:TECH.orangeBorder,overflow:'hidden'},
  motif:{position:'absolute',top:-35,right:-45,opacity:0.22},
  workspace:{gap:7},
  workspaceTitle:{fontSize:28,fontWeight:'700',color:TECH.text,letterSpacing:-0.8},
  workspaceSubtitle:{fontSize:13,lineHeight:20,color:TECH.textSecondary,maxWidth:'82%'},
  summary:{flexDirection:'row'},
  summaryCard:{flex:1,minHeight:64,gap:5,justifyContent:'center'},
  summaryDivider:{borderLeftWidth:1,borderColor:TECH.orangeBorder,paddingLeft:12},
  summaryCount:{fontSize:28,fontWeight:'600',letterSpacing:-0.8},summaryLabel:{fontSize:11,fontWeight:'500',color:TECH.textSecondary},
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, gap: 22 },
  section: { gap: 12 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TECH.textSecondary,
  },
  empty: {
    borderWidth: 1,
    borderColor: TECH.border,
    backgroundColor: TECH.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center', color: TECH.textSecondary },
  loading: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 12, fontWeight: '600', color: TECH.textSecondary },
  errorCard: {
    backgroundColor: TECH.redSoft,
    borderWidth: 1,
    borderColor: TECH.redBorder,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  errorText: { fontSize: 12, lineHeight: 17, color: TECH.text },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: TECH.red,
  },
  retryText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
});

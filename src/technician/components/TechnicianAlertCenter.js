import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { BellRing, Volume2, VolumeX, X, ChevronRight, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTechnician } from '../context/TechnicianContext';
import { createFaultInbox } from '../utils/faultInbox';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';

export default function TechnicianAlertCenter({ settingsOpen, onCloseSettings }) {
  const { TECH, urgencyColor, preference: appearance, setMode, ready: themeReady } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const {t}=useTranslation();
  const {jobs,hasLoaded,technicianId,openJob}=useTechnician();
  const player=useAudioPlayer(require('../../../assets/technician-alert.wav'));
  const status=useAudioPlayerStatus(player);
  const [enabled,setEnabled]=useState(Platform.OS!=='web');
  const [ready,setReady]=useState(false),[latestId,setLatestId]=useState(null),[soundError,setSoundError]=useState(false);
  const inbox=useRef(createFaultInbox()),pendingSound=useRef(false);
  const playGeneration=useRef(0);
  const preference=`technician-alert-sound:${technicianId}`;
  useEffect(()=>{
    let active=true;
    inbox.current=createFaultInbox();pendingSound.current=false;setLatestId(null);setReady(false);
    setEnabled(Platform.OS!=='web');setSoundError(false);
    AsyncStorage.getItem(preference).then(value=>{if(active && value!==null)setEnabled(value==='true');})
      .catch(()=>{}).finally(()=>{if(active)setReady(true);});
    return()=>{active=false;pendingSound.current=false;++playGeneration.current;};
  },[preference]);

  const play=useCallback(async()=>{
    const generation=++playGeneration.current;
    try {
      await setAudioModeAsync({playsInSilentMode:false,shouldPlayInBackground:false,interruptionMode:'mixWithOthers'});
      if(generation!==playGeneration.current)return;
      player.volume=0.7;
      await player.seekTo(0);
      if(generation!==playGeneration.current || (AppState.currentState && AppState.currentState!=='active'))return;
      player.play();setSoundError(false);
    } catch {setSoundError(true);}
  },[player]);
  useEffect(()=>{
    if(!hasLoaded)return;
    const incoming=inbox.current.update(jobs);
    if(!incoming.length)return;
    setLatestId(incoming[0].id);
    pendingSound.current=ready && enabled && (!AppState.currentState || AppState.currentState==='active') ? incoming[0].id : false;
  },[jobs,hasLoaded,enabled,ready,technicianId]);
  useEffect(()=>{
    if(!pendingSound.current)return;
    if(!jobs.some(job=>job.id===pendingSound.current && job.status==='pending')){pendingSound.current=false;return;}
    if(!status.isLoaded || !enabled)return;
    pendingSound.current=false;play();
  },[jobs,latestId,status.isLoaded,enabled,play]);
  const toggle=async()=>{
    const next=!enabled;
    ++playGeneration.current;pendingSound.current=false;setEnabled(next);
    if(next && status.isLoaded)play();else if(!next)player.pause();
    try{await AsyncStorage.setItem(preference,String(next));}catch{/* Preference remains usable for this session. */}
  };
  const latest=jobs.find(job=>job.id===latestId && job.status==='pending');
  return (
    <>
      <Modal visible={settingsOpen} transparent animationType="fade" onRequestClose={onCloseSettings}>
        <SafeAreaView style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCloseSettings} accessibilityLabel={t('technician.design.closeSettings')} />
          <View style={styles.sheet} accessibilityViewIsModal>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{t('technician.design.settings')}</Text>
                <Pressable onPress={onCloseSettings} accessibilityRole="button" accessibilityLabel={t('technician.design.closeSettings')} style={styles.close}><X size={22} color={TECH.text}/></Pressable>
              </View>
              <Text style={styles.heading}>{t('technician.design.appearance')}</Text>
              <View style={styles.appearance}>
                {[['system',Smartphone],['light',Sun],['dark',Moon]].map(([key,Icon])=><Pressable key={key} onPress={()=>setMode(key)} disabled={!themeReady}
                  accessibilityRole="radio" aria-checked={appearance===key} accessibilityState={{checked:appearance===key, disabled:!themeReady}}
                  accessibilityLabel={t(`technician.design.${key}`)} style={[styles.choice,appearance===key&&styles.enabled]}>
                  <Icon size={22} color={appearance===key?TECH.orange:TECH.textSecondary}/><Text style={styles.buttonText}>{t(`technician.design.${key}`)}</Text>
                </Pressable>)}
              </View>
              <View style={styles.divider}/>
      <View style={styles.controls}>
        <View style={styles.label}>
          <Text style={styles.heading}>{t('technician.alerts.title')}</Text>
          <Text style={styles.caption}>{t('technician.alerts.foreground')}</Text>
        </View>
        <Pressable onPress={toggle} disabled={!ready} accessibilityRole="switch" accessibilityState={{checked:enabled,disabled:!ready}} accessibilityLabel={t('technician.alerts.sound')} style={[styles.button,enabled&&styles.enabled]}>
          {enabled?<Volume2 size={15} color={TECH.orange}/>:<VolumeX size={15} color={TECH.textSecondary}/>}
          <Text style={styles.buttonText}>{t(enabled?'technician.alerts.soundOn':'technician.alerts.soundOff')}</Text>
        </Pressable>
        <Pressable onPress={play} disabled={!status.isLoaded} accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>{t('technician.alerts.test')}</Text>
        </Pressable>
      </View>
      {soundError?<Text style={styles.help}>{t('technician.alerts.soundError')}</Text>:null}
      {Platform.OS==='web'?<Text style={styles.help}>{t('technician.alerts.browserHelp')}</Text>:null}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
      {latest ? <View style={styles.container}>
      <View style={[styles.incident,{borderColor:urgencyColor(latest.urgency)}]} accessibilityLiveRegion="polite">
        <View style={styles.incidentTop}>
          <BellRing size={19} color={urgencyColor(latest.urgency)}/>
          <Text style={styles.incidentLabel}>{t('technician.alerts.newFault')}</Text>
          <Pressable onPress={()=>setLatestId(null)} accessibilityRole="button" accessibilityLabel={t('technician.alerts.dismiss')} style={styles.close}><X size={17} color={TECH.textSecondary}/></Pressable>
        </View>
        <Text style={styles.incidentTitle}>{latest.title}</Text>
        <Text style={styles.caption}>{latest.ticketCode} · {latest.errorCode} · {latest.clientName}</Text>
        <Pressable onPress={()=>{openJob(latest.id);setLatestId(null);}} style={styles.review} accessibilityRole="button">
          <Text style={styles.reviewText}>{t('technician.alerts.review')}</Text><ChevronRight size={15} color={TECH.orange}/>
        </Pressable>
      </View>
      </View> : null}
    </>
  );
}
const createStyles = TECH => StyleSheet.create({
  backdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end',alignItems:'center'},
  sheet:{backgroundColor:TECH.card,width:'100%',maxWidth:520,borderTopLeftRadius:24,borderTopRightRadius:24,maxHeight:'90%'},
  sheetContent:{padding:24,gap:16,paddingBottom:28},
  sheetHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  sheetTitle:{fontSize:22,fontWeight:'700',color:TECH.text},
  close:{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'},
  appearance:{flexDirection:'row',gap:8},
  choice:{flex:1,minHeight:80,borderWidth:1,borderColor:TECH.borderStrong,borderRadius:12,alignItems:'center',justifyContent:'center',gap:9},
  divider:{height:1,backgroundColor:TECH.border},
  container:{paddingHorizontal:20,paddingTop:12,paddingBottom:2,gap:8},
  controls:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:7},
  label:{flexGrow:1,flexBasis:130,gap:3},heading:{fontSize:12,fontWeight:'700',color:TECH.text},
  caption:{fontSize:12,lineHeight:18,color:TECH.textSecondary},
  button:{minHeight:44,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:12,paddingVertical:10,borderRadius:10,borderWidth:1,borderColor:TECH.borderStrong,backgroundColor:TECH.card},
  enabled:{borderColor:TECH.orangeBorder,backgroundColor:TECH.orangeSoft},buttonText:{fontSize:12,fontWeight:'600',color:TECH.text},
  help:{fontSize:12,lineHeight:18,color:TECH.textSecondary},
  incident:{backgroundColor:TECH.cardRaised,borderWidth:1,borderRadius:14,padding:13,gap:7},
  incidentTop:{flexDirection:'row',gap:8,alignItems:'center'},incidentLabel:{flex:1,fontSize:12,fontWeight:'600',color:TECH.text},
  incidentTitle:{fontSize:14,fontWeight:'700',color:TECH.text},review:{minHeight:44,flexDirection:'row',alignItems:'center',gap:4,alignSelf:'flex-start',paddingVertical:5},
  reviewText:{fontSize:13,fontWeight:'600',color:TECH.orange},
});

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TouchableWithoutFeedback
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { 
  SlidersHorizontal, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Check, 
  Lock 
} from 'lucide-react-native';

/**
 * SOL-185: Dashboard Widget Customization & Reordering UI Modal
 * Enables members to reorder dashboard sections and toggle widget visibility.
 */
export const WidgetCustomizerModal = ({
  visible,
  onClose,
  layout = [],
  onSaveLayout,
  onResetLayout,
}) => {
  const { t } = useTranslation();
  const [currentLayout, setCurrentLayout] = useState(layout);

  useEffect(() => {
    setCurrentLayout(layout);
  }, [layout, visible]);

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...currentLayout];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setCurrentLayout(updated);
  };

  const handleMoveDown = (index) => {
    if (index === currentLayout.length - 1) return;
    const updated = [...currentLayout];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setCurrentLayout(updated);
  };

  const handleToggleVisible = (id) => {
    setCurrentLayout(prev =>
      prev.map(item => {
        if (item.id === id) {
          if (item.locked) return item; // Locked items cannot be hidden
          return { ...item, visible: !item.visible };
        }
        return item;
      })
    );
  };

  const handleSave = () => {
    if (onSaveLayout) {
      onSaveLayout(currentLayout);
    }
    onClose();
  };

  const handleReset = () => {
    if (onResetLayout) {
      onResetLayout();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.modalCard, GLASS.card, SHADOWS.glass]}>
              {/* Modal Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.iconCircle}>
                    <SlidersHorizontal size={16} color={COLORS.amberLight} />
                  </View>
                  <View>
                    <Text style={styles.title}>{t('member.widgetCustomizer.title')}</Text>
                    <Text style={styles.subtitle}>{t('member.widgetCustomizer.subtitle')}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Widget List */}
              <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {currentLayout.map((item, index) => {
                  const isFirst = index === 0;
                  const isLast = index === currentLayout.length - 1;

                  return (
                    <View 
                      key={item.id} 
                      style={[
                        styles.widgetRow, 
                        !item.visible && styles.widgetRowHidden
                      ]}
                    >
                      {/* Reorder Arrows */}
                      <View style={styles.reorderControls}>
                        <TouchableOpacity
                          style={[styles.arrowBtn, isFirst && styles.arrowBtnDisabled]}
                          onPress={() => handleMoveUp(index)}
                          disabled={isFirst}
                        >
                          <ChevronUp size={16} color={isFirst ? COLORS.textMuted : COLORS.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.arrowBtn, isLast && styles.arrowBtnDisabled]}
                          onPress={() => handleMoveDown(index)}
                          disabled={isLast}
                        >
                          <ChevronDown size={16} color={isLast ? COLORS.textMuted : COLORS.textPrimary} />
                        </TouchableOpacity>
                      </View>

                      {/* Widget Label & Status */}
                      <View style={styles.widgetInfo}>
                        <View style={styles.labelLine}>
                          <Text style={[styles.widgetLabel, !item.visible && styles.textMuted]}>
                            {t(item.labelKey)}
                          </Text>
                          {item.locked && (
                            <View style={styles.lockedBadge}>
                              <Lock size={10} color={COLORS.amberLight} />
                              <Text style={styles.lockedText}>{t('member.widgetCustomizer.core')}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.widgetIndexText}>{t('member.widgetCustomizer.position', { number: index + 1 })}</Text>
                      </View>

                      {/* Visibility Switch */}
                      <View style={styles.toggleContainer}>
                        {item.locked ? (
                          <View style={styles.alwaysVisiblePill}>
                            <Eye size={14} color={COLORS.tealLight} />
                          </View>
                        ) : (
                          <Switch
                            value={item.visible}
                            onValueChange={() => handleToggleVisible(item.id)}
                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: COLORS.tealLight }}
                            thumbColor={item.visible ? '#FFFFFF' : '#888888'}
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Footer Actions */}
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.resetBtn} 
                  onPress={handleReset}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={14} color={COLORS.textSecondary} />
                  <Text style={styles.resetBtnText}>{t('member.widgetCustomizer.reset')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.saveBtn} 
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>{t('member.widgetCustomizer.applyLayout')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#1A1817',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textBright,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    maxHeight: 380,
  },
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  widgetRowHidden: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  reorderControls: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 10,
    gap: 2,
  },
  arrowBtn: {
    width: 28,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
  },
  arrowBtnDisabled: {
    opacity: 0.25,
  },
  widgetInfo: {
    flex: 1,
    gap: 2,
  },
  labelLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  widgetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lockedText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.amberLight,
  },
  widgetIndexText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  textMuted: {
    color: COLORS.textMuted,
  },
  toggleContainer: {
    marginLeft: 8,
  },
  alwaysVisiblePill: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.amber,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

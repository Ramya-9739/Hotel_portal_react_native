// =============================================================================
// src/components/ComponentEditorModal.js
// Modal for Creating and Editing Display Components
// Features live image preview, quadrant selectors, quick presets, and validation.
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DisplayComponent from './DisplayComponent';

// Quadrant Definition Options (Matches Supervisor Standard: 1: Center, 2: Top, 3: Left, 4: Right, 5: Bottom)
const QUADRANT_OPTIONS = [
  { type: 1, label: 'Center 40%', sub: 'Hotel Showcase', icon: '👑', color: '#A78BFA' },
  { type: 2, label: 'Top Panel', sub: 'Attractions', icon: '🏛️', color: '#818CF8' },
  { type: 3, label: 'Left Panel', sub: 'Shopping', icon: '🛍️', color: '#FBBF24' },
  { type: 4, label: 'Right Panel', sub: 'Transit & Care', icon: '🏥', color: '#38BDF8' },
  { type: 5, label: 'Bottom Panel', sub: 'Cafes & Dining', icon: '☕', color: '#34D399' },
];

// Quick Image Presets for convenient testing
const IMAGE_PRESETS = [
  {
    name: 'Palace Resort',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80',
  },
  {
    name: 'Heritage Landmark',
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
  },
  {
    name: 'Luxury Mall',
    url: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800&q=80',
  },
  {
    name: 'Skyline Cafe',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  },
  {
    name: 'Modern Hospital',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  },
];

export default function ComponentEditorModal({
  visible,
  mode = 'create', // 'create' | 'edit'
  initialData = null,
  onSave,
  onCancel,
  isSaving = false,
}) {
  const isEdit = mode === 'edit';

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [componentType, setComponentType] = useState(2);
  const [shortDescription, setShortDescription] = useState('');
  const [customerRatings, setCustomerRatings] = useState('4.8');
  const [likes, setLikes] = useState('2500');
  const [priority, setPriority] = useState('1');
  const [formError, setFormError] = useState('');

  // Hydrate fields when opening or switching mode
  useEffect(() => {
    if (visible) {
      if (initialData && isEdit) {
        setTitle(initialData.title || '');
        setSubtitle(initialData.subtitle || '');
        setImageLink(initialData.imageLink || '');
        setComponentType(initialData.componentType !== undefined ? parseInt(initialData.componentType, 10) : 2);
        setShortDescription(initialData.shortDescription || initialData.description || '');
        setCustomerRatings(String(initialData.customerRatings || initialData.rating || 4.8));
        setLikes(String(initialData.likes || 0));
        setPriority(String(initialData.priority || 1));
      } else {
        // Reset to fresh create form
        setTitle('');
        setSubtitle('');
        setImageLink('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80');
        setComponentType(2);
        setShortDescription('');
        setCustomerRatings('4.85');
        setLikes('1500');
        setPriority('1');
      }
      setFormError('');
    }
  }, [visible, initialData, isEdit]);

  const handleSubmit = () => {
    if (!title.trim()) {
      setFormError('Please enter a component title.');
      return;
    }
    if (!imageLink.trim()) {
      setFormError('Please enter a background image URL.');
      return;
    }

    const ratingsNum = parseFloat(customerRatings);
    if (isNaN(ratingsNum) || ratingsNum < 0 || ratingsNum > 5.0) {
      setFormError('Customer ratings must be a number between 0.0 and 5.0');
      return;
    }

    const likesNum = parseInt(likes, 10);
    if (isNaN(likesNum) || likesNum < 0) {
      setFormError('Likes count must be 0 or higher.');
      return;
    }

    const priorityNum = parseInt(priority, 10);
    if (isNaN(priorityNum) || priorityNum < 1) {
      setFormError('Priority rank must be 1 or higher.');
      return;
    }

    setFormError('');

    const payload = {
      ...(initialData && isEdit ? { ...initialData } : {}),
      title: title.trim(),
      subtitle: subtitle.trim(),
      imageLink: imageLink.trim(),
      componentType: parseInt(componentType, 10),
      shortDescription: shortDescription.trim(),
      customerRatings: ratingsNum,
      likes: likesNum,
      priority: priorityNum,
    };

    onSave && onSave(payload);
  };

  // Preview Object for Real-Time Display Component Rendering
  const previewItem = {
    id: initialData?.id || 'preview-temp',
    title: title || 'Component Title Preview',
    subtitle: subtitle || 'Subtitle and Category Tagline',
    imageLink: imageLink || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    componentType: componentType,
    shortDescription: shortDescription || 'This is how your short description will appear on the hotel portal screen with clean 2-line wrapping.',
    customerRatings: parseFloat(customerRatings) || 4.8,
    likes: parseInt(likes, 10) || 1200,
    priority: parseInt(priority, 10) || 1,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={[styles.modeBadge, isEdit ? styles.editBadge : styles.createBadge]}>
                <Text style={styles.modeBadgeText}>
                  {isEdit ? 'EDIT COMPONENT' : 'NEW COMPONENT'}
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                {isEdit ? `Edit: ${initialData?.title || 'Component'}` : 'Add Display Component'}
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {formError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          {/* Content Area with 2 Columns on Desktop */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Form Fields Section */}
            <View style={styles.formSection}>
              {/* 1. Component Quadrant Selection */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Quadrant Placement (componentType):</Text>
                <View style={styles.quadrantGrid}>
                  {QUADRANT_OPTIONS.map((opt) => {
                    const isSelected = componentType === opt.type;
                    return (
                      <TouchableOpacity
                        key={opt.type}
                        activeOpacity={0.8}
                        onPress={() => setComponentType(opt.type)}
                        style={[
                          styles.quadrantBtn,
                          isSelected && [styles.quadrantBtnActive, { borderColor: opt.color }],
                        ]}
                      >
                        <Text style={styles.quadrantIcon}>{opt.icon}</Text>
                        <View>
                          <Text style={[styles.quadrantLabel, isSelected && { color: opt.color }]}>
                            {opt.label}
                          </Text>
                          <Text style={styles.quadrantSub}>{opt.sub}</Text>
                        </View>
                        {isSelected && <Text style={[styles.selectedCheck, { color: opt.color }]}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2. Title & Subtitle */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Title *:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., City Center Palace & Heritage Grounds"
                    placeholderTextColor="#64748B"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Subtitle:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Sayyaji Rao Road / Contour Road"
                    placeholderTextColor="#64748B"
                    value={subtitle}
                    onChangeText={setSubtitle}
                  />
                </View>
              </View>

              {/* 3. Image Link & Quick Presets */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text style={styles.fieldLabel}>Background Image URL (imageLink) *:</Text>
                  <Text style={styles.helperNotice}>Instant Live Preview</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor="#64748B"
                  value={imageLink}
                  onChangeText={setImageLink}
                  autoCapitalize="none"
                />

                {/* Quick Presets Pills */}
                <View style={styles.presetRow}>
                  <Text style={styles.presetLabel}>Presets:</Text>
                  {IMAGE_PRESETS.map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setImageLink(p.url)}
                      style={styles.presetPill}
                    >
                      <Text style={styles.presetPillText}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 4. Short Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Short Description (2-line wrap):</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Brief summary shown on the card..."
                  placeholderTextColor="#64748B"
                  value={shortDescription}
                  onChangeText={setShortDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 5. Metrics Row: Ratings, Likes, Priority */}
              <View style={styles.rowThreeCols}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Customer Ratings (★):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="4.85"
                    placeholderTextColor="#64748B"
                    value={customerRatings}
                    onChangeText={setCustomerRatings}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Likes Count (♥):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="3500"
                    placeholderTextColor="#64748B"
                    value={likes}
                    onChangeText={setLikes}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Priority Rank (#):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="1"
                    placeholderTextColor="#64748B"
                    value={priority}
                    onChangeText={setPriority}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Live Interactive Preview Box */}
            <View style={styles.previewBoxContainer}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>✨ Live Card Preview (Prompt 3 Design)</Text>
                <Text style={styles.previewSub}>
                  Renders background image, title, subtitle, description, likes & ratings in real-time.
                </Text>
              </View>
              <View style={styles.previewCardWrapper}>
                <DisplayComponent
                  item={previewItem}
                  orientation={componentType === 1 || componentType === 3 ? 'vertical' : 'horizontal'}
                  cardWidth={340}
                />
              </View>
            </View>
          </ScrollView>

          {/* Modal Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              disabled={isSaving}
              style={styles.btnCancel}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit}
              disabled={isSaving}
              style={[styles.btnSave, isSaving && styles.btnDisabled]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.btnSaveIcon}>{isEdit ? '💾' : '➕'}</Text>
                  <Text style={styles.btnSaveText}>
                    {isEdit ? 'Save Changes' : 'Create Component'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  modalContainer: {
    width: '100%',
    maxWidth: 780,
    maxHeight: '92%',
    backgroundColor: '#0F131E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(99, 102, 241, 0.2)',
      },
      default: {
        elevation: 10,
      },
    }),
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: 'rgba(15, 19, 30, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  createBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  editBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  modeBadgeText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 22,
    marginTop: 12,
    borderRadius: 6,
  },
  errorIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 22,
    gap: 18,
  },
  formSection: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  labelWithActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperNotice: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '600',
  },
  quadrantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quadrantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quadrantBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  quadrantIcon: {
    fontSize: 16,
  },
  quadrantLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  quadrantSub: {
    color: '#94A3B8',
    fontSize: 9,
  },
  selectedCheck: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  rowThreeCols: {
    flexDirection: 'row',
    gap: 12,
  },
  textInput: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 13,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  presetLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  presetPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  previewBoxContainer: {
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  previewHeader: {
    gap: 2,
  },
  previewTitle: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  previewSub: {
    color: '#64748B',
    fontSize: 10,
  },
  previewCardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 19, 30, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnCancel: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  btnCancelText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  btnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#6366F1',
  },
  btnSaveIcon: {
    fontSize: 14,
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

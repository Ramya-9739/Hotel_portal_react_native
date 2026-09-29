// =============================================================================
// src/components/ConfirmDeleteModal.js
// Safe Confirmation Modal for Deleting Display Components
// =============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { getCategoryMeta } from './DisplayComponent';

export default function ConfirmDeleteModal({
  visible,
  item,
  onConfirm,
  onCancel,
  isDeleting = false,
}) {
  if (!item) return null;

  const meta = getCategoryMeta(item.componentType);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header Warning */}
          <View style={styles.headerRow}>
            <View style={styles.warningIconBadge}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Delete Display Component?</Text>
              <Text style={styles.modalSubtitle}>
                This action will remove the component from the backend REST API and live displays.
              </Text>
            </View>
          </View>

          {/* Component Preview Card */}
          <View style={styles.itemPreviewBox}>
            {item.imageLink ? (
              <Image
                source={{ uri: item.imageLink }}
                style={styles.itemThumbnail}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.itemInfo}>
              <View style={[styles.categoryPill, { backgroundColor: meta.badgeBg, borderColor: meta.borderColor }]}>
                <Text style={styles.categoryIcon}>{meta.icon}</Text>
                <Text style={[styles.categoryText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemSubtitle} numberOfLines={1}>
                {item.subtitle || 'No subtitle'}
              </Text>
              <Text style={styles.itemMeta}>
                Priority #{item.priority} • ★ {item.customerRatings || 4.8} • ♥ {item.likes || 0}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              disabled={isDeleting}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onConfirm && onConfirm(item)}
              disabled={isDeleting}
              style={[styles.deleteButton, isDeleting && styles.disabledButton]}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.deleteButtonIcon}>🗑️</Text>
                  <Text style={styles.deleteButtonText}>Delete Component</Text>
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
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F131E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  warningIcon: {
    fontSize: 22,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  itemPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 24,
  },
  itemThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#1E293B',
  },
  itemInfo: {
    flex: 1,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  itemTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 4,
  },
  itemMeta: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
  },
  deleteButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

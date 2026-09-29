// =============================================================================
// src/components/ScanToMobileModal.js
// "Scan & Take on Phone" QR Code Modal & VIP Guest Privilege Pass
// Generates live scannable QR code, Google Maps GPS route, and hotel discount pass.
// =============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { getCategoryMeta } from './DisplayComponent';

export default function ScanToMobileModal({
  visible,
  item,
  component,
  hotel,
  onClose,
}) {
  const targetItem = item || component;
  if (!targetItem) return null;

  const hotelName = hotel?.name || 'Hotel Concierge';
  const meta = getCategoryMeta(targetItem.componentType);

  // Dynamic directions URL using active hotel if available
  const googleMapsUrl = (hotel?.latitude && hotel?.longitude && targetItem?.latitude && targetItem?.longitude)
    ? `https://www.google.com/maps/dir/?api=1&origin=${hotel.latitude},${hotel.longitude}&destination=${targetItem.latitude},${targetItem.longitude}&travelmode=driving`
    : (targetItem.externalUrl && targetItem.externalUrl.includes('google.com/maps')
        ? targetItem.externalUrl
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${targetItem.title} ${targetItem.location || targetItem.address || hotel?.city || ''}`)}`);

  // QR Code URL encoding the Google Maps link
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(googleMapsUrl)}`;

  const passCode = `${(hotel?.name || 'HOTEL').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-VIP-${targetItem.id ? String(targetItem.id).substring(0, 6).toUpperCase() : 'PASS'}`;

  // Prefilled WhatsApp message
  const whatsappText = encodeURIComponent(
    `Hello! Here is the route and Hotel Guest Privilege Pass for *${targetItem.title}*:\n📍 Directions: ${googleMapsUrl}\n🎟️ Resident Pass Code: ${passCode}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  const handleOpenMaps = () => {
    Linking.openURL(googleMapsUrl).catch((err) =>
      console.warn('Could not open Maps link:', err)
    );
  };

  const handleShareWhatsApp = () => {
    Linking.openURL(whatsappUrl).catch((err) =>
      console.warn('Could not open WhatsApp link:', err)
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.crestCircle}>
                <Text style={styles.crestIcon}>📱</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>{hotelName.toUpperCase()} CONCIERGE</Text>
                <Text style={styles.mainTitle}>Scan & Take on Your Phone</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Place Summary Strip */}
          <View style={styles.placeStrip}>
            <Image
              source={{ uri: targetItem.imageLink }}
              style={styles.stripThumbnail}
              resizeMode="cover"
            />
            <View style={styles.stripInfo}>
              <View style={[styles.categoryBadge, { backgroundColor: meta.badgeBg, borderColor: meta.borderColor }]}>
                <Text style={styles.categoryIcon}>{meta.icon}</Text>
                <Text style={[styles.categoryText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <Text style={styles.stripTitle} numberOfLines={1}>
                {targetItem.title}
              </Text>
              <Text style={styles.stripMeta}>
                ★ {targetItem.customerRatings || 4.85} • Priority #{targetItem.priority || 1} • Resident Privilege Partner
              </Text>
            </View>
          </View>

          {/* Main Body: QR Code & VIP Pass */}
          <View style={styles.contentBody}>
            {/* Left Box: Scannable QR Code */}
            <View style={styles.qrContainer}>
              <View style={styles.qrFrame}>
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.scanHelper}>
                📷 Point your phone camera to scan directions
              </Text>

              {/* Direct Buttons */}
              <View style={styles.directActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleOpenMaps}
                  style={styles.btnMaps}
                >
                  <Text style={styles.btnMapsIcon}>🗺️</Text>
                  <Text style={styles.btnMapsText}>Open Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleShareWhatsApp}
                  style={styles.btnWhatsApp}
                >
                  <Text style={styles.btnWhatsAppIcon}>💬</Text>
                  <Text style={styles.btnWhatsAppText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Box: Luxury VIP Privilege Pass */}
            <View style={styles.vipPassCard}>
              <View style={styles.vipPassHeader}>
                <Text style={styles.vipCrown}>👑</Text>
                <Text style={styles.vipPassTitle}>HOTEL GUEST PRIVILEGE PASS</Text>
              </View>

              <View style={styles.discountBox}>
                <Text style={styles.discountLarge}>15% OFF</Text>
                <Text style={styles.discountSub}>+ Complimentary Welcome Drink / Fast-Track Pass</Text>
              </View>

              <View style={styles.barcodeBox}>
                {/* Visual Barcode Bars */}
                <View style={styles.barcodeVisual}>
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2].map((w, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.barcodeBar,
                        { width: w * 2.2, height: 26, backgroundColor: idx % 2 === 0 ? '#E2E8F0' : '#64748B' },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.voucherCodeText}>
                  CODE: {passCode}
                </Text>
              </View>

              <View style={styles.termsBox}>
                <Text style={styles.termsText}>
                  ✓ Valid for registered {hotelName} guests & residents.
                </Text>
                <Text style={styles.termsText}>
                  ✓ Show barcode at venue billing counter for instant privilege.
                </Text>
              </View>
            </View>
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
  modalCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#0F131E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.25)',
      },
      default: {
        elevation: 12,
      },
    }),
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 19, 30, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crestCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crestIcon: {
    fontSize: 18,
  },
  brandTitle: {
    color: '#D4AF37',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  placeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  stripThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  stripInfo: {
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    gap: 3,
    marginBottom: 2,
  },
  categoryIcon: {
    fontSize: 9,
  },
  categoryText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stripTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stripMeta: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  contentBody: {
    flexDirection: 'row',
    padding: 20,
    gap: 18,
    flexWrap: 'wrap',
  },
  qrContainer: {
    flex: 1,
    minWidth: 230,
    alignItems: 'center',
    backgroundColor: 'rgba(11, 14, 22, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 10,
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  qrImage: {
    width: 140,
    height: 140,
  },
  scanHelper: {
    color: '#94A3B8',
    fontSize: 10.5,
    textAlign: 'center',
    fontWeight: '600',
  },
  directActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  btnMaps: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  btnMapsIcon: {
    fontSize: 11,
  },
  btnMapsText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  btnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  btnWhatsAppIcon: {
    fontSize: 11,
  },
  btnWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  vipPassCard: {
    flex: 1.2,
    minWidth: 250,
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  vipPassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    paddingBottom: 8,
  },
  vipCrown: {
    fontSize: 14,
  },
  vipPassTitle: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  discountBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  discountLarge: {
    color: '#FDE68A',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  discountSub: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  barcodeBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  barcodeVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  barcodeBar: {
    borderRadius: 1,
  },
  voucherCodeText: {
    color: '#D4AF37',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  termsBox: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  termsText: {
    color: '#94A3B8',
    fontSize: 9.5,
    lineHeight: 13,
  },
});

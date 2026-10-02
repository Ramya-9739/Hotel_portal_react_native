// =============================================================================
// src/screens/SuperAdminDashboardScreen.js
// Dedicated Platform Super Admin Console
// Features:
// 1. Hotel Approval Requests Queue with real backend data
// 2. Interactive Review: [View], [Accept], [Reject]
// 3. Complete Hotel View Modal (Address, GPS, Owner, Description, 8 Images)
// 4. Rejection Modal with custom explanation reason
// 5. Filter tabs: Pending, Approved, Rejected, All
// 6. Loading, Empty, and Error states
// 7. Full luxury styling matching existing project aesthetics
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Modal,
  TextInput,
} from 'react-native';

import { apiService } from '../services/apiService';
import { authService } from '../services/authService';

export default function SuperAdminDashboardScreen({
  onBackToGuestPortal,
  onSwitchToOwnerAdmin,
  onLogout,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isTablet = width >= 600 && width < 900;

  const [hotels, setHotels] = useState([]);
  const [filterTab, setFilterTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [viewingHotel, setViewingHotel] = useState(null);
  const [rejectingHotel, setRejectingHotel] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const currentUser = authService.getUser();

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  const loadHotels = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiService.fetchHotels();
      if (res.success && Array.isArray(res.data)) {
        setHotels(res.data);
      } else {
        setErrorMessage(res.error || 'Unable to load hotel requests.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load hotel requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const handleAccept = async (hotel) => {
    const id = hotel.hotelPropertyId || hotel.id || hotel._id;
    setActionLoadingId(id);
    try {
      const res = await apiService.approveHotel(id);
      if (res.success) {
        showToast(`✅ "${hotel.name || hotel.title}" has been APPROVED and is now live for guests!`, 'success');
        setHotels((prev) =>
          prev.map((h) => {
            const hId = h.hotelPropertyId || h.id || h._id;
            return hId === id ? { ...h, status: 'approved', rejectionReason: '' } : h;
          })
        );
        if (viewingHotel && (viewingHotel.hotelPropertyId === id || viewingHotel.id === id || viewingHotel._id === id)) {
          setViewingHotel({ ...viewingHotel, status: 'approved', rejectionReason: '' });
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to approve hotel.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (hotel) => {
    setRejectingHotel(hotel);
    setRejectionReasonInput(hotel.rejectionReason || 'Incomplete hotel information or unverified location.');
  };

  const handleConfirmReject = async () => {
    if (!rejectingHotel) return;
    const id = rejectingHotel.hotelPropertyId || rejectingHotel.id || rejectingHotel._id;
    setActionLoadingId(id);
    try {
      const res = await apiService.rejectHotel(id, rejectionReasonInput.trim());
      if (res.success) {
        showToast(`❌ "${rejectingHotel.name || rejectingHotel.title}" has been REJECTED.`, 'info');
        setHotels((prev) =>
          prev.map((h) => {
            const hId = h.hotelPropertyId || h.id || h._id;
            return hId === id ? { ...h, status: 'rejected', rejectionReason: rejectionReasonInput.trim() } : h;
          })
        );
        if (viewingHotel && (viewingHotel.hotelPropertyId === id || viewingHotel.id === id || viewingHotel._id === id)) {
          setViewingHotel({ ...viewingHotel, status: 'rejected', rejectionReason: rejectionReasonInput.trim() });
        }
        setRejectingHotel(null);
        setRejectionReasonInput('');
      }
    } catch (err) {
      showToast(err.message || 'Failed to reject hotel.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered dataset
  const filteredHotels = hotels.filter((h) => {
    const status = h.status || 'pending';
    if (filterTab !== 'all' && status !== filterTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const name = (h.name || h.title || '').toLowerCase();
      const city = (h.city || h.location || '').toLowerCase();
      const owner = (h.hotelAdminId || '').toLowerCase();
      const address = (h.address || '').toLowerCase();
      return name.includes(q) || city.includes(q) || owner.includes(q) || address.includes(q);
    }
    return true;
  });

  const pendingCount = hotels.filter((h) => (h.status || 'pending') === 'pending').length;
  const approvedCount = hotels.filter((h) => h.status === 'approved').length;
  const rejectedCount = hotels.filter((h) => h.status === 'rejected').length;

  return (
    <View style={styles.rootContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <View
          style={[
            styles.toastContainer,
            toastMessage.type === 'error' && styles.toastError,
            toastMessage.type === 'success' && styles.toastSuccess,
          ]}
        >
          <Text style={styles.toastText}>{toastMessage.text}</Text>
        </View>
      )}

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.crestCircle}>
            <Text style={styles.crestIcon}>👑</Text>
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerTitle}>SUPER ADMIN CONSOLE</Text>
              <View style={styles.badgeSuperAdmin}>
                <Text style={styles.badgeSuperAdminText}>PLATFORM MASTER</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Logged in as {currentUser?.username || 'Super Admin'} ({currentUser?.email || 'admin@hotelportal.com'})
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerNavBtn}
            onPress={onSwitchToOwnerAdmin}
            activeOpacity={0.8}
          >
            <Text style={styles.headerNavBtnText}>🏨 Hotel Owner View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerNavBtn}
            onPress={onBackToGuestPortal}
            activeOpacity={0.8}
          >
            <Text style={styles.headerNavBtnText}>🌐 Guest Website</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.mainScrollContent}>
        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <TouchableOpacity
            style={[styles.metricCard, filterTab === 'pending' && styles.metricCardActive]}
            onPress={() => setFilterTab('pending')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>PENDING APPROVAL</Text>
              <Text style={styles.metricIcon}>⏳</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{pendingCount}</Text>
            <Text style={styles.metricFootnote}>Requires Super Admin decision</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricCard, filterTab === 'approved' && styles.metricCardActive]}
            onPress={() => setFilterTab('approved')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>APPROVED HOTELS</Text>
              <Text style={styles.metricIcon}>✅</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>{approvedCount}</Text>
            <Text style={styles.metricFootnote}>Active on public guest website</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricCard, filterTab === 'rejected' && styles.metricCardActive]}
            onPress={() => setFilterTab('rejected')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>REJECTED HOTELS</Text>
              <Text style={styles.metricIcon}>❌</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>{rejectedCount}</Text>
            <Text style={styles.metricFootnote}>Blocked from public access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricCard, filterTab === 'all' && styles.metricCardActive]}
            onPress={() => setFilterTab('all')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>TOTAL REGISTERED</Text>
              <Text style={styles.metricIcon}>🏢</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#E2C082' }]}>{hotels.length}</Text>
            <Text style={styles.metricFootnote}>Across all hotel owners</Text>
          </TouchableOpacity>
        </View>

        {/* Action & Filter Toolbar */}
        <View style={styles.toolbarCard}>
          <View style={styles.tabsRow}>
            {[
              { id: 'pending', label: 'Pending Review', count: pendingCount },
              { id: 'all', label: 'All Submissions', count: hotels.length },
              { id: 'approved', label: 'Approved', count: approvedCount },
              { id: 'rejected', label: 'Rejected', count: rejectedCount },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterTabBtn, filterTab === tab.id && styles.filterTabBtnActive]}
                onPress={() => setFilterTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterTabBtnText,
                    filterTab === tab.id && styles.filterTabBtnTextActive,
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by hotel name, owner, city, address..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={loadHotels}
              activeOpacity={0.8}
            >
              <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Requests Table Card */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderSection}>
            <View>
              <Text style={styles.tableTitle}>HOTEL APPROVAL REQUESTS</Text>
              <Text style={styles.tableSubtitle}>
                Review submissions, verify hotel details, and grant live guest portal status.
              </Text>
            </View>
            <Text style={styles.tableCountBadge}>
              Showing {filteredHotels.length} of {hotels.length} hotels
            </Text>
          </View>

          {/* Loading State */}
          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#E2C082" />
              <Text style={styles.stateText}>Loading hotel requests from backend...</Text>
            </View>
          ) : errorMessage ? (
            /* Error State */
            <View style={styles.stateContainer}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>⚠️</Text>
              <Text style={[styles.stateText, { color: '#F87171' }]}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadHotels}>
                <Text style={styles.retryBtnText}>Retry Fetching</Text>
              </TouchableOpacity>
            </View>
          ) : filteredHotels.length === 0 ? (
            /* Empty State */
            <View style={styles.stateContainer}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>
                {filterTab === 'pending' ? '✨' : '📋'}
              </Text>
              <Text style={styles.emptyTitle}>
                {filterTab === 'pending'
                  ? 'No pending hotel requests.'
                  : 'No hotels match the selected criteria.'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filterTab === 'pending'
                  ? 'All hotel submissions have been reviewed and approved or rejected.'
                  : 'Try adjusting your search query or switching tabs.'}
              </Text>
            </View>
          ) : (
            /* Table Component */
            <View style={styles.tableWrapper}>
              {/* Header Row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { flex: 2 }]}>HOTEL NAME</Text>
                <Text style={[styles.thCell, { flex: 1.2 }]}>OWNER ID</Text>
                <Text style={[styles.thCell, { flex: 1.4 }]}>LOCATION / CITY</Text>
                <Text style={[styles.thCell, { flex: 1.1 }]}>STATUS</Text>
                <Text style={[styles.thCell, { flex: 2, textAlign: 'right' }]}>ACTIONS</Text>
              </View>

              {/* Data Rows */}
              {filteredHotels.map((item, index) => {
                const id = item.hotelPropertyId || item.id || item._id;
                const status = item.status || 'pending';
                const isItemActionLoading = actionLoadingId === id;

                return (
                  <View
                    key={id || index}
                    style={[
                      styles.tableRow,
                      index % 2 === 1 && styles.tableRowAlt,
                    ]}
                  >
                    {/* Hotel Name + Thumbnail */}
                    <View style={[styles.tdCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                      {item.imageLink || (item.images && item.images[0]) ? (
                        <Image
                          source={{ uri: item.imageLink || item.images[0] }}
                          style={styles.hotelThumb}
                        />
                      ) : (
                        <View style={[styles.hotelThumb, styles.hotelThumbPlaceholder]}>
                          <Text style={{ fontSize: 16 }}>🏨</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.hotelNameText} numberOfLines={1}>
                          {item.name || item.title || 'Untitled Hotel'}
                        </Text>
                        <Text style={styles.hotelSubText} numberOfLines={1}>
                          {item.subtitle || item.address || 'No description'}
                        </Text>
                      </View>
                    </View>

                    {/* Owner */}
                    <View style={[styles.tdCell, { flex: 1.2 }]}>
                      <View style={styles.ownerBadge}>
                        <Text style={styles.ownerBadgeText} numberOfLines={1}>
                          👤 {item.hotelAdminId || 'admin'}
                        </Text>
                      </View>
                    </View>

                    {/* Location */}
                    <View style={[styles.tdCell, { flex: 1.4 }]}>
                      <Text style={styles.locationText} numberOfLines={1}>
                        📍 {item.city || item.location || 'Local Area'}
                      </Text>
                    </View>

                    {/* Status Pill */}
                    <View style={[styles.tdCell, { flex: 1.1 }]}>
                      <View
                        style={[
                          styles.statusPill,
                          status === 'approved' && styles.statusApproved,
                          status === 'rejected' && styles.statusRejected,
                          status === 'pending' && styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            status === 'approved' && { color: '#86EFAC' },
                            status === 'rejected' && { color: '#FCA5A5' },
                            status === 'pending' && { color: '#FCD34D' },
                          ]}
                        >
                          {status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={[styles.tdCell, { flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }]}>
                      <TouchableOpacity
                        style={styles.actionBtnView}
                        onPress={() => setViewingHotel(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnViewText}>👁️ View</Text>
                      </TouchableOpacity>

                      {status !== 'approved' && (
                        <TouchableOpacity
                          style={[styles.actionBtnAccept, isItemActionLoading && { opacity: 0.6 }]}
                          onPress={() => handleAccept(item)}
                          disabled={isItemActionLoading}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.actionBtnAcceptText}>
                            {isItemActionLoading ? '...' : '✓ Accept'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {status !== 'rejected' && (
                        <TouchableOpacity
                          style={[styles.actionBtnReject, isItemActionLoading && { opacity: 0.6 }]}
                          onPress={() => handleOpenRejectModal(item)}
                          disabled={isItemActionLoading}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.actionBtnRejectText}>✕ Reject</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* =================================================================== */}
      {/* 1. COMPLETE HOTEL VIEW MODAL                                        */}
      {/* =================================================================== */}
      {viewingHotel && (
        <Modal
          visible={!!viewingHotel}
          transparent
          animationType="fade"
          onRequestClose={() => setViewingHotel(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, isDesktop && { width: '68%', maxHeight: '90%' }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                      {viewingHotel.name || viewingHotel.title}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        viewingHotel.status === 'approved' && styles.statusApproved,
                        viewingHotel.status === 'rejected' && styles.statusRejected,
                        (!viewingHotel.status || viewingHotel.status === 'pending') && styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          viewingHotel.status === 'approved' && { color: '#86EFAC' },
                          viewingHotel.status === 'rejected' && { color: '#FCA5A5' },
                          (!viewingHotel.status || viewingHotel.status === 'pending') && { color: '#FCD34D' },
                        ]}
                      >
                        {(viewingHotel.status || 'pending').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalHeaderSubtitle}>
                    Submitted by Owner: <Text style={{ color: '#E2C082' }}>{viewingHotel.hotelAdminId || 'admin'}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setViewingHotel(null)}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBodyScroll}>
                {/* Rejection Notice if rejected */}
                {viewingHotel.status === 'rejected' && (
                  <View style={styles.rejectionNoticeCard}>
                    <Text style={styles.rejectionNoticeTitle}>⚠️ REJECTION DETAILS</Text>
                    <Text style={styles.rejectionNoticeText}>
                      {viewingHotel.rejectionReason || 'No specific rejection reason provided.'}
                    </Text>
                  </View>
                )}

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>PROPERTY ID</Text>
                    <Text style={styles.detailValue}>
                      {viewingHotel.hotelPropertyId || viewingHotel.id || viewingHotel._id}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>CITY / AREA</Text>
                    <Text style={styles.detailValue}>{viewingHotel.city || viewingHotel.location || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>CONTACT NUMBER</Text>
                    <Text style={styles.detailValue}>{viewingHotel.contactNumber || viewingHotel.hotelContactNumber || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>PRICE PER NIGHT</Text>
                    <Text style={styles.detailValue}>{viewingHotel.pricePerNight || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>STAR RATING</Text>
                    <Text style={styles.detailValue}>★ {viewingHotel.rating || 4.9} / 5.0</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>GPS LAT / LONG</Text>
                    <Text style={styles.detailValue}>
                      {viewingHotel.latitude != null ? viewingHotel.latitude.toFixed(6) : 'N/A'},{' '}
                      {viewingHotel.longitude != null ? viewingHotel.longitude.toFixed(6) : 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Full Address */}
                <View style={styles.fullAddressCard}>
                  <Text style={styles.detailLabel}>FULL PROPERTY ADDRESS</Text>
                  <Text style={styles.addressText}>{viewingHotel.address || 'No address provided'}</Text>
                </View>

                {/* Description */}
                {viewingHotel.subtitle ? (
                  <View style={styles.fullAddressCard}>
                    <Text style={styles.detailLabel}>TAGLINE / DESCRIPTION</Text>
                    <Text style={styles.addressText}>{viewingHotel.subtitle}</Text>
                  </View>
                ) : null}

                {/* Uploaded Images Gallery (up to 8) */}
                <View style={styles.modalGallerySection}>
                  <Text style={styles.galleryHeading}>
                    📸 UPLOADED HOTEL IMAGES (
                    {Array.isArray(viewingHotel.images) ? viewingHotel.images.length : (viewingHotel.imageLink ? 1 : 0)} / 8 IMAGES)
                  </Text>
                  <View style={styles.galleryGrid}>
                    {(Array.isArray(viewingHotel.images) && viewingHotel.images.length > 0
                      ? viewingHotel.images
                      : viewingHotel.imageLink
                      ? [viewingHotel.imageLink]
                      : []
                    ).map((imgUrl, imgIdx) => (
                      <View key={imgIdx} style={styles.galleryImageCard}>
                        <Image source={{ uri: imgUrl }} style={styles.galleryImageThumb} />
                        <View style={styles.gallerySlotBadge}>
                          <Text style={styles.gallerySlotBadgeText}>Photo #{imgIdx + 1}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer Actions */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalFooterDismissBtn}
                  onPress={() => setViewingHotel(null)}
                >
                  <Text style={styles.modalFooterDismissText}>Close</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {viewingHotel.status !== 'rejected' && (
                    <TouchableOpacity
                      style={styles.modalRejectBtn}
                      onPress={() => {
                        const target = viewingHotel;
                        handleOpenRejectModal(target);
                      }}
                    >
                      <Text style={styles.modalRejectBtnText}>✕ Reject Hotel</Text>
                    </TouchableOpacity>
                  )}

                  {viewingHotel.status !== 'approved' && (
                    <TouchableOpacity
                      style={styles.modalApproveBtn}
                      onPress={() => handleAccept(viewingHotel)}
                    >
                      <Text style={styles.modalApproveBtnText}>✓ Accept & Approve Hotel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* =================================================================== */}
      {/* 2. REJECTION REASON MODAL                                           */}
      {/* =================================================================== */}
      {rejectingHotel && (
        <Modal
          visible={!!rejectingHotel}
          transparent
          animationType="fade"
          onRequestClose={() => setRejectingHotel(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { width: isDesktop ? 540 : '92%' }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeaderTitle}>REJECT HOTEL SUBMISSION</Text>
                  <Text style={styles.modalHeaderSubtitle}>
                    {rejectingHotel.name || rejectingHotel.title}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setRejectingHotel(null)}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ padding: 20 }}>
                <Text style={styles.rejectModalLabel}>REJECTION REASON (COMMUNICATED TO OWNER):</Text>
                <TextInput
                  style={styles.rejectReasonInput}
                  multiline
                  numberOfLines={4}
                  placeholder="e.g. Incomplete address, coordinates do not match location, or missing pictures."
                  placeholderTextColor="#64748B"
                  value={rejectionReasonInput}
                  onChangeText={setRejectionReasonInput}
                />
                <Text style={styles.rejectModalHint}>
                  The hotel owner will see this explanation in their dashboard and can make updates to resubmit.
                </Text>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalFooterDismissBtn}
                  onPress={() => setRejectingHotel(null)}
                >
                  <Text style={styles.modalFooterDismissText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalRejectConfirmBtn}
                  onPress={handleConfirmReject}
                >
                  <Text style={styles.modalRejectConfirmText}>Confirm Rejection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0A0C10',
  },
  headerBar: {
    backgroundColor: '#12151D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  crestCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontFamily: Platform.OS === 'web' ? 'Playfair Display, serif' : undefined,
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  badgeSuperAdmin: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSuperAdminText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerNavBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  headerNavBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  logoutBtnText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 24,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#161922',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 18,
  },
  metricCardActive: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(22, 25, 34, 0.95)',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metricIcon: {
    fontSize: 16,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricFootnote: {
    color: '#64748B',
    fontSize: 11,
  },
  toolbarCard: {
    backgroundColor: '#161922',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabBtnActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: '#D4AF37',
  },
  filterTabBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabBtnTextActive: {
    color: '#E2C082',
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 260,
    justifyContent: 'flex-end',
  },
  searchInput: {
    flex: 1,
    maxWidth: 360,
    backgroundColor: '#0F1117',
    borderWidth: 1,
    borderColor: '#2A2E45',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: '#F8FAFC',
    fontSize: 12,
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '600',
  },
  tableCard: {
    backgroundColor: '#161922',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  tableHeaderSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  tableTitle: {
    fontFamily: Platform.OS === 'web' ? 'Playfair Display, serif' : undefined,
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  tableSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  tableCountBadge: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '600',
  },
  tableWrapper: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#12151D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  thCell: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  tdCell: {
    justifyContent: 'center',
  },
  hotelThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  hotelThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelNameText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  hotelSubText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  ownerBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  ownerBadgeText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  locationText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusApproved: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  actionBtnView: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnViewText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtnAccept: {
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnAcceptText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnReject: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnRejectText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
  },
  stateContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#161922',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    width: '100%',
    maxHeight: '92%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#12151D',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  modalBodyScroll: {
    padding: 22,
  },
  rejectionNoticeCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  rejectionNoticeTitle: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  rejectionNoticeText: {
    color: '#FECACA',
    fontSize: 13,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#0F1117',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  detailValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  fullAddressCard: {
    backgroundColor: '#0F1117',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  addressText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  modalGallerySection: {
    marginTop: 8,
    marginBottom: 20,
  },
  galleryHeading: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryImageCard: {
    width: 140,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  galleryImageThumb: {
    width: '100%',
    height: '100%',
  },
  gallerySlotBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gallerySlotBadgeText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '700',
  },
  modalFooter: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: '#12151D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalFooterDismissBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  modalFooterDismissText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  modalRejectBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalRejectBtnText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  modalApproveBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalApproveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectModalLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  rejectReasonInput: {
    backgroundColor: '#0F1117',
    borderWidth: 1,
    borderColor: '#2A2E45',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  rejectModalHint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
  },
  modalRejectConfirmBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalRejectConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 99999,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2C082',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  toastSuccess: {
    borderColor: '#22C55E',
    backgroundColor: '#0D3B1F',
  },
  toastError: {
    borderColor: '#EF4444',
    backgroundColor: '#3B1010',
  },
  toastText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
});

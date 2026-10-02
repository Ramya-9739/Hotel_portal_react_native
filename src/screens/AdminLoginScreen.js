// =============================================================================
// src/screens/AdminLoginScreen.js
// Modern Luxury Administrator Login Screen
// Features:
// 1. Subtle looping background video with luxury hotel atmosphere & graceful fallback
// 2. Smooth GPU-accelerated entrance animation for the login card
// 3. Elegant pulsing crest logo & shimmering star animation
// 4. Staggered fade-in for hotel branding
// 5. Input focus interactions with soft gold border glow and transitions
// 6. Smooth show/hide password toggle
// 7. Interactive Sign-In button with hover elevation and instant success transition
// 8. Integrated One-Click Login (admin / admin123) with hover effect
// 9. Ambient slow-drifting lighting blobs (gold, purple, cyan)
// 10. Security footer notice with graceful delayed reveal
// 11. Responsive design across Desktop, Tablet, and Mobile
// 12. Full accessibility and prefers-reduced-motion support
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { authService } from '../services/authService';
import { activeHotelService } from '../services/activeHotelService';

export default function AdminLoginScreen({ onLoginSuccess, onBackToGuestPortal }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const activeHotel = activeHotelService.getActiveHotel();
  const brandTitle = activeHotel?.name ? activeHotel.name.toUpperCase() : 'HOTEL MANAGEMENT CONSOLE';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Interactive focus states
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Background video state
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Inject Scoped Luxury CSS Keyframes & Micro-Interactions on Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'admin-login-luxury-keyframes';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          /* 1. Entrance animation for the login card */
          @keyframes loginCardEntrance {
            0% {
              opacity: 0;
              transform: translateY(22px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* 2. Slow breathing glow & subtle floating for crest circle */
          @keyframes crestPulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 16px rgba(212, 175, 55, 0.22), 0 0 0 1px rgba(212, 175, 55, 0.35);
            }
            50% {
              transform: scale(1.045);
              box-shadow: 0 0 30px rgba(212, 175, 55, 0.5), 0 0 0 1.5px rgba(212, 175, 55, 0.7);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 16px rgba(212, 175, 55, 0.22), 0 0 0 1px rgba(212, 175, 55, 0.35);
            }
          }

          /* 3. Star shimmer animation */
          @keyframes starShimmer {
            0%, 100% {
              transform: rotate(0deg) scale(1);
              opacity: 0.92;
            }
            50% {
              transform: rotate(14deg) scale(1.1);
              opacity: 1;
            }
          }

          /* 4. Staggered brand header fade-in */
          @keyframes brandFadeIn {
            0% {
              opacity: 0;
              transform: translateY(8px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* 5. Slow ambient drifting light blobs */
          @keyframes ambientBlobFloat1 {
            0% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            50% {
              transform: translate3d(35px, -30px, 0) scale(1.09);
            }
            100% {
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @keyframes ambientBlobFloat2 {
            0% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            50% {
              transform: translate3d(-35px, 25px, 0) scale(1.07);
            }
            100% {
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          /* Class bindings */
          .login-card-animated {
            animation: loginCardEntrance 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
          }

          .crest-circle-animated {
            animation: crestPulse 5.5s ease-in-out infinite !important;
          }

          .star-animated {
            animation: starShimmer 5.5s ease-in-out infinite !important;
            display: inline-block !important;
          }

          .brand-header-animated {
            animation: brandFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both !important;
          }

          .footer-note-animated {
            animation: brandFadeIn 0.8s ease 0.36s both !important;
          }

          .ambient-blob-1 {
            animation: ambientBlobFloat1 22s ease-in-out infinite !important;
          }

          .ambient-blob-2 {
            animation: ambientBlobFloat2 26s ease-in-out infinite !important;
          }

          /* Button Hover Interactions */
          .admin-login-btn {
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .admin-login-btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 8px 26px rgba(99, 102, 241, 0.55), 0 0 22px rgba(212, 175, 55, 0.3) !important;
            filter: brightness(1.08) !important;
          }
          .admin-login-btn:active {
            transform: translateY(0px) scale(0.98) !important;
          }

          .quick-fill-pill {
            transition: all 0.22s ease !important;
          }
          .quick-fill-pill:hover {
            transform: translateY(-1px) !important;
            border-color: rgba(212, 175, 55, 0.5) !important;
            background-color: rgba(99, 102, 241, 0.2) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 14px rgba(212, 175, 55, 0.18) !important;
          }

          .back-btn-hover {
            transition: all 0.2s ease !important;
          }
          .back-btn-hover:hover {
            background-color: rgba(226, 192, 130, 0.18) !important;
            border-color: rgba(226, 192, 130, 0.45) !important;
            transform: translateX(-2px) !important;
          }

          .show-hide-toggle {
            transition: all 0.2s ease !important;
          }
          .show-hide-toggle:hover {
            color: #E2C082 !important;
            transform: scale(1.04) !important;
          }

          /* Accessibility: Respect Reduced Motion */
          @media (prefers-reduced-motion: reduce) {
            .login-card-animated,
            .crest-circle-animated,
            .star-animated,
            .brand-header-animated,
            .footer-note-animated,
            .ambient-blob-1,
            .ambient-blob-2,
            .admin-login-btn,
            .quick-fill-pill,
            .back-btn-hover,
            .show-hide-toggle {
              animation: none !important;
              transition: none !important;
              transform: none !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const handleLogin = async () => {
    if (!username.trim()) {
      setErrorMessage('Please enter your administrator username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await authService.login(username.trim(), password);
      if (result.success) {
        setIsSuccess(true);
        // Short tactical feedback animation before navigating
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(result.user);
          }
        }, 340);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage('Network error connecting to auth server.');
      setIsLoading(false);
    }
  };

  const handleInstantLogin = async (targetUser = 'admin', targetPass = 'admin123') => {
    setUsername(targetUser);
    setPassword(targetPass);
    setErrorMessage('');
    setIsLoading(true);
    try {
      const result = await authService.login(targetUser, targetPass);
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(result.user);
          }
        }, 340);
      } else {
        setErrorMessage(result.error || 'Authentication failed.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage('Network error connecting to auth server.');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* =================================================================== */}
      {/* 1. LAYER 0: BASE LUXURY HOTEL BACKGROUND IMAGE (Guaranteed Fallback) */}
      {/* =================================================================== */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80' }}
        style={styles.backgroundImage}
        blurRadius={Platform.OS === 'web' ? 12 : 8}
        resizeMode="cover"
      >
        {/* =================================================================== */}
        {/* 2. LAYER 1: AMBIENT LUXURY HOTEL LOOPING VIDEO (Web)                */}
        {/* =================================================================== */}
        {Platform.OS === 'web' && !videoFailed && (
          <video
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoFailed(true)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              opacity: videoLoaded ? 0.72 : 0,
              transition: 'opacity 1.2s ease-in-out',
              pointerEvents: 'none',
              filter: 'brightness(0.68) saturate(1.2)',
            }}
          >
            {/* High-reliability luxury hotel chandelier & lobby video stream */}
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-luxury-hotel-reception-hall-and-chandelier-43750-large.mp4"
              type="video/mp4"
            />
          </video>
        )}

        {/* =================================================================== */}
        {/* 3. LAYER 2: DARK LUXURY SCRIM WITH VIGNETTE OVERLAY                  */}
        {/* =================================================================== */}
        <View style={styles.scrimOverlay}>
          {/* ================================================================= */}
          {/* 4. LAYER 3: SUBTLE DRIFTING LIGHT BLOBS (Requirement 9)           */}
          {/* ================================================================= */}
          <View style={styles.ambientLightingContainer} pointerEvents="none">
            {/* Golden hotel light aura */}
            <View
              className="ambient-blob-1"
              style={[styles.ambientBlob, styles.ambientBlobGold]}
            />
            {/* Deep purple concierge glow */}
            <View
              className="ambient-blob-2"
              style={[styles.ambientBlob, styles.ambientBlobPurple]}
            />
            {/* Ambient cyan sheen */}
            <View style={[styles.ambientBlob, styles.ambientBlobBlue]} />
          </View>

          {/* ================================================================= */}
          {/* 5. TOP HEADER BAR                                                 */}
          {/* ================================================================= */}
          <View style={styles.topBar}>
            {onBackToGuestPortal ? (
              <TouchableOpacity
                style={styles.backBtn}
                className="back-btn-hover"
                onPress={onBackToGuestPortal}
                activeOpacity={0.8}
                accessibilityLabel="Back to Hotel Portal"
              >
                <Text style={styles.backBtnIcon}>←</Text>
                <Text style={styles.backBtnText}>Back to Hotel Portal</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            <View style={styles.portalBadge}>
              <Text style={styles.portalBadgeDot}>●</Text>
              <Text style={styles.portalBadgeText}>ADMIN CONSOLE • SECURE ACCESS</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* 6. CENTER LOGIN CARD (Requirements 2, 3, 4, 5, 6, 7, 8, 10)       */}
          {/* ================================================================= */}
          <View style={styles.centerContainer}>
            <View
              className="login-card-animated"
              style={[styles.loginCard, isMobile && styles.loginCardMobile]}
            >
              {/* Hotel Brand Crest & Header */}
              <View className="brand-header-animated" style={styles.brandHeader}>
                {/* Circular Crest with Pulsing Glow (Requirement 3) */}
                <View className="crest-circle-animated" style={styles.crestCircle}>
                  <Text className="star-animated" style={styles.crestIcon}>
                    ✦
                  </Text>
                </View>

                {/* Hotel Title & Console Subtitle (Requirement 4) */}
                <Text style={styles.hotelBrandName}>{brandTitle}</Text>
                <Text style={styles.portalTitle}>Management & Concierge Console</Text>
                <Text style={styles.portalDescription}>
                  Authenticate to manage hotels, places, guest payment status, and execute CRUD operations.
                </Text>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form Controls */}
              <View style={styles.formContainer}>
                {/* Username Input (Requirement 5) */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, usernameFocused && styles.inputLabelFocused]}>
                    Admin Username
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      usernameFocused && styles.inputWrapperFocused,
                    ]}
                  >
                    <Text
                      style={[
                        styles.inputPrefixIcon,
                        usernameFocused && styles.inputPrefixIconFocused,
                      ]}
                    >
                      👤
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter admin username"
                      placeholderTextColor="#64748B"
                      value={username}
                      onFocus={() => setUsernameFocused(true)}
                      onBlur={() => setUsernameFocused(false)}
                      onChangeText={(text) => {
                        setUsername(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Password Input (Requirement 5 & 6) */}
                <View style={styles.inputGroup}>
                  <View style={styles.passwordLabelRow}>
                    <Text style={[styles.inputLabel, passwordFocused && styles.inputLabelFocused]}>
                      Password
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      className="show-hide-toggle"
                      style={styles.showHideButton}
                    >
                      <Text style={styles.showHideText}>
                        {showPassword ? 'Hide 👁️' : 'Show 👁️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      passwordFocused && styles.inputWrapperFocused,
                    ]}
                  >
                    <Text
                      style={[
                        styles.inputPrefixIcon,
                        passwordFocused && styles.inputPrefixIconFocused,
                      ]}
                    >
                      🔒
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter password"
                      placeholderTextColor="#64748B"
                      secureTextEntry={!showPassword}
                      value={password}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                    />
                  </View>
                </View>

                {/* Instant 1-Click Login Options for Roles */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleInstantLogin('admin', 'admin123')}
                    style={[styles.quickFillPill, { flex: 1, marginBottom: 0 }]}
                  >
                    <Text style={styles.quickFillIcon}>👑</Text>
                    <Text style={styles.quickFillText} numberOfLines={1}>
                      Super Admin: <Text style={styles.highlightText}>admin</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleInstantLogin('client', 'client123')}
                    style={[styles.quickFillPill, { flex: 1, marginBottom: 0 }]}
                  >
                    <Text style={styles.quickFillIcon}>🏨</Text>
                    <Text style={styles.quickFillText} numberOfLines={1}>
                      Hotel Owner: <Text style={styles.highlightText}>client</Text>
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button with Hover & Success State (Requirement 7) */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleLogin}
                  disabled={isLoading || isSuccess}
                  className="admin-login-btn"
                  style={[
                    styles.loginButton,
                    isLoading && styles.loginButtonDisabled,
                    isSuccess && styles.loginButtonSuccess,
                  ]}
                >
                  {isSuccess ? (
                    <>
                      <Text style={styles.loginButtonSuccessIcon}>✓</Text>
                      <Text style={styles.loginButtonText}>Access Granted • Entering Console...</Text>
                    </>
                  ) : isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In to Admin Console</Text>
                      <Text style={styles.loginButtonIcon}>→</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Security Footer Notice (Requirement 10) */}
              <View className="footer-note-animated" style={styles.cardFooter}>
                <Text style={styles.footerNote}>
                  🔒 Protected by Bearer Token Authentication & Internal SQLite Sync.
                </Text>
              </View>

              {/* Direct Link to Guest Portal */}
              {onBackToGuestPortal && (
                <TouchableOpacity
                  style={styles.guestLinkCard}
                  onPress={onBackToGuestPortal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.guestLinkCardText}>
                    🌐 Go directly to Hotel Guest Portal →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08090C',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrimOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 10, 16, 0.84)',
    justifyContent: 'space-between',
    position: 'relative',
    ...Platform.select({
      web: {
        backgroundImage:
          'radial-gradient(circle at center, rgba(12, 16, 26, 0.74) 0%, rgba(6, 8, 14, 0.92) 100%)',
      },
    }),
  },

  // Ambient lighting blobs
  ambientLightingContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 1,
  },
  ambientBlob: {
    position: 'absolute',
    borderRadius: 999,
    ...Platform.select({
      web: {
        filter: 'blur(90px)',
        pointerEvents: 'none',
      },
    }),
  },
  ambientBlobGold: {
    width: 360,
    height: 360,
    top: '18%',
    left: '12%',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  ambientBlobPurple: {
    width: 420,
    height: 420,
    bottom: '12%',
    right: '12%',
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  ambientBlobBlue: {
    width: 280,
    height: 280,
    top: '42%',
    right: '28%',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  backBtnIcon: {
    color: '#E2C082',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backBtnText: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  portalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    gap: 6,
  },
  portalBadgeDot: {
    color: '#10B981',
    fontSize: 9,
  },
  portalBadgeText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 30,
    zIndex: 10,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(15, 19, 30, 0.94)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.28)',
    padding: 32,
    ...Platform.select({
      web: {
        boxShadow:
          '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(99, 102, 241, 0.2), 0 0 15px rgba(226, 192, 130, 0.15)',
        backdropFilter: 'blur(16px)',
      },
      default: {
        elevation: 14,
      },
    }),
  },
  loginCardMobile: {
    padding: 22,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 22,
  },
  crestCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  crestIcon: {
    fontSize: 26,
    color: '#E2C082',
    lineHeight: 28,
  },
  hotelBrandName: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? "'Playfair Display', Georgia, serif" : 'serif',
  },
  portalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  portalDescription: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formContainer: {
    gap: 15,
  },
  inputGroup: {
    gap: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    transition: 'color 0.2s ease',
  },
  inputLabelFocused: {
    color: '#F8FAFC',
  },
  showHideButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  showHideText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 14, 22, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),
  },
  inputWrapperFocused: {
    borderColor: '#E2C082',
    backgroundColor: 'rgba(18, 22, 34, 0.95)',
    ...Platform.select({
      web: {
        boxShadow:
          '0 0 0 3px rgba(226, 192, 130, 0.2), 0 0 16px rgba(226, 192, 130, 0.15)',
      },
    }),
  },
  inputPrefixIcon: {
    fontSize: 14,
    marginRight: 8,
    color: '#64748B',
    ...Platform.select({
      web: {
        transition: 'color 0.2s ease',
      },
    }),
  },
  inputPrefixIconFocused: {
    color: '#E2C082',
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  quickFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  quickFillIcon: {
    fontSize: 13,
    color: '#E2C082',
  },
  quickFillText: {
    color: '#CBD5E1',
    fontSize: 11,
    flex: 1,
  },
  highlightText: {
    color: '#E2C082',
    fontWeight: '700',
  },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
      },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonSuccess: {
    backgroundColor: '#10B981',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5)',
      },
    }),
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loginButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButtonSuccessIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerNote: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
  },
  guestLinkCard: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  guestLinkCardText: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

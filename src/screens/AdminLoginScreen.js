// =============================================================================
// src/screens/AdminLoginScreen.js
// Modern Luxury Administrator Login & Registration Screen
// Designed to fit 100% in a single viewport (Zero Scrolling Required)
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

export default function AdminLoginScreen({
  initialRole = 'clientadmin',
  onLoginSuccess,
  onBackToGuestPortal,
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const activeHotel = activeHotelService.getActiveHotel();
  const brandTitle = activeHotel?.name ? activeHotel.name.toUpperCase() : 'HOTEL MANAGEMENT PORTAL';

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Role: 'superadmin' | 'clientadmin'
  const [selectedRole, setSelectedRole] = useState(() => {
    if (initialRole === 'superadmin') return 'superadmin';
    if (typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('super-admin')) {
      return 'superadmin';
    }
    return 'clientadmin';
  });

  // Login form state
  const isSuper = selectedRole === 'superadmin';
  const [username, setUsername] = useState(() => (isSuper ? 'admin' : 'client'));
  const [password, setPassword] = useState(() => (isSuper ? 'admin123' : 'client123'));
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('clientadmin');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  // Background video state
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Switch role tab
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
    setSuccessMessage('');
    if (role === 'superadmin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('client');
      setPassword('client123');
    }
  };

  // Inject keyframes on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'admin-login-compact-keyframes';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          @keyframes cardFadeIn {
            from { opacity: 0; transform: translateY(14px) scale(0.99); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .compact-login-card {
            animation: cardFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both !important;
          }
          .login-btn-interactive {
            transition: all 0.2s ease !important;
          }
          .login-btn-interactive:hover {
            filter: brightness(1.12) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45) !important;
          }
          .login-btn-interactive:active {
            transform: translateY(0) scale(0.985) !important;
          }
          .quick-chip:hover {
            border-color: #E2C082 !important;
            background-color: rgba(226, 192, 130, 0.2) !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Submit Login
  const handleLogin = async (userToSubmit, passToSubmit) => {
    const finalUser = (userToSubmit !== undefined ? userToSubmit : username).trim();
    const finalPass = (passToSubmit !== undefined ? passToSubmit : password).trim();

    if (!finalUser) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!finalPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await authService.login(finalUser, finalPass);
      if (result.success) {
        setIsSuccess(true);
        setSuccessMessage(`Welcome, ${result.user?.name || result.user?.username || 'Admin'}!`);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(result.user);
          }
        }, 250);
      } else {
        setErrorMessage(result.error || 'Invalid credentials. Please verify username and password.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage('Connection failed: ' + err.message);
      setIsLoading(false);
    }
  };

  // Submit 1-Click Instant Login
  const handleQuickLogin = (roleKey) => {
    if (roleKey === 'superadmin') {
      setSelectedRole('superadmin');
      setUsername('admin');
      setPassword('admin123');
      handleLogin('admin', 'admin123');
    } else {
      setSelectedRole('clientadmin');
      setUsername('client');
      setPassword('client123');
      handleLogin('client', 'client123');
    }
  };

  // Submit Registration
  const handleRegister = async () => {
    if (!regUsername.trim()) {
      setErrorMessage('Username is required.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const regRes = await authService.register({
        username: regUsername.trim(),
        password: regPassword,
        email: regEmail.trim(),
        role: regRole,
      });

      if (regRes.success) {
        setSuccessMessage('Account created! Signing in...');
        const logRes = await authService.login(regUsername.trim(), regPassword);
        if (logRes.success && onLoginSuccess) {
          setIsSuccess(true);
          setTimeout(() => onLoginSuccess(logRes.user), 250);
        } else {
          setAuthMode('login');
          setUsername(regUsername.trim());
          setPassword(regPassword);
          setIsLoading(false);
        }
      } else {
        setErrorMessage(regRes.error || 'Registration failed.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage('Registration error: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.viewportContainer}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80' }}
        style={styles.backgroundImage}
        blurRadius={Platform.OS === 'web' ? 10 : 6}
        resizeMode="cover"
      >
        {/* Ambient Video */}
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
              opacity: videoLoaded ? 0.35 : 0,
              pointerEvents: 'none',
            }}
          >
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-hotel-lobby-with-a-modern-interior-41551-large.mp4"
              type="video/mp4"
            />
          </video>
        )}

        <View style={styles.scrimOverlay}>
          {/* Top Bar */}
          <View style={styles.compactTopBar}>
            {onBackToGuestPortal ? (
              <TouchableOpacity
                onPress={onBackToGuestPortal}
                activeOpacity={0.8}
                style={styles.backButton}
              >
                <Text style={styles.backButtonIcon}>←</Text>
                <Text style={styles.backButtonText}>Guest Portal</Text>
              </TouchableOpacity>
            ) : <View />}

            <View style={[styles.roleBadge, isSuper ? styles.roleBadgeSuper : styles.roleBadgeOwner]}>
              <Text style={styles.roleBadgeText}>
                {isSuper ? 'SUPER ADMIN ACCESS' : 'HOTEL ADMIN ACCESS'}
              </Text>
            </View>
          </View>

          {/* Centered Login Card */}
          <View style={styles.cardCenterArea}>
            <View className="compact-login-card" style={[styles.loginCard, isMobile && styles.loginCardMobile]}>
              
              {/* Header Crest & Title */}
              <View style={styles.headerBlock}>
                <View style={[styles.crestCircle, isSuper && styles.crestCircleSuper]}>
                  <Text style={styles.crestIcon}>✦</Text>
                </View>
                <Text style={styles.hotelBrandName} numberOfLines={1}>{brandTitle}</Text>
                <Text style={styles.portalTitle}>
                  {authMode === 'register'
                    ? 'Register Administrator'
                    : isSuper
                    ? 'Super Admin Console'
                    : 'Hotel Admin Console'}
                </Text>
              </View>

              {/* Dual-Role Selector Tabs */}
              {authMode === 'login' && (
                <View style={styles.roleSwitcherRow}>
                  <TouchableOpacity
                    style={[styles.roleTab, isSuper && styles.roleTabActiveSuper]}
                    onPress={() => handleRoleChange('superadmin')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleTabIcon}>◈</Text>
                    <Text style={[styles.roleTabLabel, isSuper && styles.roleTabLabelActive]}>
                      Super Admin
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleTab, !isSuper && styles.roleTabActiveOwner]}
                    onPress={() => handleRoleChange('clientadmin')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleTabIcon}>◈</Text>
                    <Text style={[styles.roleTabLabel, !isSuper && styles.roleTabLabelActive]}>
                      Hotel Admin
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Status Banners */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.bannerIcon}>✕</Text>
                  <Text style={styles.errorText} numberOfLines={2}>{errorMessage}</Text>
                </View>
              ) : null}

              {successMessage ? (
                <View style={styles.successBanner}>
                  <Text style={styles.bannerIcon}>✓</Text>
                  <Text style={styles.successText} numberOfLines={1}>{successMessage}</Text>
                </View>
              ) : null}

              {/* ============================================================= */}
              {/* LOGIN VIEW                                                    */}
              {/* ============================================================= */}
              {authMode === 'login' ? (
                <View style={styles.formContainer}>
                  {/* Username Field */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>
                      {isSuper ? 'Super Admin Username' : 'Hotel Admin Username'}
                    </Text>
                    <View style={[styles.inputBox, focusedField === 'user' && styles.inputBoxFocused]}>
                      <TextInput
                        style={styles.textInput}
                        placeholder={isSuper ? 'admin' : 'client'}
                        placeholderTextColor="#64748B"
                        value={username}
                        onFocus={() => setFocusedField('user')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(t) => {
                          setUsername(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        autoCapitalize="none"
                        onSubmitEditing={() => handleLogin()}
                      />
                    </View>
                  </View>

                  {/* Password Field */}
                  <View style={styles.fieldRow}>
                    <View style={styles.labelWithToggle}>
                      <Text style={styles.fieldLabel}>Password</Text>
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.showHideLink}>{showPassword ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.inputBox, focusedField === 'pass' && styles.inputBoxFocused]}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••"
                        placeholderTextColor="#64748B"
                        secureTextEntry={!showPassword}
                        value={password}
                        onFocus={() => setFocusedField('pass')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(t) => {
                          setPassword(t);
                          if (errorMessage) setErrorMessage('');
                        }}
                        onSubmitEditing={() => handleLogin()}
                      />
                    </View>
                  </View>

                  {/* Instant 1-Click Login Row */}
                  <View style={styles.quickLoginRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleQuickLogin('superadmin')}
                      className="quick-chip"
                      style={[styles.quickChip, isSuper && styles.quickChipActive]}
                    >
                      <Text style={styles.quickChipText}>
                        Super: <Text style={styles.quickChipBold}>admin / admin123</Text>
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleQuickLogin('clientadmin')}
                      className="quick-chip"
                      style={[styles.quickChip, !isSuper && styles.quickChipActive]}
                    >
                      <Text style={styles.quickChipText}>
                        Hotel: <Text style={styles.quickChipBold}>client / client123</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Prominent Sign In Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleLogin()}
                    disabled={isLoading || isSuccess}
                    className="login-btn-interactive"
                    style={[
                      styles.signInButton,
                      isSuper ? styles.signInButtonSuper : styles.signInButtonOwner,
                      isLoading && styles.buttonDisabled,
                      isSuccess && styles.buttonSuccess,
                    ]}
                  >
                    {isSuccess ? (
                      <>
                        <Text style={styles.btnIcon}>✓</Text>
                        <Text style={styles.btnText}>Access Granted • Entering Console...</Text>
                      </>
                    ) : isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.btnText}>
                          Sign In as {isSuper ? 'Super Admin' : 'Hotel Admin'}
                        </Text>
                        <Text style={styles.btnArrow}>→</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Footer Action Links */}
                  <View style={styles.bottomLinkRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setAuthMode('register');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bottomLinkText}>
                        Need account? <Text style={styles.bottomLinkGold}>Register Here</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ============================================================= */
                /* REGISTRATION VIEW (COMPACT)                                   */
                /* ============================================================= */
                <View style={styles.formContainer}>
                  {/* Account Role Selector */}
                  <View style={styles.regRoleRow}>
                    <TouchableOpacity
                      style={[styles.regRoleBtn, regRole === 'clientadmin' && styles.regRoleBtnActive]}
                      onPress={() => setRegRole('clientadmin')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.regRoleBtnText, regRole === 'clientadmin' && styles.regRoleBtnTextActive]}>
                        🏨 Hotel Admin
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.regRoleBtn, regRole === 'superadmin' && styles.regRoleBtnActive]}
                      onPress={() => setRegRole('superadmin')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.regRoleBtnText, regRole === 'superadmin' && styles.regRoleBtnTextActive]}>
                        🛡️ Super Admin
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>New Username *</Text>
                    <View style={styles.inputBox}>
                      <Text style={styles.inputPrefix}>👤</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. hotel_manager"
                        placeholderTextColor="#64748B"
                        value={regUsername}
                        onChangeText={setRegUsername}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Password *</Text>
                    <View style={styles.inputBox}>
                      <Text style={styles.inputPrefix}>🔒</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Minimum 4 characters"
                        placeholderTextColor="#64748B"
                        secureTextEntry={!showPassword}
                        value={regPassword}
                        onChangeText={setRegPassword}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Email Address</Text>
                    <View style={styles.inputBox}>
                      <Text style={styles.inputPrefix}>✉️</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="manager@hotel.com"
                        placeholderTextColor="#64748B"
                        value={regEmail}
                        onChangeText={setRegEmail}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleRegister}
                    disabled={isLoading}
                    className="login-btn-interactive"
                    style={[styles.signInButton, styles.signInButtonRegister]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.btnText}>Create Account & Sign In</Text>
                        <Text style={styles.btnArrow}>→</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.bottomLinkRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setAuthMode('login');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bottomLinkText}>
                        Already have an account? <Text style={styles.bottomLinkGold}>Sign In</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Micro Security Notice */}
              <Text style={styles.microSecurityText}>
                🔒 Verified Bearer Token Auth • Local MongoDB (hotelApiDb)
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  viewportContainer: {
    flex: 1,
    height: '100%',
    maxHeight: '100%',
    backgroundColor: '#08090C',
    ...Platform.select({
      web: {
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrimOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 15, 0.88)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        backgroundImage:
          'radial-gradient(circle at center, rgba(15, 23, 42, 0.72) 0%, rgba(5, 7, 12, 0.95) 100%)',
      },
    }),
  },

  // Top Bar
  compactTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    gap: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  backButtonIcon: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleBadgeSuper: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderColor: 'rgba(99, 102, 241, 0.45)',
  },
  roleBadgeOwner: {
    backgroundColor: 'rgba(226, 192, 130, 0.14)',
    borderColor: 'rgba(226, 192, 130, 0.4)',
  },
  roleBadgeText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Centered Card Area
  cardCenterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 10,
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.28)',
    paddingVertical: 18,
    paddingHorizontal: 22,
    ...Platform.select({
      web: {
        boxShadow:
          '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(99, 102, 241, 0.2), 0 0 14px rgba(226, 192, 130, 0.12)',
        backdropFilter: 'blur(16px)',
      },
    }),
  },
  loginCardMobile: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  // Header
  headerBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  crestCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1.5,
    borderColor: '#E2C082',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  crestCircleSuper: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderColor: '#818CF8',
  },
  crestIcon: {
    fontSize: 20,
  },
  hotelBrandName: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  portalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Role Switcher Tabs
  roleSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 15, 28, 0.9)',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  roleTabActiveSuper: {
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  roleTabActiveOwner: {
    backgroundColor: 'rgba(226, 192, 130, 0.2)',
    borderWidth: 1,
    borderColor: '#E2C082',
  },
  roleTabIcon: {
    fontSize: 13,
  },
  roleTabLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  roleTabLabelActive: {
    color: '#F8FAFC',
    fontWeight: '900',
  },

  // Status Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    marginBottom: 10,
    gap: 6,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    marginBottom: 10,
    gap: 6,
  },
  bannerIcon: {
    fontSize: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  successText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },

  // Form
  formContainer: {
    gap: 10,
  },
  fieldRow: {
    gap: 4,
  },
  fieldLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  labelWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showHideLink: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  inputBoxFocused: {
    borderColor: '#E2C082',
    backgroundColor: 'rgba(18, 24, 38, 0.98)',
  },
  inputPrefix: {
    fontSize: 13,
    marginRight: 6,
    color: '#64748B',
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },

  // Quick 1-Click Login Row
  quickLoginRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 2,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  quickChipActive: {
    borderColor: 'rgba(226, 192, 130, 0.4)',
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
  },
  quickChipText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  quickChipBold: {
    color: '#E2C082',
    fontWeight: '800',
  },

  // Main Submit Button
  signInButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    gap: 6,
    marginTop: 2,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  signInButtonSuper: {
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  signInButtonOwner: {
    backgroundColor: '#D97706',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  signInButtonRegister: {
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSuccess: {
    backgroundColor: '#10B981',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  btnArrow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  btnIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  // Links
  bottomLinkRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  bottomLinkText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  bottomLinkGold: {
    color: '#E2C082',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  // Registration specifics
  regRoleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  regRoleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  regRoleBtnActive: {
    borderColor: '#E2C082',
    backgroundColor: 'rgba(226, 192, 130, 0.16)',
  },
  regRoleBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  regRoleBtnTextActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },

  microSecurityText: {
    color: '#64748B',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 10,
  },
});

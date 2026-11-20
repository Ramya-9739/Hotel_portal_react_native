// =============================================================================
// App.js
// Root Entry Point for the Display Component Application
// Supports Separate UI Routing:
// 1. Guest Hotel Portal (Interactive 5-Quadrant Showcase)
// 2. Dedicated Wellness & Gyms List (/gyms or #/gyms)
// 3. Dedicated Gym Details Screen (/gyms/:id or #/gyms/:id) with GET DIRECTIONS
// 4. Separate Dedicated Admin UI (Full CRUD, MongoDB Status, Bookings Manager)
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { registerRootComponent } from 'expo';

import HomeScreen from './src/screens/HomeScreen';
import GymListScreen from './src/screens/GymListScreen';
import GymDetailScreen from './src/screens/GymDetailScreen';
import HospitalListScreen from './src/screens/HospitalListScreen';
import PharmacyListScreen from './src/screens/PharmacyListScreen';
import CategoryDirectoryScreen from './src/screens/CategoryDirectoryScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import SuperAdminDashboardScreen from './src/screens/SuperAdminDashboardScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import { authService } from './src/services/authService';
import { activeHotelService } from './src/services/activeHotelService';
import { apiService } from './src/services/apiService';

export default function App() {
  const [currentHotel, setCurrentHotel] = useState(() => activeHotelService.getActiveHotel());
  const [currentView, setCurrentView] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = (window.location.hash || '').toLowerCase();
      const pathname = (window.location.pathname || '').toLowerCase();
      if (hash.includes('super-admin') || hash.includes('superadmin') || pathname.includes('super-admin') || pathname.includes('superadmin')) {
        return 'super-admin';
      }
      if (hash.includes('guest') || hash.includes('home')) {
        return 'guest';
      }
      if (hash.startsWith('#/category/') || hash.includes('cafe') || hash.includes('restaurant') || hash.includes('pool') || hash.includes('spa') || hash.includes('takeaway') || hash.includes('delivery') || hash.includes('atm')) {
        return 'category_directory';
      }
      if (hash.includes('hospital')) return 'category_directory';
      if (hash.includes('pharmac')) return 'category_directory';
      if (hash.includes('gym')) return 'gyms';
      if (hash.includes('admin')) return 'admin';
    }
    return 'guest';
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash.startsWith('#/category/')) return hash.replace('#/category/', '').split('?')[0].trim();
      if (hash.includes('cafe')) return 'cafes';
      if (hash.includes('hosp')) return 'hospitals';
      if (hash.includes('pharm')) return 'pharmacies';
      if (hash.includes('gym')) return 'gyms';
      if (hash.includes('restaur')) return 'restaurants';
      if (hash.includes('pool')) return 'pools';
      if (hash.includes('spa')) return 'spa';
      if (hash.includes('takeaway')) return 'takeaway';
      if (hash.includes('delivery')) return 'delivery';
      if (hash.includes('atm')) return 'atms';
    }
    return 'cafes';
  });
  const [selectedGym, setSelectedGym] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(authService.isAuthenticated());

  // Subscribe to authService for reactive login & logout states
  useEffect(() => {
    const unsubAuth = authService.subscribe((user, isAuth) => {
      setIsAdminLoggedIn(isAuth);
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to activeHotelService for live synchronisation across all views
  useEffect(() => {
    const unsubscribe = activeHotelService.subscribe((updatedHotel) => {
      setCurrentHotel(updatedHotel);
    });
    return () => unsubscribe();
  }, []);

  // URL routing for direct navigation (e.g. #/admin, #/guest, #/gyms, #/gyms/:id)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleRouteChange = () => {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const pathname = window.location.pathname || '';

        if (
          hash.toLowerCase().includes('super-admin') ||
          hash.toLowerCase().includes('superadmin') ||
          pathname.toLowerCase().includes('super-admin') ||
          pathname.toLowerCase().includes('superadmin')
        ) {
          setCurrentView('super-admin');
        } else if (
          hash.toLowerCase().includes('guest') ||
          hash.toLowerCase().includes('home')
        ) {
          setCurrentView('guest');
        } else if (
          pathname.toLowerCase().includes('admin') ||
          hash.toLowerCase().includes('admin')
        ) {
          setCurrentView('admin');
        } else if (hash.startsWith('#/category/')) {
          const cat = hash.replace('#/category/', '').split('?')[0].trim().toLowerCase();
          setSelectedCategory(cat || 'cafes');
          setCurrentView('category_directory');
        } else if (hash.includes('cafe') || pathname.includes('cafe')) {
          setSelectedCategory('cafes');
          setCurrentView('category_directory');
        } else if (hash.includes('restaurant') || pathname.includes('restaurant')) {
          setSelectedCategory('restaurants');
          setCurrentView('category_directory');
        } else if (hash.includes('pool') || pathname.includes('pool')) {
          setSelectedCategory('pools');
          setCurrentView('category_directory');
        } else if (hash.includes('spa') || pathname.includes('spa')) {
          setSelectedCategory('spa');
          setCurrentView('category_directory');
        } else if (hash.includes('takeaway') || pathname.includes('takeaway')) {
          setSelectedCategory('takeaway');
          setCurrentView('category_directory');
        } else if (hash.includes('delivery') || pathname.includes('delivery')) {
          setSelectedCategory('delivery');
          setCurrentView('category_directory');
        } else if (hash.includes('atm') || pathname.includes('atm')) {
          setSelectedCategory('atms');
          setCurrentView('category_directory');
        } else if (
          hash.toLowerCase().includes('hospital') ||
          pathname.toLowerCase().includes('hospital')
        ) {
          setSelectedCategory('hospitals');
          setCurrentView('category_directory');
        } else if (
          hash.toLowerCase().includes('pharmac') ||
          pathname.toLowerCase().includes('pharmac')
        ) {
          setSelectedCategory('pharmacies');
          setCurrentView('category_directory');
        } else if (hash.startsWith('#/gyms/') || hash.startsWith('#/gym/')) {
          // Dedicated Gym Details Route
          const gymId = hash.replace(/^#\/(gyms|gym)\//, '').split('?')[0].trim();
          setCurrentView('gym_detail');
          const localGym = (currentHotel && currentHotel.nearby && currentHotel.nearby.gyms ? currentHotel.nearby.gyms : []).find((g) => g.id === gymId);
          if (localGym) {
            setSelectedGym(localGym);
          } else {
            apiService.fetchGymById(gymId).then((res) => {
              if (res && res.success && res.data) {
                setSelectedGym(res.data);
              }
            });
          }
        } else if (
          hash.toLowerCase().includes('gym') ||
          pathname.toLowerCase().includes('gym')
        ) {
          setCurrentView('gyms');
        } else {
          // Default on initial start is Guest Portal
          setCurrentView('guest');
        }
      };

      handleRouteChange();
      window.addEventListener('hashchange', handleRouteChange);
      window.addEventListener('popstate', handleRouteChange);
      return () => {
        window.removeEventListener('hashchange', handleRouteChange);
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [currentHotel]);

  // Inject Google Fonts (Playfair Display & Plus Jakarta Sans) and luxury scrollbars on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // 1. Google Fonts Link
      const fontLinkId = 'portal-google-fonts';
      if (!document.getElementById(fontLinkId)) {
        const link = document.createElement('link');
        link.id = fontLinkId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
        document.head.appendChild(link);
      }

      // 2. Luxury scrollbars & base body styling
      const styleId = 'portal-luxury-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          html, body {
            background-color: #0F1014 !important;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #0F1014;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(226, 192, 130, 0.25);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(226, 192, 130, 0.5);
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(226, 192, 130, 0.25) #0F1014;
          }
          [data-testid="category-explore-btn"],
          .category-explore-btn {
            background-color: #25231E !important;
            border: 1px solid #C5A46D !important;
            border-radius: 8px !important;
            transition: all 0.2s ease-in-out !important;
          }
          [data-testid="category-explore-btn"]:hover,
          .category-explore-btn:hover {
            background-color: #C5A46D !important;
            border-color: #C5A46D !important;
          }
          [data-testid="category-explore-btn"]:hover span,
          [data-testid="category-explore-btn"]:hover div,
          .category-explore-btn:hover * {
            color: #25231E !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Navigation handlers
  const switchToSuperAdmin = () => {
    setCurrentView('super-admin');
    if (Platform.OS === 'web') {
      window.location.hash = '#/super-admin';
    }
  };

  const switchToAdmin = () => {
    setCurrentView('admin');
    if (Platform.OS === 'web') {
      window.location.hash = '#/admin';
    }
  };

  const switchToGuest = () => {
    setCurrentView('guest');
    if (Platform.OS === 'web') {
      if (window.location.pathname.toLowerCase().includes('admin')) {
        window.location.href = '/#/guest';
      } else {
        window.location.hash = '#/guest';
      }
    }
  };

  const navigateToCategory = (catId) => {
    const targetCat = (catId || 'cafes').toLowerCase();
    setSelectedCategory(targetCat);
    setCurrentView('category_directory');
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.hash = `#/category/${targetCat}`;
    }
  };

  const navigateToGyms = () => {
    setCurrentView('gyms');
    if (Platform.OS === 'web') {
      window.location.hash = '#/gyms';
    }
  };

  const navigateToGymDetail = (gym) => {
    setSelectedGym(gym);
    setCurrentView('gym_detail');
    if (Platform.OS === 'web') {
      window.location.hash = `#/gyms/${gym.id}`;
    }
  };

  const navigateToHospitals = () => {
    setCurrentView('hospitals');
    if (Platform.OS === 'web') {
      window.location.hash = '#/hospitals';
    }
  };

  const navigateToPharmacies = () => {
    setCurrentView('pharmacies');
    if (Platform.OS === 'web') {
      window.location.hash = '#/pharmacies';
    }
  };

  const navigateBackToGyms = () => {
    setCurrentView('gyms');
    if (Platform.OS === 'web') {
      window.location.hash = '#/gyms';
    }
  };

  const navigateBackToHotel = () => {
    setCurrentView('guest');
    if (Platform.OS === 'web') {
      window.location.hash = '#/guest';
    }
  };

  return (
    <SafeAreaView style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#08090C" />

      {/* Screen View Rendering */}
      <View style={styles.contentContainer}>
        {currentView === 'super-admin' ? (
          isAdminLoggedIn && authService.isSuperAdmin() ? (
            <SuperAdminDashboardScreen
              onBackToGuestPortal={switchToGuest}
              onSwitchToOwnerAdmin={switchToAdmin}
              onLogout={() => {
                authService.logout();
                setIsAdminLoggedIn(false);
                switchToGuest();
              }}
            />
          ) : isAdminLoggedIn && !authService.isSuperAdmin() ? (
            /* 403 Forbidden Access Denied for Regular Hotel Admins */
            <View style={styles.accessDeniedContainer}>
              <View style={styles.accessDeniedCard}>
                <Text style={styles.accessDeniedIcon}>🚫</Text>
                <Text style={styles.accessDeniedTitle}>403 — ACCESS DENIED</Text>
                <Text style={styles.accessDeniedSub}>
                  Super Administrator privileges are strictly required to view this console.
                </Text>
                <Text style={styles.accessDeniedDetails}>
                  Your active account is logged in as <Text style={{ color: '#E2C082', fontWeight: '700' }}>{authService.getUser()?.username || 'user'}</Text> with the role <Text style={{ color: '#F87171', fontWeight: '700' }}>{authService.getUser()?.role || 'clientadmin'}</Text>. You do not have permission to access global administration routes.
                </Text>
                <View style={styles.accessDeniedBtnRow}>
                  <TouchableOpacity
                    style={styles.returnAdminBtn}
                    onPress={switchToAdmin}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.returnAdminBtnText}>← Return to Hotel Admin Console</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.switchAccountBtn}
                    onPress={() => {
                      authService.logout();
                      setIsAdminLoggedIn(false);
                      switchToSuperAdmin();
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.switchAccountBtnText}>Switch Account / Log Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <AdminLoginScreen
              initialRole="superadmin"
              onLoginSuccess={(user) => {
                setIsAdminLoggedIn(true);
                if (user?.role === 'superadmin') {
                  switchToSuperAdmin();
                } else {
                  switchToAdmin();
                }
              }}
              onBackToGuestPortal={switchToGuest}
            />
          )
        ) : currentView === 'admin' ? (
          isAdminLoggedIn ? (
            <AdminDashboardScreen
              activeHotel={currentHotel}
              onSetActiveHotel={(hotel) => {
                activeHotelService.setActiveHotel(hotel);
                setCurrentHotel(hotel);
              }}
              onLaunchGuestWebsite={(hotel) => {
                if (hotel) {
                  activeHotelService.setActiveHotel(hotel);
                  setCurrentHotel(hotel);
                }
                switchToGuest();
              }}
              onBackToGuestPortal={switchToGuest}
              onLogout={() => {
                authService.logout();
                setIsAdminLoggedIn(false);
              }}
            />
          ) : (
            <AdminLoginScreen
              initialRole="clientadmin"
              onLoginSuccess={(user) => {
                setIsAdminLoggedIn(true);
                if (user?.role === 'superadmin') {
                  switchToSuperAdmin();
                } else {
                  switchToAdmin();
                }
              }}
              onBackToGuestPortal={switchToGuest}
            />
          )
        ) : currentView === 'category_directory' ? (
          <CategoryDirectoryScreen
            category={selectedCategory}
            hotel={currentHotel}
            onBackToHotel={navigateBackToHotel}
            onSelectCategory={navigateToCategory}
          />
        ) : currentView === 'hospitals' ? (
          <CategoryDirectoryScreen
            category="hospitals"
            hotel={currentHotel}
            onBackToHotel={navigateBackToHotel}
            onSelectCategory={navigateToCategory}
          />
        ) : currentView === 'pharmacies' ? (
          <CategoryDirectoryScreen
            category="pharmacies"
            hotel={currentHotel}
            onBackToHotel={navigateBackToHotel}
            onSelectCategory={navigateToCategory}
          />
        ) : currentView === 'gyms' ? (
          <GymListScreen
            hotel={currentHotel}
            onBackToHotel={navigateBackToHotel}
            onSelectGym={navigateToGymDetail}
          />
        ) : currentView === 'gym_detail' ? (
          <GymDetailScreen
            hotel={currentHotel}
            gym={selectedGym}
            onBackToGyms={navigateBackToGyms}
          />
        ) : (
          <HomeScreen
            hotel={currentHotel}
            onHotelChange={(hotel) => {
              activeHotelService.setActiveHotel(hotel);
              setCurrentHotel(hotel);
            }}
            onNavigateToGyms={navigateToGyms}
            onNavigateToHospitals={navigateToHospitals}
            onNavigateToPharmacies={navigateToPharmacies}
            onNavigateToCategory={navigateToCategory}
            onSelectGym={navigateToGymDetail}
            onOpenAdminUI={switchToAdmin}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F1014',
    display: 'flex',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        height: '100%',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
      },
      default: {
        height: '100%',
      },
    }),
  },
  contentContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  floatingNavPill: {
    position: 'absolute',
    bottom: 18,
    right: 20,
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 192, 130, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    gap: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      },
    }),
  },
  floatingPillBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  floatingPillBtnActive: {
    backgroundColor: '#E2C082',
  },
  floatingPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingPillTextActive: {
    color: '#070A12',
    fontWeight: '800',
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0A0C14',
  },
  accessDeniedCard: {
    maxWidth: 540,
    width: '100%',
    backgroundColor: '#141824',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  accessDeniedIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  accessDeniedTitle: {
    color: '#EF4444',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  accessDeniedSub: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  accessDeniedDetails: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  accessDeniedBtnRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  returnAdminBtn: {
    backgroundColor: '#E2C082',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  returnAdminBtnText: {
    color: '#0A0D14',
    fontSize: 13,
    fontWeight: '700',
  },
  switchAccountBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: '#2A2E45',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  switchAccountBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
});

// Register root component so React Native Web mounts to <div id="root">
registerRootComponent(App);

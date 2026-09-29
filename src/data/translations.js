// =============================================================================
// src/data/translations.js
// Multi-Language Concierge & Live Navigation Strings
// English, Hindi, Arabic, French, Spanish
// Zero hardcoded demo hotel or city data — dynamically adapts to active hotel.
// =============================================================================

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇦🇪', dir: 'rtl' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr' },
];

export const LANGUAGES = SUPPORTED_LANGUAGES;

export const TRANSLATIONS = {
  en: {
    hotelName: 'HOTEL & GUEST PORTAL',
    conciergeTitle: 'BOUTIQUE RESIDENCE & HOTEL CONCIERGE',
    guestPortalSubtitle: 'Interactive Guest Display • Curated City & Concierge Guide',
    adminConsole: 'Admin Console',
    adminPortal: 'Admin Portal',
    syncRestApi: 'Sync REST API',
    sqliteCached: 'Items • Live REST Synced',
    
    // Quadrants
    quadrantTop: 'ATTRACTIONS & SIGHTSEEING',
    quadrantLeft: 'SHOPPING MALLS & BOUTIQUES',
    quadrantCenter: 'BOUTIQUE RESIDENCES & HOTEL',
    quadrantRight: 'HEALTHCARE & TRANSIT HUBS',
    quadrantBottom: 'DINING, ATMS, POOLS & PARLOUR',

    // Weather & Ambience Bar
    weatherSunny: 'Pleasant & Sunny 26°C',
    weatherBreeze: 'Gentle Evening Breeze',
    sunsetAt: 'Sunset at 6:45 PM',
    recommendationMorning: '🌅 Morning: Enjoy artisanal breakfast at the hotel or scenic morning walks.',
    recommendationAfternoon: '☀️ Afternoon: Explore premier shopping destinations and local craft ateliers.',
    recommendationEvening: '🌇 Evening: Stroll through illuminated evening landmarks and city squares.',
    recommendationNight: '🌙 Night: Fine dining and relaxation in our lounge and tranquil courtyards.',

    // Card Details
    rating: 'rating',
    likes: 'likes',
    scanToPhone: 'Scan QR',
    openInMaps: 'Open in Maps',
    claimVipPass: 'Claim VIP Pass',
    backToPortal: '← Back to Hotel Portal',
    conciergeHotline: 'Concierge Hotline',
    requestBooking: 'Request Concierge Booking',
    hours: 'Visiting Hours',
    admission: 'Admission Pass',
    distance: 'Distance',
  },

  hi: {
    hotelName: 'होटल एवं अतिथि पोर्टल',
    conciergeTitle: 'होटल दरबान एवं अतिथि दर्शिका',
    guestPortalSubtitle: 'अतिथि प्रदर्शन • 5-क्षेत्रीय दर्शिका',
    adminConsole: 'प्रशासक कंसोल',
    adminPortal: 'प्रशासक पोर्टल',
    syncRestApi: 'डेटा सिंक करें',
    sqliteCached: 'स्थान • लाइव सिंक',
    
    // Quadrants
    quadrantTop: 'पर्यटन स्थल',
    quadrantLeft: 'शॉपिंग मॉल व बाजार',
    quadrantCenter: 'होटल व निवास',
    quadrantRight: 'यातायात व अस्पताल',
    quadrantBottom: 'रेस्तरां, एटीएम, पूल व ब्यूटी पार्लर',

    // Weather & Ambience Bar
    weatherSunny: 'सुहाना व धूपदार 26°C',
    weatherBreeze: 'सुखद ठंडी हवा',
    sunsetAt: 'सूर्यास्त शाम 6:45 बजे',
    recommendationMorning: '🌅 सुबह की पसंद: होटल में ताजा नाश्ते का आनंद लें या सुबह की सैर करें।',
    recommendationAfternoon: '☀️ दोपहर की पसंद: स्थानीय शॉपिंग मॉल एवं बाजारों में खरीदारी करें।',
    recommendationEvening: '🌇 शाम की पसंद: दर्शनीय स्थलों और फव्वारों की रोशनी देखें।',
    recommendationNight: '🌙 रात की पसंद: रूफटॉप डिनर और कोर्टयार्ड में शांति का आनंद लें।',

    // Card Details
    rating: 'रेटिंग',
    likes: 'पसंद',
    scanToPhone: 'फोन पर लें',
    openInMaps: 'नक्शा देखें',
    claimVipPass: 'वीआईपी पास पाएं',
    backToPortal: '← वापस होटल पोर्टल',
    conciergeHotline: 'कंसीयज हेल्पलाइन',
    requestBooking: 'बुकिंग अनुरोध भेजें',
    hours: 'खुलने का समय',
    admission: 'प्रवेश शुल्क',
    distance: 'दूरी',
  },

  ar: {
    hotelName: 'بوابة الفندق والضيوف',
    conciergeTitle: 'بوابة كونسيرج الفندق للضيوف',
    guestPortalSubtitle: 'شاشة تفاعلية • دليل المدينة في 5 محاور',
    adminConsole: 'لوحة التحكم',
    adminPortal: 'دخول الإدارة',
    syncRestApi: 'مزامنة فورية',
    sqliteCached: 'عناصر • متزامن مباشر',
    
    // Quadrants
    quadrantTop: 'المعالم السياحية',
    quadrantLeft: 'مراكز التسوق والمتاجر',
    quadrantCenter: 'الإقامة الفندقية الفاخرة',
    quadrantRight: 'المواصلات والمستشفيات',
    quadrantBottom: 'المطاعم، الصراف الآلي، المسابح والسبا',

    // Weather & Ambience Bar
    weatherSunny: 'مشمس ولطيف 26°م',
    weatherBreeze: 'نسيم عليل ومنعش',
    sunsetAt: 'غروب الشمس 6:45 مساءً',
    recommendationMorning: '🌅 خيار الصباح: إفطار شهي في الفندق وجولة صباحية منعشة.',
    recommendationAfternoon: '☀️ خيار الظهيرة: تسوق في أشهر المراكز التجارية والأسواق.',
    recommendationEvening: '🌇 خيار الغروب: الاستمتاع بإضاءة المعالم والساحات المسائية.',
    recommendationNight: '🌙 خيار الليل: عشاء راقٍ والاسترخاء في حدائق الفندق.',

    // Card Details
    rating: 'تقييم',
    likes: 'إعجاب',
    scanToPhone: 'مسح الباركود',
    openInMaps: 'خرائط جوجل',
    claimVipPass: 'قسيمة كبار الزوار',
    backToPortal: '← العودة للرئيسية',
    conciergeHotline: 'خط الكونسيرج',
    requestBooking: 'طلب حجز فوري',
    hours: 'أوقات الزيارة',
    admission: 'تذاكر الدخول',
    distance: 'المسافة',
  },

  fr: {
    hotelName: 'PORTAIL HÔTEL & CLIENTS',
    conciergeTitle: 'CONCIERGERIE RÉSIDENCE & HÔTEL',
    guestPortalSubtitle: 'Affichage Interactif • Guide en 5 Quadrants',
    adminConsole: 'Console Admin',
    adminPortal: 'Portail Admin',
    syncRestApi: 'Synchroniser',
    sqliteCached: 'Lieux • Synchronisé en direct',
    
    // Quadrants
    quadrantTop: 'MONUMENTS & SITES TOURISTIQUES',
    quadrantLeft: 'CENTRES COMMERCIAUX & BOUTIQUES',
    quadrantCenter: 'RÉSIDENCE & HÔTEL LUXE',
    quadrantRight: 'SANTÉ & TRANSIT',
    quadrantBottom: 'RESTAURANTS, DAB, PISCINES & SALONS',

    // Weather & Ambience Bar
    weatherSunny: 'Ensoleillé et Agréable 26°C',
    weatherBreeze: 'Brise Douce et Agréable',
    sunsetAt: 'Coucher du Soleil à 18h45',
    recommendationMorning: '🌅 Matinée: Petit-déjeuner artisanal à l’hôtel ou promenade matinale.',
    recommendationAfternoon: '☀️ Après-midi: Découvrez les boutiques de luxe et centres commerciaux.',
    recommendationEvening: '🌇 Soirée: Admirez les monuments illuminés et places animées.',
    recommendationNight: '🌙 Nuit: Dîner gastronomique et détente dans les jardins intérieurs.',

    // Card Details
    rating: 'note',
    likes: 'j’aime',
    scanToPhone: 'Scanner QR',
    openInMaps: 'Ouvrir sur Maps',
    claimVipPass: 'Pass Privilège VIP',
    backToPortal: '← Retour au Portail',
    conciergeHotline: 'Ligne Concierge',
    requestBooking: 'Demande de Réservation',
    hours: 'Horaires d’Ouverture',
    admission: 'Accès & Billets',
    distance: 'Distance',
  },

  es: {
    hotelName: 'PORTAL DE HOTEL Y HUÉSPEDES',
    conciergeTitle: 'CONSERJERÍA RESIDENCIA Y HOTEL',
    guestPortalSubtitle: 'Pantalla Interactiva • Guía en 5 Cuadrantes',
    adminConsole: 'Consola Admin',
    adminPortal: 'Portal Admin',
    syncRestApi: 'Sincronizar',
    sqliteCached: 'Lugares • Sincronizado en vivo',
    
    // Quadrants
    quadrantTop: 'ATRACCIONES & LUGARES TURÍSTICOS',
    quadrantLeft: 'CENTROS COMERCIALES & TIENDAS',
    quadrantCenter: 'RESIDENCIAS & HOTEL',
    quadrantRight: 'TRANSPORTE & SALUD',
    quadrantBottom: 'RESTAURANTES, CAJEROS, PISCINAS & SALONES',

    // Weather & Ambience Bar
    weatherSunny: 'Soleado y Agradable 26°C',
    weatherBreeze: 'Brisa Suave y Fresca',
    sunsetAt: 'Puesta del Sol a las 18:45',
    recommendationMorning: '🌅 Mañana: Desayuno artesanal en el hotel o paseo matutino panorámico.',
    recommendationAfternoon: '☀️ Tarde: Explore boutiques de diseño y centros comerciales destacados.',
    recommendationEvening: '🌇 Atardecer: Disfrute de los monumentos iluminados y plazas.',
    recommendationNight: '🌙 Noche: Cena gourmet en la azotea o relajación en el patio con jardín.',

    // Card Details
    rating: 'calificación',
    likes: 'me gusta',
    scanToPhone: 'Escanear QR',
    openInMaps: 'Abrir en Maps',
    claimVipPass: 'Pase VIP de Hotel',
    backToPortal: '← Volver al Portal',
    conciergeHotline: 'Línea de Conserjería',
    requestBooking: 'Solicitar Reserva',
    hours: 'Horarios de Visita',
    admission: 'Entradas',
    distance: 'Distancia',
  },
};

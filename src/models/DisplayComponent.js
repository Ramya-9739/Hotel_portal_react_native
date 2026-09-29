// =============================================================================
// src/models/DisplayComponent.js
// Model Class for Display Components as defined in Prompt 2:
// - String title
// - String subtitle
// - String imageLink
// - Int likes
// - String shortDescription
// - Int componentType (0: Top, 1: Left, 2: Center, 3: Right, 4: Bottom)
// - Double customerRatings
// - Int priority
// =============================================================================

export class DisplayComponent {
  /**
   * Component Type Architecture (Per Supervisor Specifications):
   * 1 -> Center Panel (Hotel Images Slideshow & Direct Website Link)
   * 2 -> Top Panel (Horizontal Content Cards & Direct Website Link)
   * 3 -> Left Panel (Vertical Content Cards & Direct Website Link)
   * 4 -> Right Panel (Vertical Content Cards & Direct Website Link)
   * 5+ -> Bottom Panel (Horizontal Content Cards -> Details Screen & Registration Form)
   * (0 -> Legacy Top compatibility)
   */
  static COMPONENT_TYPES = {
    LEGACY_TOP: 0,
    CENTER: 1,
    TOP: 2,
    LEFT: 3,
    RIGHT: 4,
    BOTTOM: 5,
  };

  static getTypeName(type) {
    switch (parseInt(type, 10)) {
      case 1:
        return 'Center (40% Hotel Showcase)';
      case 2:
      case 0:
        return 'Top (Attractions & Heritage)';
      case 3:
        return 'Left (Shopping & Lifestyle)';
      case 4:
        return 'Right (Transit & Essential Care)';
      case 5:
      default:
        return parseInt(type, 10) >= 5 ? 'Bottom (Dining & Leisure)' : 'General Component';
    }
  }

  constructor({
    id,
    title = '',
    subtitle = '',
    imageLink = '',
    likes = 0,
    shortDescription = '',
    componentType = 1,
    customerRatings = 0.0,
    priority = 0,
    externalUrl = '',
    timing = '',
    offer = '',
    location = '',
    additionalInfo = '',
    category = '',
    hotelDistance = '',
    driveTime = '',
    walkTime = '',
    metroStation = '',
    metroDistance = '',
    metroTravelTime = '',
    nearestHospital = '',
    hospitalDistance = '',
    hospitalPhone = '',
    urgentClinic = '',
    nearbyShopping = '',
    nearbyDining = '',
    hotelPropertyId = '1000000001',
    price = '',
    priceRange = '',
    passPrice = '',
    minOrder = '',
    deliveryFee = '',
    timings = '',
    availability = 'Available',
    data1 = '',
    data2 = '',
    data3 = '',
    data4 = '',
    data5 = '',
    cuisine = '',
    takeaway = false,
    homeDelivery = false,
  }) {
    this.id = id || `${componentType}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    this.title = String(title);
    this.subtitle = String(subtitle || shortDescription || '');
    this.subTitle = this.subtitle;
    this.imageLink = String(imageLink);
    this.likes = parseInt(likes, 10) || 0;
    this.shortDescription = String(shortDescription || subtitle || '');
    this.description = this.shortDescription;
    this.componentType = parseInt(componentType, 10) || 1;
    this.componentTypeId = this.componentType;
    this.customerRatings = parseFloat(customerRatings) || 0.0;
    this.rating = this.customerRatings;
    this.priority = parseInt(priority, 10) || 0;
    this.externalUrl = String(externalUrl || '');
    this.link = this.externalUrl;
    this.timing = String(timing || timings || '');
    this.timings = this.timing;
    this.offer = String(offer || '');
    this.location = String(location || '');
    this.address = this.location;
    this.additionalInfo = String(additionalInfo || '');
    this.category = String(category || '');
    this.hotelDistance = String(hotelDistance || '');
    this.distance = this.hotelDistance;
    this.driveTime = String(driveTime || '');
    this.walkTime = String(walkTime || '');
    this.metroStation = String(metroStation || '');
    this.metroDistance = String(metroDistance || '');
    this.metroTravelTime = String(metroTravelTime || '');
    this.nearestHospital = String(nearestHospital || '');
    this.hospitalDistance = String(hospitalDistance || '');
    this.hospitalPhone = String(hospitalPhone || '');
    this.urgentClinic = String(urgentClinic || '');
    this.nearbyShopping = String(nearbyShopping || '');
    this.nearbyDining = String(nearbyDining || '');
    this.hotelPropertyId = String(hotelPropertyId || '1000000001');
    this.price = String(price || priceRange || passPrice || minOrder || deliveryFee || '');
    this.priceRange = String(priceRange || this.price || '');
    this.passPrice = String(passPrice || this.price || '');
    this.minOrder = String(minOrder || this.price || '');
    this.deliveryFee = String(deliveryFee || this.price || '');
    this.availability = String(availability || 'Available');
    this.data1 = String(data1 || '');
    this.data2 = String(data2 || '');
    this.data3 = String(data3 || '');
    this.data4 = String(data4 || '');
    this.data5 = String(data5 || '');
    this.cuisine = String(cuisine || '');
    this.takeaway = Boolean(takeaway);
    this.homeDelivery = Boolean(homeDelivery);
  }

  /**
   * Deserializes an SQLite database row into a DisplayComponent instance
   */
  static fromDatabaseRow(row) {
    if (!row) return null;
    return new DisplayComponent({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      imageLink: row.imageLink || row.image_link,
      likes: row.likes,
      shortDescription: row.shortDescription || row.short_description,
      componentType: row.componentType !== undefined ? row.componentType : row.component_type,
      customerRatings: row.customerRatings !== undefined ? row.customerRatings : row.customer_ratings,
      priority: row.priority,
      externalUrl: row.externalUrl || row.external_url || '',
      timing: row.timing || '',
      offer: row.offer || '',
      location: row.location || '',
      additionalInfo: row.additionalInfo || row.additional_info || '',
      category: row.category || '',
    });
  }

  /**
   * Converts instance to an array of parameters for SQL INSERT / REPLACE
   */
  toDatabaseParams() {
    return [
      this.id,
      this.title,
      this.subtitle,
      this.imageLink,
      this.likes,
      this.shortDescription,
      this.componentType,
      this.customerRatings,
      this.priority,
      this.externalUrl,
      this.timing,
      this.offer,
      this.location,
      this.additionalInfo,
      this.category,
    ];
  }

  /**
   * Deserializes a JSON object received from REST API
   */
  static fromJson(json) {
    if (!json) return null;
    return new DisplayComponent({
      id: json.id || json._id,
      title: json.title,
      subtitle: json.subtitle || json.subTitle || json.shortDescription || json.description || '',
      imageLink: json.imageLink || json.image_link || json.image || '',
      likes: json.likes,
      shortDescription: json.shortDescription || json.short_description || json.description || json.subtitle || json.subTitle || '',
      componentType: json.componentTypeId !== undefined ? json.componentTypeId : (json.componentType !== undefined ? json.componentType : json.component_type),
      customerRatings: json.customerRatings !== undefined ? json.customerRatings : (json.rating !== undefined ? json.rating : 4.8),
      priority: json.priority !== undefined ? json.priority : 0,
      externalUrl: json.externalUrl || json.external_url || json.url || json.website || json.link || '',
      timing: json.timing || json.timings || json.hours || '',
      timings: json.timings || json.timing || json.hours || '',
      offer: json.offer || json.discount || '',
      location: json.location || json.address || '',
      additionalInfo: json.additionalInfo || json.additional_info || '',
      category: json.category || '',
      hotelDistance: json.hotelDistance || json.hotel_distance || json.distance || '',
      driveTime: json.driveTime || json.drive_time || '',
      walkTime: json.walkTime || json.walk_time || '',
      metroStation: json.metroStation || json.metro_station || '',
      metroDistance: json.metroDistance || json.metro_distance || '',
      metroTravelTime: json.metroTravelTime || json.metro_travel_time || '',
      nearestHospital: json.nearestHospital || json.nearest_hospital || '',
      hospitalDistance: json.hospitalDistance || json.hospital_distance || '',
      hospitalPhone: json.hospitalPhone || json.hospital_phone || '',
      urgentClinic: json.urgentClinic || json.urgent_clinic || '',
      nearbyShopping: json.nearbyShopping || json.nearby_shopping || '',
      nearbyDining: json.nearbyDining || json.nearby_dining || '',
      hotelPropertyId: json.hotelPropertyId || '1000000001',
      price: json.price || json.priceRange || json.passPrice || json.minOrder || json.deliveryFee || '',
      priceRange: json.priceRange || json.price || '',
      passPrice: json.passPrice || json.price || '',
      minOrder: json.minOrder || json.price || '',
      deliveryFee: json.deliveryFee || json.price || '',
      availability: json.availability || 'Available',
      data1: json.data1 || '',
      data2: json.data2 || '',
      data3: json.data3 || '',
      data4: json.data4 || '',
      data5: json.data5 || '',
      cuisine: json.cuisine || '',
      takeaway: Boolean(json.takeaway),
      homeDelivery: Boolean(json.homeDelivery),
    });
  }

  /**
   * Serializes instance to standard JSON representation
   */
  toJson() {
    return {
      id: this.id,
      title: this.title,
      subtitle: this.subtitle,
      imageLink: this.imageLink,
      likes: this.likes,
      shortDescription: this.shortDescription,
      componentType: this.componentType,
      customerRatings: this.customerRatings,
      priority: this.priority,
      externalUrl: this.externalUrl,
      timing: this.timing,
      offer: this.offer,
      location: this.location,
      additionalInfo: this.additionalInfo,
      category: this.category,
      hotelDistance: this.hotelDistance,
      driveTime: this.driveTime,
      walkTime: this.walkTime,
      metroStation: this.metroStation,
      metroDistance: this.metroDistance,
      metroTravelTime: this.metroTravelTime,
      nearestHospital: this.nearestHospital,
      hospitalDistance: this.hospitalDistance,
      hospitalPhone: this.hospitalPhone,
      urgentClinic: this.urgentClinic,
      nearbyShopping: this.nearbyShopping,
      nearbyDining: this.nearbyDining,
    };
  }
}

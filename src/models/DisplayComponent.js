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
  }) {
    this.id = id || `${componentType}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    this.title = String(title);
    this.subtitle = String(subtitle);
    this.imageLink = String(imageLink);
    this.likes = parseInt(likes, 10) || 0;
    this.shortDescription = String(shortDescription);
    this.componentType = parseInt(componentType, 10) || 1;
    this.customerRatings = parseFloat(customerRatings) || 0.0;
    this.priority = parseInt(priority, 10) || 0;
    this.externalUrl = String(externalUrl || '');
    this.timing = String(timing || '');
    this.offer = String(offer || '');
    this.location = String(location || '');
    this.additionalInfo = String(additionalInfo || '');
    this.category = String(category || '');
    this.hotelDistance = String(hotelDistance || '');
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
    return new DisplayComponent({
      id: json.id || json._id,
      title: json.title,
      subtitle: json.subtitle,
      imageLink: json.imageLink || json.image_link || json.image,
      likes: json.likes,
      shortDescription: json.shortDescription || json.short_description || json.description,
      componentType: json.componentType !== undefined ? json.componentType : json.component_type,
      customerRatings: json.customerRatings !== undefined ? json.customerRatings : json.rating,
      priority: json.priority !== undefined ? json.priority : 0,
      externalUrl: json.externalUrl || json.external_url || json.url || json.website || '',
      timing: json.timing || json.hours || '',
      offer: json.offer || json.discount || '',
      location: json.location || '',
      additionalInfo: json.additionalInfo || json.additional_info || '',
      category: json.category || '',
      hotelDistance: json.hotelDistance || json.hotel_distance || '',
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

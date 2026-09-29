// =============================================================================
// backend/seedSampleData.js
// Optional 1-Click Database Seeder for Admin Testing
// Seeds: Admin User, Hotel Property, and Sub-Components (Dining, Gym, Takeaway, Delivery)
// =============================================================================

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const HotelAdmin = require('./models/hotelAdmin.model');
const HotelProperty = require('./models/hotelProperty.model');
const DisplaySubComponent = require('./models/displaySubComponent.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hotelApiDb';

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Ensure SuperAdmin
    const existingAdmin = await HotelAdmin.findOne({ hotelAdminId: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await HotelAdmin.create({
        hotelAdminId: 'admin',
        password: hashedPassword,
        adminName: 'Super Administrator',
        contactNumber: '+91 98765 00000',
        activeIndicator: 'Y',
      });
      console.log('Seeded admin: username "admin" / password "admin123"');
    } else {
      console.log('Admin user already exists.');
    }

    // 2. Hotel Property
    const sampleHotelId = '1000000001';
    await HotelProperty.findOneAndUpdate(
      { hotelPropertyId: sampleHotelId },
      {
        hotelPropertyId: sampleHotelId,
        hotelAdminId: 'admin',
        hotelName: 'The Grand Horizon Palace & Resort',
        hotelAddress: '42 MG Road, Ashok Nagar, Bengaluru, Karnataka 560001',
        hotelLatLong: '12.9753,77.6062',
        hotelContactNumber: '+91 98765 43210',
        paidTill: Date.now() + 365 * 24 * 60 * 60 * 1000,
      },
      { upsert: true, new: true }
    );
    console.log('Seeded Hotel Property: "The Grand Horizon Palace & Resort" (ID: 1000000001)');

    // 3. Sub Components
    const sampleSubComponents = [
      {
        componentTypeId: 1, // Dining / Restaurants
        hotelPropertyId: sampleHotelId,
        subComponentTypeId: 101,
        title: 'The Royal Spice Pavilion',
        subTitle: 'Authentic Mughlai & Royal Indian Fine Dining',
        imageLink: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        data1: 'Timings: 12:00 PM - 11:30 PM',
        data2: 'Phone: +91 98765 11001',
        data3: 'Avg Cost: ₹1,800 for two',
        data4: 'Specialties: Dum Biryani, Galouti Kebab, Dal Bukhara',
        data5: 'Valet Parking: Available',
      },
      {
        componentTypeId: 1,
        hotelPropertyId: sampleHotelId,
        subComponentTypeId: 102,
        title: 'Azure Coastal Bistro',
        subTitle: 'Fresh Coastal Seafood & Mediterranean Deck',
        imageLink: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
        data1: 'Timings: 11:00 AM - 11:00 PM',
        data2: 'Phone: +91 98765 11002',
        data3: 'Avg Cost: ₹2,200 for two',
        data4: 'Specialties: Butter Garlic Prawns, Grilled Sea Bass, Sangria',
        data5: 'Live Music: Friday & Saturday Evenings',
      },
      {
        componentTypeId: 2, // Gyms & Wellness
        hotelPropertyId: sampleHotelId,
        subComponentTypeId: 201,
        title: 'Olympus Elite Wellness & Crossfit',
        subTitle: 'State-of-the-Art Fitness Arena & Thermal Spa',
        imageLink: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
        data1: 'Timings: 5:30 AM - 10:30 PM',
        data2: 'Phone: +91 98765 22001',
        data3: 'Day Pass: ₹500 (Free for Hotel Guests)',
        data4: 'Amenities: Steam Room, Cryo Recovery, Personal Trainers',
        data5: 'Equipments: Hammer Strength & Technogym',
      },
      {
        componentTypeId: 3, // Takeaways
        hotelPropertyId: sampleHotelId,
        subComponentTypeId: 301,
        title: 'Artisan Woodfired Crust Co.',
        subTitle: 'Handcrafted Neapolitan Sourdough Pizzas',
        imageLink: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
        data1: 'Timings: 11:30 AM - 12:00 AM',
        data2: 'Phone: +91 98765 33001',
        data3: 'Avg Prep Time: 15 Minutes',
        data4: 'Best Picks: Truffle Burrata Pizza, San Marzano Margherita',
        data5: 'Packaging: 100% Eco-Friendly Biodegradable',
      },
      {
        componentTypeId: 4, // Home Delivery
        hotelPropertyId: sampleHotelId,
        subComponentTypeId: 401,
        title: 'Gourmet Express Room Drop',
        subTitle: 'Curated Multi-Restaurant Express Room Delivery',
        imageLink: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80',
        data1: 'Availability: 24 Hours / 7 Days',
        data2: 'Concierge Hotline: Ext. 104',
        data3: 'Avg Delivery Time: 25 - 35 mins',
        data4: 'Delivery Fee: Zero Charge for Hotel Guests',
        data5: 'Payment: Charge directly to Room Folio',
      },
    ];

    for (const item of sampleSubComponents) {
      await DisplaySubComponent.findOneAndUpdate(
        {
          componentTypeId: item.componentTypeId,
          hotelPropertyId: item.hotelPropertyId,
          subComponentTypeId: item.subComponentTypeId,
        },
        item,
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${sampleSubComponents.length} sub-components.`);

    console.log('Sample data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();

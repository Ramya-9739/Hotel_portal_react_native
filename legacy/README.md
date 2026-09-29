# Hotel Portal React Native & REST API

An enterprise hotel concierge and dynamic 5-quadrant showcase portal built with **React Native (Expo)** on the frontend and an **Express / MongoDB** backend.

## 🌟 Key Features

* **5-Quadrant Master Guest Showcase**:
  * **Top**: Tourist Attractions & Excursions
  * **Left**: Shopping Malls, Silk Ateliers & Wellness
  * **Center**: Dynamic Hotel Showcase, High-Resolution Gallery & Interactive Map
  * **Right**: Emergency Hospitals & Transit Hubs
  * **Bottom**: Cafes, Gyms, Swimming Pools, Takeaways & Home Delivery (Faculty 5-Column Schema)
* **Zero Hardcoded Data**:
  * Every hotel, coordinate, and nearby destination is dynamically discovered and saved.
  * Verified hotel GPS coordinates serve as the permanent origin for all turn-by-turn Google Maps driving directions.
* **Administrator Console**:
  * Full CRUD management for hotel properties, places, and categories.
  * 8-slot photo uploader with generated 10-digit IDs and client-side compression.
  * Accepted payment methods configuration.
* **REST API Backend**:
  * Express.js server with MongoDB integration.
  * Endpoints for hotel admins, hotel properties, display components, sub-components, and pictures.
  * JWT Bearer token authentication with bcrypt password encryption.

---

## 🛠️ Technology Stack

* **Frontend**: React Native, React Native Web, Expo SDK 52
* **Backend**: Node.js, Express, Mongoose, Multer, JSON Web Tokens (JWT)
* **Database**: MongoDB

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
*Backend server runs on port 3000.*

### 2. Frontend Setup
```bash
npm install
npm run web
```
*Frontend runs on port 8081.*

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/hotel-admins/login` | Administrator authentication |
| `POST` | `/api/hotel-admins/register` | Administrator registration |
| `GET` | `/api/hotel-properties` | List all hotel properties |
| `POST` | `/api/hotel-properties` | Create new hotel property |
| `GET` | `/api/display-components` | Fetch display components |
| `GET` | `/api/display-sub-components` | Fetch sub-components & listings |
| `GET` | `/health` | Server health check |

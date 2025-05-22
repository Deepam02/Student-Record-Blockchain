# Student Record Authentication System using Blockchain

A secure and immutable blockchain-based system for managing and authenticating student academic records. This system ensures the integrity and authenticity of student records through blockchain technology.

## 🌟 Features

- **Immutable Record Storage**: All student records are stored in a blockchain, ensuring data integrity and preventing unauthorized modifications
- **Secure Authentication**: Cryptographic verification of all records
- **RESTful API**: Complete API for managing student records
- **MongoDB Integration**: Persistent storage of blockchain data
- **Real-time Verification**: Instant verification of record authenticity
- **User-friendly Interface**: Clean and intuitive web interface

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn


## 📚 API Documentation

### Endpoints

#### Health Check
- `GET /api/health`
  - Returns the health status of the application and MongoDB connection

#### Records Management
- `POST /api/records`
  - Create a new student record
  - Required fields: studentName, studentId, courseDetails, grades

- `GET /api/records`
  - Retrieve all student records

- `GET /api/records/:hash`
  - Get a specific record by its hash

- `DELETE /api/records/:hash`
  - Delete a specific record (except genesis block)

#### Verification
- `GET /api/verify`
  - Verify the integrity of the entire blockchain
  - Returns chain validity status and block count

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Blockchain**: Custom implementation using crypto-js
- **Frontend**: Static files served from public directory
- **Deployment**: Vercel-ready configuration

## 🔒 Security Features

- Cryptographic hashing of all records
- Chain validation to ensure data integrity
- Protected against unauthorized modifications
- Secure MongoDB connection

## 📦 Dependencies

- express: Web framework
- mongoose: MongoDB object modeling
- crypto-js: Cryptographic functions
- cors: Cross-origin resource sharing
- body-parser: Request body parsing
- dotenv: Environment variable management

## 🚀 Deployment

The application is configured for deployment on Vercel. The `vercel.json` file contains the necessary configuration for serverless deployment.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


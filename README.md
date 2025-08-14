# Hospital Staff Management System

A comprehensive web application for hospital staff to manage endorsements and patient room assignments.

## Features

### 1. Endorsement System
- **General Endorsements**: Send messages to all staff members
- **Specific Endorsements**: Send targeted messages to specific staff members with email notifications
- **Acknowledgment System**: Staff must acknowledge endorsements with their initials
- **Real-time Updates**: See who has acknowledged each endorsement

### 2. Patient Room Management
- **Room Assignment**: Nurses can assign patient rooms with their extensions
- **Ward-based Organization**: Each ward manages its own patient rooms
- **Real-time Updates**: Track room assignments and updates

## Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Email (Optional)**
   - Open `server.js`
   - Update the email configuration in the `transporter` section:
   ```javascript
   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: {
       user: 'your-email@gmail.com', // Replace with your email
       pass: 'your-app-password'     // Replace with your app password
     }
   });
   ```
   - For Gmail, you'll need to generate an "App Password" in your Google Account settings

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Open your browser and go to `http://localhost:3000`

## Default Login Credentials

The system comes with pre-configured users:

### Admin Access
- **Email**: `admin@hospital.com`
- **Password**: `admin123`
- **Role**: Admin (can send endorsements and view all data)

### Nurse Access
- **Email**: `nurse1@hospital.com`
- **Password**: `nurse123`
- **Role**: Nurse (ICU ward)
- **Email**: `nurse2@hospital.com`
- **Password**: `nurse123`
- **Role**: Nurse (Emergency ward)

## How to Use

### For Administrators

1. **Login** with admin credentials
2. **Send Endorsements**:
   - Choose between "General" (all staff) or "Specific" (individual staff member)
   - Write your endorsement message
   - For specific endorsements, select the recipient from the dropdown
   - Click "Send Endorsement"

3. **Monitor Acknowledgments**:
   - View all endorsements and see who has acknowledged them
   - Track acknowledgment status with staff initials

### For Nurses

1. **Login** with nurse credentials
2. **View Endorsements**:
   - See all general endorsements and specific ones sent to you
   - Acknowledge endorsements by entering your initials
   - Track acknowledgment status

3. **Manage Patient Rooms**:
   - Add or update patient room assignments
   - Include patient name (optional) and your extension
   - Delete room assignments when no longer needed
   - View all rooms in your ward

## System Architecture

### Backend (Node.js/Express)
- **Authentication**: Simple email/password login
- **Data Storage**: JSON files for users, endorsements, and patient rooms
- **Email Notifications**: Automatic email alerts for specific endorsements
- **RESTful API**: Clean API endpoints for all operations

### Frontend (HTML/CSS/JavaScript)
- **Modern UI**: Responsive design with gradient backgrounds
- **Tab-based Navigation**: Separate sections for endorsements and patient rooms
- **Real-time Updates**: Dynamic content loading and updates
- **Mobile Responsive**: Works on desktop and mobile devices

## File Structure

```
hospital-staff-management/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── index.html             # Main application interface
├── README.md              # This file
├── users.json             # User data (auto-generated)
├── endorsements.json      # Endorsement data (auto-generated)
├── patient_rooms.json     # Patient room data (auto-generated)
└── wards.json             # Ward configuration (auto-generated)
```

## API Endpoints

### Authentication
- `POST /api/login` - User login

### Users
- `GET /api/users` - Get all users

### Endorsements
- `POST /api/endorsements` - Create new endorsement
- `GET /api/endorsements/:userEmail` - Get endorsements for user
- `POST /api/endorsements/:endorsementId/acknowledge` - Acknowledge endorsement

### Patient Rooms
- `GET /api/patient-rooms/:wardId` - Get rooms for a ward
- `POST /api/patient-rooms` - Add/update patient room
- `DELETE /api/patient-rooms/:wardId/:roomNumber` - Delete room assignment

## Customization

### Adding New Users
Edit the `initializeData()` function in `server.js` to add more users:

```javascript
{ email: 'newuser@hospital.com', password: 'password123', name: 'New User', role: 'nurse', ward: 'ICU' }
```

### Adding New Wards
Edit the wards array in the `initializeData()` function:

```javascript
{ id: 'NewWard', name: 'New Ward Name' }
```

### Styling
The application uses CSS custom properties and can be easily customized by modifying the styles in `index.html`.

## Security Notes

- This is a demonstration system with basic security
- Passwords are stored in plain text (not recommended for production)
- Email configuration should be properly secured in production
- Consider implementing proper session management for production use

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change the port in `server.js` (line 8)
   - Or kill the process using the port

2. **Email Not Sending**
   - Check email configuration in `server.js`
   - Ensure Gmail app password is correct
   - Check firewall/network settings

3. **Data Not Persisting**
   - Ensure the application has write permissions in the directory
   - Check that JSON files are not corrupted

### Development Mode
Run the server in development mode with auto-restart:
```bash
npm run dev
```

## Support

For issues or questions, check the console logs for error messages and ensure all dependencies are properly installed.

---

## **📅 Recent Updates (December 2024)**

### **Version 2.2.0 - Excel Export & Enhanced Wards**
- ✅ **Monthly Excel Export** - Export endorsements and PTH bookings to Excel
- ✅ **Enhanced ward list** - Now includes all 30 wards
- ✅ **Improved nurse registration** - Complete ward selection available
- ✅ **Excel report generation** - Automatic monthly reports with proper formatting

### **Version 2.1.0 - Ward Loading Fix**
- ✅ **Fixed ward loading issue** - All 30 wards now appear properly
- ✅ **Added automatic ward reload** - System handles loading automatically
- ✅ **Enhanced debug logging** - Better error tracking
- ✅ **Added manual reload button** - Admin can force reload if needed

### **Version 2.0.0 - Complete Feature Set**
- ✅ **Enhanced room management** with role-based access control
- ✅ **PTH test booking system** for doctors and nurses
- ✅ **Ward-based organization** throughout the system
- ✅ **Complete user management** with admin approval

---

**Note**: This is a presentation/demonstration system. For production use, implement proper security measures, database storage, and user management. 

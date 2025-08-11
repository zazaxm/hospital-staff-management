const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const HOST = '0.0.0.0'; // Allow external access

// Data storage
let users = [
  { email: 'admin@hospital.com', password: 'admin123', name: 'Admin', role: 'admin', status: 'approved' },
  { email: 'nurse1@hospital.com', password: 'nurse123', name: 'Nurse Sarah', role: 'nurse', ward: 'ICU', status: 'approved' },
  { email: 'nurse2@hospital.com', password: 'nurse123', name: 'Nurse John', role: 'nurse', ward: 'Emergency', status: 'approved' }
];

let pendingUsers = []; // New users waiting for approval
let endorsements = [];
let patientRooms = [];
let pthBookings = [];
let wards = [
  { id: 'A1', name: 'A1' },
  { id: 'A1-NURSERY', name: 'A1-NURSERY' },
  { id: 'A2', name: 'A2' },
  { id: 'A3-1', name: 'A3-1' },
  { id: 'A3-2', name: 'A3-2' },
  { id: 'A4', name: 'A4' },
  { id: 'B2', name: 'B2' },
  { id: 'B3-1', name: 'B3-1' },
  { id: 'B3-2', name: 'B3-2' },
  { id: 'CCU/B4', name: 'CCU/B4' },
  { id: 'C1', name: 'C1' },
  { id: 'C2', name: 'C2' },
  { id: 'C3', name: 'C3' },
  { id: 'C4/CVT', name: 'C4/CVT' },
  { id: 'D2', name: 'D2' },
  { id: 'D3-1', name: 'D3-1' },
  { id: 'D3-2', name: 'D3-2' },
  { id: 'D4-1', name: 'D4-1' },
  { id: 'D4-2', name: 'D4-2' },
  { id: 'E1', name: 'E1' },
  { id: 'E2', name: 'E2' },
  { id: 'E3', name: 'E3' },
  { id: 'F1', name: 'F1' },
  { id: 'F2', name: 'F2' },
  { id: 'F2-2', name: 'F2-2' },
  { id: 'F3', name: 'F3' },
  { id: 'CVSD', name: 'CVSD' },
  { id: 'CSICU', name: 'CSICU' }
];

// Helper functions
function readRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// API Routes
async function handleAPI(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Public signup endpoint
  if (pathname === '/api/signup' && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    
    if (!data || !data.email || !data.password || !data.name || !data.role) {
      return sendResponse(res, 400, { error: 'Missing required fields' });
    }

    // Check if user already exists (approved or pending)
    if (users.find(u => u.email === data.email) || pendingUsers.find(u => u.email === data.email)) {
      return sendResponse(res, 400, { error: 'User with this email already exists' });
    }

    const newUser = {
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role,
      ward: data.ward || null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    pendingUsers.push(newUser);
    sendResponse(res, 200, { 
      success: true, 
      message: 'Registration successful! Please wait for admin approval.',
      user: { email: newUser.email, name: newUser.name, role: newUser.role, status: 'pending' }
    });
    return;
  }

  // Authentication
  if (pathname === '/api/login' && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    
    if (!data || !data.email || !data.password) {
      return sendResponse(res, 400, { error: 'Missing credentials' });
    }

    // Check approved users first
    const user = users.find(u => u.email === data.email && u.password === data.password);
    if (user) {
      sendResponse(res, 200, {
        success: true,
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
          ward: user.ward
        }
      });
      return;
    }

    // Check pending users
    const pendingUser = pendingUsers.find(u => u.email === data.email && u.password === data.password);
    if (pendingUser) {
      return sendResponse(res, 401, { error: 'Your account is pending admin approval. Please wait.' });
    }

    return sendResponse(res, 401, { error: 'Invalid credentials' });
  }

  // Get users (admin only)
  if (pathname === '/api/users' && method === 'GET') {
    sendResponse(res, 200, users.map(u => ({ email: u.email, name: u.name, role: u.role, ward: u.ward })));
    return;
  }

  // Get pending users (admin only)
  if (pathname === '/api/pending-users' && method === 'GET') {
    sendResponse(res, 200, pendingUsers.map(u => ({ 
      email: u.email, 
      name: u.name, 
      role: u.role, 
      ward: u.ward,
      createdAt: u.createdAt 
    })));
    return;
  }

  // Approve user (admin only)
  if (pathname === '/api/approve-user' && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    
    if (!data || !data.email) {
      return sendResponse(res, 400, { error: 'Missing email' });
    }

    const pendingUserIndex = pendingUsers.findIndex(u => u.email === data.email);
    if (pendingUserIndex === -1) {
      return sendResponse(res, 404, { error: 'Pending user not found' });
    }

    const approvedUser = pendingUsers[pendingUserIndex];
    approvedUser.status = 'approved';
    users.push(approvedUser);
    pendingUsers.splice(pendingUserIndex, 1);

    sendResponse(res, 200, { 
      success: true, 
      message: 'User approved successfully',
      user: { email: approvedUser.email, name: approvedUser.name, role: approvedUser.role }
    });
    return;
  }

  // Reject user (admin only)
  if (pathname === '/api/reject-user' && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    
    if (!data || !data.email) {
      return sendResponse(res, 400, { error: 'Missing email' });
    }

    const pendingUserIndex = pendingUsers.findIndex(u => u.email === data.email);
    if (pendingUserIndex === -1) {
      return sendResponse(res, 404, { error: 'Pending user not found' });
    }

    pendingUsers.splice(pendingUserIndex, 1);
    sendResponse(res, 200, { success: true, message: 'User rejected successfully' });
    return;
  }

  // Create new user (Admin only) - direct creation without approval
  if (pathname === '/api/users' && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    
    if (!data || !data.email || !data.password || !data.name || !data.role) {
      return sendResponse(res, 400, { error: 'Missing required fields' });
    }

    // Check if user already exists
    if (users.find(u => u.email === data.email) || pendingUsers.find(u => u.email === data.email)) {
      return sendResponse(res, 400, { error: 'User with this email already exists' });
    }

    const newUser = {
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role,
      ward: data.ward || null,
      status: 'approved'
    };

    users.push(newUser);
    sendResponse(res, 200, { 
      success: true, 
      user: { email: newUser.email, name: newUser.name, role: newUser.role, ward: newUser.ward }
    });
    return;
  }

  // Delete user (Admin only)
  if (pathname.startsWith('/api/users/') && method === 'DELETE') {
    const userEmail = pathname.split('/')[3];
    
    const userIndex = users.findIndex(u => u.email === userEmail);
    if (userIndex === -1) {
      return sendResponse(res, 404, { error: 'User not found' });
    }

    // Prevent deleting admin users
    if (users[userIndex].role === 'admin') {
      return sendResponse(res, 400, { error: 'Cannot delete admin users' });
    }

    users.splice(userIndex, 1);
    sendResponse(res, 200, { success: true });
    return;
  }

  // Get wards
  if (pathname === '/api/wards' && method === 'GET') {
    sendResponse(res, 200, wards);
    return;
  }

  // Add new ward (Admin only)
  if (pathname === '/api/wards' && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    
    if (!data || !data.id || !data.name) {
      return sendResponse(res, 400, { error: 'Missing required fields' });
    }

    if (wards.find(w => w.id === data.id)) {
      return sendResponse(res, 400, { error: 'Ward with this ID already exists' });
    }

    const newWard = { id: data.id, name: data.name };
    wards.push(newWard);
    sendResponse(res, 200, { success: true, ward: newWard });
    return;
  }

  // Endorsements
  if (pathname === '/api/endorsements' && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    
    if (!data || !data.message || !data.type || !data.senderName) {
      return sendResponse(res, 400, { error: 'Missing required fields' });
    }

    const newEndorsement = {
      id: Date.now().toString(),
      message: data.message,
      type: data.type,
      recipientEmail: data.type === 'specific' ? data.recipientEmail : null,
      senderName: data.senderName,
      createdAt: new Date().toISOString(),
      acknowledgments: [],
      status: 'active'
    };

    endorsements.push(newEndorsement);
    sendResponse(res, 200, { success: true, endorsement: newEndorsement });
    return;
  }

  // Get endorsements for user
  if (pathname.startsWith('/api/endorsements/') && method === 'GET') {
    const userEmail = pathname.split('/')[3];
    const userEndorsements = endorsements.filter(e => 
      e.status === 'active' && 
      (e.type === 'general' || e.recipientEmail === userEmail)
    );
    sendResponse(res, 200, userEndorsements);
    return;
  }

  // Acknowledge endorsement
  if (pathname.includes('/acknowledge') && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    const endorsementId = pathname.split('/')[3];
    
    const endorsement = endorsements.find(e => e.id === endorsementId);
    if (!endorsement) {
      return sendResponse(res, 404, { error: 'Endorsement not found' });
    }

    if (!endorsement.acknowledgments.find(a => a.email === data.userEmail)) {
      endorsement.acknowledgments.push({
        email: data.userEmail,
        initials: data.userInitials,
        acknowledgedAt: new Date().toISOString()
      });
    }

    sendResponse(res, 200, { success: true });
    return;
  }

  // Patient rooms
  if (pathname.startsWith('/api/patient-rooms/') && method === 'GET') {
    const wardId = pathname.split('/')[3];
    const wardRooms = patientRooms.filter(room => room.wardId === wardId);
    sendResponse(res, 200, wardRooms);
    return;
  }

  if (pathname === '/api/patient-rooms' && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    
    if (!data || !data.wardId || !data.roomNumber || !data.nurseExtension || !data.nurseName) {
      return sendResponse(res, 400, { error: 'Missing required fields' });
    }

    const existingRoomIndex = patientRooms.findIndex(room => 
      room.wardId === data.wardId && room.roomNumber === data.roomNumber
    );

    const roomData = {
      wardId: data.wardId,
      roomNumber: data.roomNumber,
      patientName: data.patientName || '',
      nurseExtension: data.nurseExtension,
      nurseName: data.nurseName,
      updatedAt: new Date().toISOString()
    };

    if (existingRoomIndex >= 0) {
      patientRooms[existingRoomIndex] = roomData;
    } else {
      patientRooms.push(roomData);
    }

    sendResponse(res, 200, { success: true, room: roomData });
    return;
  }

    if (pathname.includes('/api/patient-rooms/') && method === 'DELETE') {
    const parts = pathname.split('/');
    const wardId = parts[3];
    const roomNumber = parts[4];
    
    patientRooms = patientRooms.filter(room => 
      !(room.wardId === wardId && room.roomNumber === roomNumber)
    );
    
    sendResponse(res, 200, { success: true });
    return;
  }

  // PTH Bookings endpoints
  if (pathname === '/api/pth-bookings' && method === 'GET') {
    sendResponse(res, 200, pthBookings);
    return;
  }
  
  if (pathname === '/api/pth-bookings' && method === 'POST') {
    const body = await readRequestBody(req);
    const data = parseJSON(body);
    
    if (!data || !data.accessionNumber || !data.mrn || !data.extensionNumber || !data.sendingTime) {
      return sendResponse(res, 400, { error: 'Missing required fields' });
    }
    
    const newBooking = {
      id: Date.now(),
      accessionNumber: data.accessionNumber,
      mrn: data.mrn,
      extensionNumber: data.extensionNumber,
      sendingTime: data.sendingTime,
      notes: data.notes || '',
      status: 'pending',
      createdBy: data.createdBy || 'unknown',
      createdByRole: data.createdByRole || 'unknown',
      createdAt: new Date().toISOString()
    };
    
    pthBookings.push(newBooking);
    sendResponse(res, 200, { success: true, booking: newBooking });
    return;
  }

  if (pathname.startsWith('/api/pth-bookings/') && method === 'DELETE') {
    const bookingId = parseInt(pathname.split('/')[3]);
    
    const bookingIndex = pthBookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
      return sendResponse(res, 404, { error: 'PTH booking not found' });
    }
    
    pthBookings.splice(bookingIndex, 1);
    sendResponse(res, 200, { success: true });
    return;
  }

  // Default API response
  sendResponse(res, 404, { error: 'API endpoint not found' });
}

// Main server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Serve static files
  if (pathname === '/' || pathname === '/index.html') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (pathname === '/test.html') {
    fs.readFile('test.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading test.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (pathname === '/test-user.html') {
    fs.readFile('test-user.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading test-user.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (pathname === '/debug.html') {
    fs.readFile('debug.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading debug.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (pathname === '/QUICK_TEST.html') {
    fs.readFile('QUICK_TEST.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading QUICK_TEST.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Handle API requests
  if (pathname.startsWith('/api/')) {
    await handleAPI(req, res);
    return;
  }

  // Default response
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`Hospital Staff Management System running on http://localhost:${PORT}`);
  console.log(`For mobile access, use your computer's IP address: http://YOUR_IP:${PORT}`);
  console.log('Default admin login: admin@hospital.com / admin123');
  console.log('Nurse login: nurse1@hospital.com / nurse123');
  console.log('New feature: Public signup with admin approval!');
}); 

/**
 * SSH Tunnel Application
 * 
 * This application:
 * 1. Establishes an SSH connection to a remote server
 * 2. Sets up port forwarding
 * 3. Provides a simple HTTP status endpoint
 */

const Client = require('ssh2').Client;
const http = require('http');

// SSH connection configuration
const sshConfig = {
  host: 'gb.dnstunnel.site',
  port: 22,
  username: 'sshocean-ahcenezozozo',
  password: 'skikd2100',
  readyTimeout: 30000, // 30 seconds timeout for connection
  keepaliveInterval: 10000 // Send keepalive packets every 10 seconds
};

// Create SSH client instance
const sshClient = new Client();

// Variable to track connection status
let isConnected = false;

/**
 * Function to establish SSH connection and set up forwarding
 */
function connectSSH() {
  console.log('Attempting to establish SSH connection...');
  
  sshClient.on('ready', () => {
    isConnected = true;
    console.log('SSH Connection established');
    
    // Set up port forwarding
    sshClient.forwardOut('0.0.0.0', 0, 'localhost', 80, (err, stream) => {
      if (err) {
        console.error('Port forwarding error:', err);
        return;
      }
      console.log('Port forwarding established to remote port 80');
      
      // You can use the stream for data transfer if needed
      stream.on('close', () => {
        console.log('Port forwarding stream closed');
      });
    });
  });
  
  sshClient.on('error', (err) => {
    isConnected = false;
    console.error('SSH connection error:', err);
    // Attempt to reconnect after a delay
    setTimeout(reconnectSSH, 5000);
  });
  
  sshClient.on('end', () => {
    isConnected = false;
    console.log('SSH connection ended');
  });
  
  sshClient.on('close', (hadError) => {
    isConnected = false;
    console.log('SSH connection closed', hadError ? 'with error' : '');
    // Attempt to reconnect after a delay if not intentionally disconnected
    setTimeout(reconnectSSH, 5000);
  });
  
  // Connect using the configuration
  sshClient.connect(sshConfig);
}

/**
 * Function to reconnect SSH when connection is lost
 */
function reconnectSSH() {
  if (!isConnected) {
    console.log('Attempting to reconnect SSH...');
    connectSSH();
  }
}

/**
 * Set up HTTP server to provide status endpoint
 */
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  
  // Return simple status message
  res.end('Running SSH Tunnel');
});

// Start HTTP server
httpServer.listen(3000, '0.0.0.0', () => {
  console.log('HTTP status server running on http://0.0.0.0:3000');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Closing connections...');
  
  if (isConnected) {
    sshClient.end();
  }
  
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Closing connections...');
  
  if (isConnected) {
    sshClient.end();
  }
  
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Initialize SSH connection
connectSSH();

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class NetworkFixer {
  constructor() {
    this.projectRoot = __dirname;
    this.clientPath = path.join(this.projectRoot, 'client');
    this.backendPort = 5000;
    this.frontendPort = 3000;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔧',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkPort(port) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  async killProcessOnPort(port) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          await execAsync(`taskkill /PID ${pid} /F`);
          this.log(`Killed process ${pid} on port ${port}`, 'success');
        }
      }
    } catch (error) {
      this.log(`No processes found on port ${port}`, 'info');
    }
  }

  async findAvailablePort(startPort) {
    let port = startPort;
    while (await this.checkPort(port)) {
      port++;
    }
    return port;
  }

  createBackendEnv() {
    const envContent = `# Server Configuration
PORT=${this.backendPort}
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/tenant-ticketing-system

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@tenant-system.com

# SMS Configuration (Optional)
SMS_ENABLED=false
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp Configuration
WHATSAPP_GROUP_ID=your-whatsapp-group-id@g.us
WHATSAPP_GROUP_NAME=Maintenance Team

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
`;

    fs.writeFileSync(path.join(this.projectRoot, '.env'), envContent);
    this.log('Created backend .env file', 'success');
  }

  createFrontendEnv() {
    const envContent = `REACT_APP_API_URL=http://localhost:${this.backendPort}/api
GENERATE_SOURCEMAP=false
`;

    const clientEnvPath = path.join(this.clientPath, '.env');
    fs.writeFileSync(clientEnvPath, envContent);
    this.log('Created frontend .env file', 'success');
  }

  updateApiConfig() {
    const apiConfigPath = path.join(this.clientPath, 'src', 'api', 'api.js');
    
    const apiConfig = `import axios from "axios";

// API Configuration with automatic fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:${this.backendPort}/api";

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('🔌 Backend server is not running or unreachable');
      alert('Cannot connect to server. Please check if the backend is running.');
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    if (error.response?.status === 403) {
      console.error("Access forbidden:", error.response.data.message);
    }

    if (error.response?.status >= 500) {
      console.error("Server error:", error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default api;
`;

    // Ensure the directory exists
    const apiDir = path.dirname(apiConfigPath);
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }

    fs.writeFileSync(apiConfigPath, apiConfig);
    this.log('Updated API configuration', 'success');
  }

  updateServerDemo() {
    const serverPath = path.join(this.projectRoot, 'server-demo.js');
    
    if (!fs.existsSync(serverPath)) {
      this.log('server-demo.js not found, skipping server update', 'warning');
      return;
    }

    let serverContent = fs.readFileSync(serverPath, 'utf8');

    // Add CORS configuration if not present
    if (!serverContent.includes('app.use(cors(')) {
      const corsConfig = `
// Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(\`📡 \${new Date().toISOString()} - \${req.method} \${req.url}\`);
  next();
});
`;

      // Insert after express app creation
      serverContent = serverContent.replace(
        /const app = express\(\);/,
        `const app = express();${corsConfig}`
      );
    }

    // Ensure health endpoint exists
    if (!serverContent.includes('/health')) {
      const healthEndpoint = `
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || ${this.backendPort}
  });
});
`;

      serverContent = serverContent.replace(
        /app\.listen\(/,
        `${healthEndpoint}\napp.listen(`
      );
    }

    fs.writeFileSync(serverPath, serverContent);
    this.log('Updated server-demo.js with CORS and health check', 'success');
  }

  createStartupScripts() {
    // Windows batch file
    const batchContent = `@echo off
echo 🚀 Starting Tenant Ticketing System...

echo.
echo 📋 Checking ports...
netstat -ano | findstr :${this.backendPort} >nul
if %errorlevel% == 0 (
    echo ⚠️  Port ${this.backendPort} is in use, attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :${this.backendPort}') do taskkill /PID %%a /F >nul 2>&1
)

netstat -ano | findstr :${this.frontendPort} >nul
if %errorlevel% == 0 (
    echo ⚠️  Port ${this.frontendPort} is in use, attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :${this.frontendPort}') do taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 🔧 Starting backend server on port ${this.backendPort}...
start "Backend Server" cmd /k "set PORT=${this.backendPort} && node server-demo.js"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo 🎨 Starting frontend server on port ${this.frontendPort}...
cd client
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ Both servers are starting!
echo 📱 Frontend: http://localhost:${this.frontendPort}
echo 🔧 Backend: http://localhost:${this.backendPort}
echo 🏥 Health Check: http://localhost:${this.backendPort}/health
echo.
pause
`;

    fs.writeFileSync(path.join(this.projectRoot, 'start-fixed.bat'), batchContent);
    this.log('Created start-fixed.bat script', 'success');

    // PowerShell script
    const psContent = `# Tenant Ticketing System Startup Script
Write-Host "🚀 Starting Tenant Ticketing System..." -ForegroundColor Green

Write-Host "📋 Checking and freeing ports..." -ForegroundColor Yellow
$backendProcesses = Get-NetTCPConnection -LocalPort ${this.backendPort} -ErrorAction SilentlyContinue
if ($backendProcesses) {
    $backendProcesses | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Write-Host "✅ Freed port ${this.backendPort}" -ForegroundColor Green
}

$frontendProcesses = Get-NetTCPConnection -LocalPort ${this.frontendPort} -ErrorAction SilentlyContinue
if ($frontendProcesses) {
    $frontendProcesses | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Write-Host "✅ Freed port ${this.frontendPort}" -ForegroundColor Green
}

Write-Host "🔧 Starting backend server..." -ForegroundColor Cyan
$env:PORT = "${this.backendPort}"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server-demo.js" -WindowStyle Normal

Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🎨 Starting frontend server..." -ForegroundColor Cyan
Set-Location client
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

Write-Host "✅ Startup complete!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:${this.frontendPort}" -ForegroundColor White
Write-Host "🔧 Backend: http://localhost:${this.backendPort}" -ForegroundColor White
Write-Host "🏥 Health Check: http://localhost:${this.backendPort}/health" -ForegroundColor White

Read-Host "Press Enter to exit"
`;

    fs.writeFileSync(path.join(this.projectRoot, 'start-fixed.ps1'), psContent);
    this.log('Created start-fixed.ps1 script', 'success');
  }

  async testConnection() {
    this.log('Testing backend connection...', 'info');
    
    try {
      const response = await fetch(`http://localhost:${this.backendPort}/health`);
      if (response.ok) {
        this.log('Backend is responding correctly!', 'success');
        return true;
      } else {
        this.log(`Backend responded with status: ${response.status}`, 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Backend connection failed: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    console.log('🔧 Network Connection Fixer Starting...\n');

    try {
      // Step 1: Find available ports
      this.log('Finding available ports...', 'info');
      this.backendPort = await this.findAvailablePort(5000);
      this.frontendPort = await this.findAvailablePort(3000);
      
      if (this.backendPort !== 5000) {
        this.log(`Using alternative backend port: ${this.backendPort}`, 'warning');
      }
      if (this.frontendPort !== 3000) {
        this.log(`Using alternative frontend port: ${this.frontendPort}`, 'warning');
      }

      // Step 2: Kill existing processes
      this.log('Cleaning up existing processes...', 'info');
      await this.killProcessOnPort(this.backendPort);
      await this.killProcessOnPort(this.frontendPort);

      // Step 3: Create configuration files
      this.log('Creating configuration files...', 'info');
      this.createBackendEnv();
      this.createFrontendEnv();

      // Step 4: Update API configuration
      this.log('Updating API configuration...', 'info');
      this.updateApiConfig();

      // Step 5: Update server configuration
      this.log('Updating server configuration...', 'info');
      this.updateServerDemo();

      // Step 6: Create startup scripts
      this.log('Creating startup scripts...', 'info');
      this.createStartupScripts();

      // Step 7: Final instructions
      console.log('\n✅ Network fix complete!\n');
      console.log('🚀 To start your application, run one of these commands:');
      console.log(`   • start-fixed.bat (Windows batch file)`);
      console.log(`   • powershell -ExecutionPolicy Bypass -File start-fixed.ps1 (PowerShell)`);
      console.log(`   • Manual: PORT=${this.backendPort} node server-demo.js (in one terminal)`);
      console.log(`   •         cd client && npm start (in another terminal)\n`);
      
      console.log('🔗 Your application will be available at:');
      console.log(`   • Frontend: http://localhost:${this.frontendPort}`);
      console.log(`   • Backend:  http://localhost:${this.backendPort}`);
      console.log(`   • Health:   http://localhost:${this.backendPort}/health\n`);

      console.log('🔧 If you still have issues:');
      console.log('   1. Make sure Node.js and npm are installed');
      console.log('   2. Run "npm install" in both root and client directories');
      console.log('   3. Check Windows Firewall settings');
      console.log('   4. Try running as Administrator\n');

    } catch (error) {
      this.log(`Fix failed: ${error.message}`, 'error');
      console.log('\n❌ Please check the error above and try running the script again.');
    }
  }
}

// Run the fixer
const fixer = new NetworkFixer();
fixer.run().catch(console.error);
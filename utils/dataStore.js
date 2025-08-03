const fs = require('fs');
const path = require('path');

class DataStore {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.companiesFile = path.join(this.dataDir, 'companies.json');
    this.ticketsFile = path.join(this.dataDir, 'tickets.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Generic file operations
  readFile(filePath, defaultData = []) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
      return defaultData;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return defaultData;
    }
  }

  writeFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      return false;
    }
  }

  // Users operations
  getUsers() {
    return this.readFile(this.usersFile, []);
  }

  saveUsers(users) {
    return this.writeFile(this.usersFile, users);
  }

  addUser(user) {
    const users = this.getUsers();
    const newId = String(Math.max(...users.map(u => parseInt(u._id) || 0), 0) + 1);
    const newUser = {
      ...user,
      _id: newId,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  updateUser(userId, updates) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u._id === userId);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      this.saveUsers(users);
      return users[userIndex];
    }
    return null;
  }

  deleteUser(userId) {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u._id !== userId);
    if (filteredUsers.length !== users.length) {
      this.saveUsers(filteredUsers);
      return true;
    }
    return false;
  }

  // Companies operations
  getCompanies() {
    return this.readFile(this.companiesFile, []);
  }

  saveCompanies(companies) {
    return this.writeFile(this.companiesFile, companies);
  }

  addCompany(company) {
    const companies = this.getCompanies();
    const newId = String(Math.max(...companies.map(c => parseInt(c._id) || 0), 0) + 1);
    const newCompany = {
      ...company,
      _id: newId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    companies.push(newCompany);
    this.saveCompanies(companies);
    return newCompany;
  }

  updateCompany(companyId, updates) {
    const companies = this.getCompanies();
    const companyIndex = companies.findIndex(c => c._id === companyId);
    if (companyIndex !== -1) {
      companies[companyIndex] = { ...companies[companyIndex], ...updates };
      this.saveCompanies(companies);
      return companies[companyIndex];
    }
    return null;
  }

  deleteCompany(companyId) {
    const companies = this.getCompanies();
    const filteredCompanies = companies.filter(c => c._id !== companyId);
    if (filteredCompanies.length !== companies.length) {
      this.saveCompanies(filteredCompanies);
      return true;
    }
    return false;
  }

  // Tickets operations (for future use)
  getTickets() {
    return this.readFile(this.ticketsFile, []);
  }

  saveTickets(tickets) {
    return this.writeFile(this.ticketsFile, tickets);
  }
}

module.exports = new DataStore();

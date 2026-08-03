const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize database connection based on environment
const dbDialect = process.env.DB_DIALECT || 'sqlite';

let sequelizeConfig;

if (dbDialect === 'sqlite') {
  sequelizeConfig = {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE
      ? path.resolve(process.env.DB_STORAGE)
      : path.join(__dirname, '..', 'database.sqlite'),
    logging: false
  };
} else {
  // PostgreSQL / MySQL / MariaDB
  sequelizeConfig = {
    dialect: dbDialect,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'inspectai',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  };
}

const sequelize = new Sequelize(sequelizeConfig);

// User Model
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  role: { 
    type: DataTypes.ENUM('super_admin', 'inspection_authority', 'inspector', 'representative'), 
    allowNull: false 
  },
  name: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// Institution Model
const Institution = sequelize.define('Institution', {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'university' }, // school, college, university, institute
  address: { type: DataTypes.STRING },
  region: { type: DataTypes.STRING },
  accreditationDetails: { type: DataTypes.TEXT }, // JSON String of NAAC/NBA/etc.
  infrastructureDetails: { type: DataTypes.TEXT }, // JSON String
  departments: { type: DataTypes.TEXT }, // JSON String
  facultyCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  studentCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  contactEmail: { type: DataTypes.STRING },
  logo: { type: DataTypes.STRING },
  complianceScore: { type: DataTypes.FLOAT, defaultValue: 100 }
});

// Inspection Model
const Inspection = sequelize.define('Inspection', {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  institutionId: { type: DataTypes.UUID, allowNull: false },
  inspectorId: { type: DataTypes.UUID, allowNull: true },
  status: { 
    type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'under_review'), 
    defaultValue: 'scheduled' 
  },
  scheduledDate: { type: DataTypes.DATE, allowNull: false },
  completedDate: { type: DataTypes.DATE },
  checklistData: { type: DataTypes.TEXT }, // JSON String for checklist answers
  complianceScore: { type: DataTypes.FLOAT },
  reportSummary: { type: DataTypes.TEXT }, // JSON String for summary/strengths/weaknesses
  voiceNotes: { type: DataTypes.STRING }, // Path to voice notes file
  gpsLocation: { type: DataTypes.STRING }, // JSON String { lat, lng }
  inspectorSignature: { type: DataTypes.TEXT } // Base64 signature
});

// Finding Model (Violations/issues detected during inspection or AI scans)
const Finding = sequelize.define('Finding', {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  inspectionId: { type: DataTypes.UUID, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false }, // Infrastructure, Safety, etc.
  description: { type: DataTypes.TEXT, allowNull: false },
  severity: { 
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low'), 
    defaultValue: 'medium' 
  },
  imagePath: { type: DataTypes.STRING },
  aiDetected: { type: DataTypes.BOOLEAN, defaultValue: false },
  resolved: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// ActionItem Model (Corrective Actions Kanban)
const ActionItem = sequelize.define('ActionItem', {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  institutionId: { type: DataTypes.UUID, allowNull: false },
  inspectionId: { type: DataTypes.UUID, allowNull: false },
  findingId: { type: DataTypes.UUID, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  priority: { 
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low'), 
    defaultValue: 'medium' 
  },
  status: { 
    type: DataTypes.ENUM('pending', 'in_progress', 'under_review', 'resolved'), 
    defaultValue: 'pending' 
  },
  deadline: { type: DataTypes.DATE },
  evidencePath: { type: DataTypes.STRING },
  comments: { type: DataTypes.TEXT }
});

// AuditLog Model
const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  action: { type: DataTypes.STRING, allowNull: false },
  details: { type: DataTypes.TEXT },
  timestamp: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

// Relationships
Institution.hasMany(Inspection, { foreignKey: 'institutionId' });
Inspection.belongsTo(Institution, { foreignKey: 'institutionId' });

User.hasMany(Inspection, { foreignKey: 'inspectorId', as: 'AssignedInspections' });
Inspection.belongsTo(User, { foreignKey: 'inspectorId', as: 'Inspector' });

Inspection.hasMany(Finding, { foreignKey: 'inspectionId' });
Finding.belongsTo(Inspection, { foreignKey: 'inspectionId' });

Institution.hasMany(ActionItem, { foreignKey: 'institutionId' });
ActionItem.belongsTo(Institution, { foreignKey: 'institutionId' });

Inspection.hasMany(ActionItem, { foreignKey: 'inspectionId' });
ActionItem.belongsTo(Inspection, { foreignKey: 'inspectionId' });

Finding.hasMany(ActionItem, { foreignKey: 'findingId' });
ActionItem.belongsTo(Finding, { foreignKey: 'findingId' });

module.exports = {
  sequelize,
  User,
  Institution,
  Inspection,
  Finding,
  ActionItem,
  AuditLog
};

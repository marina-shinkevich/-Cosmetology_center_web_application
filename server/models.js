const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // ─── Roles ───────────────────────────────────────────────────────────────
  const Role = sequelize.define('Role', {
    RoleID:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    RoleName: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  }, { tableName: 'Roles', timestamps: false });

  // ─── Users ───────────────────────────────────────────────────────────────
  const User = sequelize.define('User', {
    UserID:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    RoleID:       { type: DataTypes.INTEGER, allowNull: false },
    FirstName:    { type: DataTypes.STRING(100), allowNull: false },
    LastName:     { type: DataTypes.STRING(100), allowNull: false },
    Login:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
    PasswordHash: { type: DataTypes.STRING(255), allowNull: false },
    Phone:        { type: DataTypes.STRING(30) },
    Email:        { type: DataTypes.STRING(150) },
    Photo:        { type: DataTypes.BLOB },
    IsActive:     { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'Users', timestamps: false });

  // ─── Profiles (медкарта) ─────────────────────────────────────────────────
  const Profile = sequelize.define('Profile', {
    ProfileID:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserID:          { type: DataTypes.INTEGER, allowNull: false },
    BirthDate:       { type: DataTypes.DATEONLY },
    Gender:          { type: DataTypes.STRING(10) },
    Allergies:       { type: DataTypes.TEXT },
    ChronicDiseases: { type: DataTypes.TEXT },
    Medications:     { type: DataTypes.TEXT },
  }, { tableName: 'Profiles', timestamps: false });

  // ─── ServiceCategories ───────────────────────────────────────────────────
  const ServiceCategory = sequelize.define('ServiceCategory', {
    CategoryID:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CategoryName: { type: DataTypes.STRING(150), allowNull: false },
    IsActive:     { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'ServiceCategories', timestamps: false });

  // ─── MainServices ────────────────────────────────────────────────────────
  const MainService = sequelize.define('MainService', {
    ServiceID:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ServiceName:     { type: DataTypes.STRING(200), allowNull: false },
    Description:     { type: DataTypes.TEXT },
    CategoryID:      { type: DataTypes.INTEGER },
    Price:           { type: DataTypes.DECIMAL(10, 2) },
    DurationMinutes: { type: DataTypes.INTEGER },
    Effect:          { type: DataTypes.TEXT },
    Indications:     { type: DataTypes.TEXT },
    Photo:           { type: DataTypes.BLOB },
    IsActive:        { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'MainServices', timestamps: false });

  // ─── Medications ─────────────────────────────────────────────────────────
  const Medication = sequelize.define('Medication', {
    MedID:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MedName:     { type: DataTypes.STRING(200), allowNull: false },
    Description: { type: DataTypes.TEXT },
    Photo:       { type: DataTypes.BLOB },
  }, { tableName: 'Medications', timestamps: false });

  // ─── ProcedureMedications ────────────────────────────────────────────────
  const ProcedureMedication = sequelize.define('ProcedureMedication', {
    ProcID: { type: DataTypes.INTEGER, primaryKey: true },
    MedID:  { type: DataTypes.INTEGER, primaryKey: true },
  }, { tableName: 'ProcedureMedications', timestamps: false });

  // ─── MainSpecialists ─────────────────────────────────────────────────────
  const MainSpecialist = sequelize.define('MainSpecialist', {
    SpecialistID:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserID:          { type: DataTypes.INTEGER },
    Experience:      { type: DataTypes.STRING(255) },
    SpecDescription: { type: DataTypes.TEXT },
    Education:       { type: DataTypes.TEXT },
  }, { tableName: 'MainSpecialists', timestamps: false });

  // ─── SpecialistService ───────────────────────────────────────────────────
  const SpecialistService = sequelize.define('SpecialistService', {
    SpecID:    { type: DataTypes.INTEGER, primaryKey: true },
    ServiceID: { type: DataTypes.INTEGER, primaryKey: true },
  }, { tableName: 'SpecialistService', timestamps: false });

  // ─── ReservationStatuses ─────────────────────────────────────────────────
  const ReservationStatus = sequelize.define('ReservationStatus', {
    StatusID:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    StatusName: { type: DataTypes.STRING(100), allowNull: false },
  }, { tableName: 'ReservationStatuses', timestamps: false });

  // ─── Reservations ────────────────────────────────────────────────────────
  const Reservation = sequelize.define('Reservation', {
    ReservID:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserID:       { type: DataTypes.INTEGER, allowNull: false },
    SpecialistID: { type: DataTypes.INTEGER, allowNull: false },
    ServiceID:    { type: DataTypes.INTEGER, allowNull: false },
    ReservDate:   { type: DataTypes.DATEONLY, allowNull: false },
    ReservTime:   { type: DataTypes.TIME, allowNull: false },
    StatusID:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  }, { tableName: 'Reservations', timestamps: false });

  // ─── WorkingHours ────────────────────────────────────────────────────────
  const WorkingHour = sequelize.define('WorkingHour', {
    WorkHID:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    SpecialistID: { type: DataTypes.INTEGER, allowNull: false },
    DayOfWeek:    { type: DataTypes.INTEGER, allowNull: false },
    StartTime:    { type: DataTypes.TIME },
    EndTime:      { type: DataTypes.TIME },
    IsWorkingDay: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'WorkingHours', timestamps: false });

  // ─── BreakSlots ──────────────────────────────────────────────────────────
  const BreakSlot = sequelize.define('BreakSlot', {
    BreakID:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    SpecID:       { type: DataTypes.INTEGER, allowNull: false },
    DayOfWeek:    { type: DataTypes.INTEGER, allowNull: false },
    BreakStart:   { type: DataTypes.TIME, allowNull: false },
    BreakEnd:     { type: DataTypes.TIME, allowNull: false },
  }, { tableName: 'BreakSlots', timestamps: false });

  // ─── MedicalRecords (рекомендации) ───────────────────────────────────────
  const MedicalRecord = sequelize.define('MedicalRecord', {
    RecID:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ClientID:        { type: DataTypes.INTEGER, allowNull: false },
    SpecialistID:    { type: DataTypes.INTEGER, allowNull: false },
    Recommendations: { type: DataTypes.TEXT },
  }, { tableName: 'MedicalRecords', timestamps: false });

  // ─── PrescribeMedications ────────────────────────────────────────────────
  const PrescribeMedication = sequelize.define('PrescribeMedication', {
    PrescID:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MedicationName:  { type: DataTypes.STRING(255), allowNull: false },
    IntakeFrequency: { type: DataTypes.STRING(255) },
    CourseDuration:  { type: DataTypes.STRING(255) },
    Instructions:    { type: DataTypes.TEXT },
    ClientID:        { type: DataTypes.INTEGER },
    SpecialistID:    { type: DataTypes.INTEGER },
    PrescribedDate:  { type: DataTypes.DATE },
    IsActive:        { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'PrescribeMedications', timestamps: false });

  // ─── Reviews ─────────────────────────────────────────────────────────────
  const Review = sequelize.define('Review', {
    RevID:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserID: { type: DataTypes.INTEGER, allowNull: false },
    Text:   { type: DataTypes.TEXT, allowNull: false },
  }, { tableName: 'Reviews', timestamps: false });

  // ─── Associations ────────────────────────────────────────────────────────
  User.belongsTo(Role, { foreignKey: 'RoleID' });
  Role.hasMany(User, { foreignKey: 'RoleID' });

  Profile.belongsTo(User, { foreignKey: 'UserID' });
  User.hasOne(Profile, { foreignKey: 'UserID' });

  MainService.belongsTo(ServiceCategory, { foreignKey: 'CategoryID' });
  ServiceCategory.hasMany(MainService, { foreignKey: 'CategoryID' });

  MainSpecialist.belongsTo(User, { foreignKey: 'UserID' });
  User.hasOne(MainSpecialist, { foreignKey: 'UserID' });

  Reservation.belongsTo(User, { foreignKey: 'UserID' });
  Reservation.belongsTo(MainSpecialist, { foreignKey: 'SpecialistID' });
  Reservation.belongsTo(MainService, { foreignKey: 'ServiceID' });
  Reservation.belongsTo(ReservationStatus, { foreignKey: 'StatusID' });

  WorkingHour.belongsTo(MainSpecialist, { foreignKey: 'SpecialistID' });
  BreakSlot.belongsTo(MainSpecialist, { foreignKey: 'SpecID', as: 'Specialist' });

  MedicalRecord.belongsTo(User, { foreignKey: 'ClientID', as: 'Client' });
  MedicalRecord.belongsTo(User, { foreignKey: 'SpecialistID', as: 'SpecialistUser' });

  PrescribeMedication.belongsTo(User, { foreignKey: 'ClientID', as: 'Client' });
  PrescribeMedication.belongsTo(MainSpecialist, { foreignKey: 'SpecialistID', as: 'Specialist' });

  Review.belongsTo(User, { foreignKey: 'UserID' });

  return {
    Role, User, Profile, ServiceCategory, MainService, Medication,
    ProcedureMedication, MainSpecialist, SpecialistService,
    ReservationStatus, Reservation, WorkingHour, BreakSlot,
    MedicalRecord, PrescribeMedication, Review,
  };
};

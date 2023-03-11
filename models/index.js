const { Sequelize } = require('sequelize');

// Sequelize Initialization
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD,
    {
        host: process.env.DB_SERVER,
        port: process.env.DB_PORT,
        dialect: 'mssql',
        pool: {
            min: 0,
            max: 5,
            idle: 10_000,
            acquire: 30_000
        }
    }
);

// Create object DB
const db = {};

// Add instance of Sequelize
db.sequelize = sequelize;

// Add Models
db.Category = require('./category')(sequelize);
db.Message = require('./message')(sequelize);
db.Subject = require('./subject')(sequelize);
db.CategorySubject = require('./categorySubject')(sequelize);
db.Member = require('./member')(sequelize);

// Add Association
// - [One to Many] Message - Subject
db.Subject.hasMany(db.Message, {
    foreignKey: {
        allowNull: false
    },
    onDelete: 'NO ACTION',
    onUpdate: 'CASCADE'
});
db.Message.belongsTo(db.Subject);
// - [Many to Many] Subject - Category
db.Subject.belongsToMany(db.Category, { through: db.CategorySubject });
db.Category.belongsToMany(db.Subject, { through: db.CategorySubject });
// - [One to Many] Subject - Member 
db.Member.hasMany(db.Subject, {
    foreignKey: {
        allowNull: false
    },
    onDelete: 'NO ACTION',
    onUpdate: 'CASCADE'
});
db.Subject.belongsTo(db.Member);
// - [One to Many] Message - Member  
db.Member.hasMany(db.Message, {
    foreignKey: {
        allowNull: false
    },
    onDelete: 'NO ACTION',
    onUpdate: 'CASCADE'
});
db.Message.belongsTo(db.Member);

// Export object DB
module.exports = db;

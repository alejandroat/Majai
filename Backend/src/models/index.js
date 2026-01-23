const Sequelize = require('sequelize');
const sequelize = require('../config/database');


const db = {};


db.Sequelize = Sequelize;
db.sequelize = sequelize;


db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Inventario = require('./inventario')(sequelize, Sequelize.DataTypes);
db.Arrendamiento = require('./arrendamiento')(sequelize, Sequelize.DataTypes);
db.Abonos = require('./abonos')(sequelize, Sequelize.DataTypes);

// Relaciones
// Un Arrendamiento pertenece a un Inventario
db.Arrendamiento.belongsTo(db.Inventario, {
    foreignKey: 'idInventario',
    as: 'inventario',
});

// Un Inventario puede tener muchos Arrendamientos
db.Inventario.hasMany(db.Arrendamiento, {
    foreignKey: 'idInventario',
    as: 'arrendamientos',
});

// Un Abono pertenece a un Arrendamiento
db.Abonos.belongsTo(db.Arrendamiento, {
    foreignKey: 'idArrendamiento',
    as: 'arrendamiento',
});

// Un Arrendamiento puede tener muchos Abonos
db.Arrendamiento.hasMany(db.Abonos, {
    foreignKey: 'idArrendamiento',
    as: 'abonos',
});

// Un Abono pertenece a un Usuario
db.Abonos.belongsTo(db.User, {
    foreignKey: 'idUsuario',
    as: 'usuario',
});

// Un Usuario puede tener muchos Abonos
db.User.hasMany(db.Abonos, {
    foreignKey: 'idUsuario',
    as: 'abonos',
});

module.exports = db;
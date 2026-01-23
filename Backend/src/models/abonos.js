module.exports = (sequelize, DataTypes) => {
    const Abonos = sequelize.define('Abonos', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        idArrendamiento: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        idUsuario: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        valor: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        tipoPago: {
            type: DataTypes.ENUM('Efectivo', 'Bold', 'Transferencia'),
            allowNull: true,
        }
    }, {
        timestamps: false
    });
    return Abonos;
};

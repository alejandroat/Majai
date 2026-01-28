module.exports = (sequelize, DataTypes) => {
    const Arrendamiento = sequelize.define('Arrendamiento', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        fechaInicio: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        fechaFin: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        idInventario: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        NombreCliente: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tipoDocumento: {
            type: DataTypes.ENUM('CC', 'TI', 'CE', 'PASAPORTE'),
            allowNull: false,
        },
        identificacionCliente: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        telefonoCliente: {
            type: DataTypes.ARRAY(DataTypes.STRING), 
            allowNull: false,
        },
        direccionCliente: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        deposito: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        valor: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        tipoPago: {
            type: DataTypes.ENUM('ABONO', 'CONTADO'),
            allowNull: false,
        },
        montoPagado: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        observaciones: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    }
);
    return Arrendamiento;
};
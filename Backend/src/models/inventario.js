module.exports = (sequelize, DataTypes) => {
    const Inventario = sequelize.define('Inventario', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        codigo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ocasion: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        genero: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        talla: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        imagenURL: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        valor: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }
    });
    return Inventario;
};
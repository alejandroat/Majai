const bcrypt2 = require('bcrypt');
const { sequelize } = require('../models');
const { User } = require('../models');


async function seed() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();


        const exists = await User.findOne({ where: { user: 'admin' } });
        if (exists) return console.log('Admin already exists');


        const hashed = await bcrypt2.hash('admin123', 10);
        await User.create({ name: 'Admin', user: 'admin', password: hashed, cargo: 'Administrador' });
        console.log('Admin created');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}


if (require.main === module) seed();
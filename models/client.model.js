module.exports = function (sequelize, Sequelize) {
    const Client = sequelize.define('client', {
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
        prenom: {
            type: Sequelize.STRING
            // allowNull defaults to true
        },
        contact1: {
            type: Sequelize.STRING,
            allowNull: false
        },
        contact2: {
            type: Sequelize.STRING,
           
        },
        adresse: {
            type: Sequelize.STRING,
           
        },
        credit: {
            type: Sequelize.INTEGER,
            defaultValue: '0'
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Client;
}


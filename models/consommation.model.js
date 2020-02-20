module.exports = function (sequelize, Sequelize) {
    const Consommation = sequelize.define('consommation', {
         //cle
        tableId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        chambreId: {
            type: Sequelize.INTEGER
        },
        clientId: {
            type: Sequelize.INTEGER
        },
         // attributes
         factureTotal: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        // attributes
        stoppedAt: {
            type: Sequelize.DATE
        },
        // attributes
        montantEncaisse: {
            type: Sequelize.INTEGER
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Consommation;
}
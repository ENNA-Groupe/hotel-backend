module.exports = function (sequelize, Sequelize) {
    const LocationChambre = sequelize.define('locationChambre', {
         //cle
        locationId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        prixUnitaire: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        nbreJours: {
            type: Sequelize.INTEGER,
        },
         // attributes
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return LocationChambre;
}
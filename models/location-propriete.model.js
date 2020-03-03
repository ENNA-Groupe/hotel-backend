module.exports = function (sequelize, Sequelize) {
    const LocationPropriete = sequelize.define('locationPropriete', {
         //cle
        locationId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        proprieteId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        coutAdditionnel: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        isChecked: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
         // attributes
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return LocationPropriete;
}
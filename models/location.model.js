module.exports = function (sequelize, Sequelize) {
    const Location = sequelize.define('location', {

        // attributes
        stoppedAt: {
            type: Sequelize.DATE
        },
        // attributes
        montantTotal: {
            type: Sequelize.INTEGER
        },
        prixJournalier: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        nbreJours: {
            type: Sequelize.INTEGER,
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Location;
}
module.exports = function (sequelize, Sequelize) {
    const Mesure = sequelize.define('mesure', {
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },    
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Mesure;
}


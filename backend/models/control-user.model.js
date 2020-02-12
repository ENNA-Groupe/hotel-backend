module.exports = function (sequelize, Sequelize) {
    const ControlUser = sequelize.define('controlUser', {
         //cle
         userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        // attributes
        controlId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        isChecked: {
            type: Sequelize.BOOLEAN,
            default: '0'
        }
    }, {
        // options
    });
    return ControlUser;
}
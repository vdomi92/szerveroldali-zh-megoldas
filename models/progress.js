"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Progress extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.Task);
            this.belongsTo(models.Employee);
        }
    }
    Progress.init(
        {
            progress: DataTypes.INTEGER,
            comment: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: "Progress",
        }
    );
    return Progress;
};

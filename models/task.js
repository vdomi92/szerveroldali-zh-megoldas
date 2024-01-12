"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Task extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.Project);
            this.hasMany(models.Progress, {
                onDelete: "cascade",
            });
            this.belongsToMany(models.Employee, { through: "EmployeeTask" });
        }
    }
    Task.init(
        {
            name: DataTypes.STRING,
            description: DataTypes.STRING,
            deadline: DataTypes.DATE,
            weight: DataTypes.FLOAT,
        },
        {
            sequelize,
            modelName: "Task",
        }
    );
    return Task;
};

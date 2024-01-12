"use strict";
const { Model, UniqueConstraintError } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Employee extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            this.hasMany(models.Progress);
            this.belongsToMany(models.Task, { through: "EmployeeTask", foreignKey: "EmployeeId" });
        }
    }
    Employee.init(
        {
            name: DataTypes.STRING,
            email: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: "Employee",
        }
    );
    return Employee;
};

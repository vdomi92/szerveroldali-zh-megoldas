"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        await queryInterface.createTable("EmployeeTask", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            EmployeeId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Employees", //EZ A BÜDÖS NYOMORULT DB TÁBLÁT ÉRT A MODELL ALATT
                    key: "id",
                },
                onDelete: "cascade",
            },
            TaskId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Tasks", //EZ A BÜDÖS NYOMORULT DB TÁBLÁT ÉRT A MODELL ALATT
                    key: "id",
                },
                onDelete: "cascade",
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });

        // Megkötés a kapcsolótáblára, amelyben megmondjuk, hogy egy EmployeeId - TaskId páros csak egyszer szerepelhet a kapcsolótáblában
        await queryInterface.addConstraint("EmployeeTask", {
            fields: ["EmployeeId", "TaskId"],
            type: "unique",
        });
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        await queryInterface.dropTable("EmployeeTask");
    },
};

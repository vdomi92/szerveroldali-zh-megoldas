"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Progresses", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            progress: {
                type: Sequelize.INTEGER,
                min: 0,
                max: 100,
                allowNull: false,
            },
            comment: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            TaskId: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: "Tasks", //EZ A BÜDÖS NYOMORULT DB TÁBLÁT ÉRT A MODELL ALATT
                    key: "id",
                },
                onDelete: "cascade",
            },
            EmployeeId: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: "Employees",
                    key: "id",
                },
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Progresses");
    },
};

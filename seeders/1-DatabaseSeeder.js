"use strict";

// Faker dokumentáció, API referencia: https://fakerjs.dev/guide/#node-js
const { faker } = require("@faker-js/faker");
const chalk = require("chalk");
// TODO: Importáld be a modelleket
// const { ... } = require("../models");
const db = require("./../models");
const { Employee, Progress, Project, Task } = db;

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // TODO: Ide dolgozd ki a seeder tartalmát:
        // ...
        const employeeCount = faker.number.int({ min: 12, max: 17 });
        const employees = [];
        for (let i = 0; i < employeeCount; i++) {
            employees.push(
                await Employee.create({
                    name: faker.person.fullName(),
                    email: `employee${i}@protonmail.com`,
                })
            );
        }

        const projectCount = faker.number.int({ min: 3, max: 6 });
        const projects = [];
        for (let i = 0; i < projectCount; i++) {
            projects.push(
                await Project.create({
                    name: faker.company.buzzNoun(),
                    code: faker.string.uuid(),
                    description: faker.lorem.sentence(),
                    deadline: faker.date.future(),
                })
            );
        }

        const taskCount = faker.number.int({ min: 10, max: 15 });
        const tasks = [];
        for (let i = 0; i < taskCount; i++) {
            let task = await Task.create({
                name: faker.company.buzzPhrase(),
                description: faker.company.catchPhrase(),
                deadline: faker.date.future(),
                weight: faker.number.float({ min: 0.1, max: 1.0 }),
                ProjectId: faker.helpers.arrayElement(projects).id,
            });

            task.setEmployees(faker.helpers.arrayElements(employees));

            tasks.push(task);
        }

        const progressCount = faker.number.int({ min: 15, max: 25 });
        const progresses = []; //igazából ez már nem kellene ide, mert nem használjuk később fel
        for (let i = 0; i < progressCount; i++) {
            let progress = await Progress.create({
                progress: faker.number.int({ min: 0, max: 99 }),
                comment: faker.lorem.words({ min: 0, max: 3 }),
                TaskId: faker.helpers.arrayElement(tasks).id,
                EmployeeId: faker.helpers.arrayElement(employees).id,
            });

            progresses.push(progress);
        }

        console.log(chalk.green("A DatabaseSeeder lefutott"));
    },

    // Erre alapvetően nincs szükséged, mivel a parancsok úgy vannak felépítve,
    // hogy tiszta adatbázist generálnak, vagyis a korábbi adatok enélkül is elvesznek
    down: async (queryInterface, Sequelize) => {},
};

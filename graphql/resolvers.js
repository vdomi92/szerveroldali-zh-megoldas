const auth = require("./auth");
const db = require("../models");
const { Sequelize, sequelize } = db;
const { Employee, Progress, Task, Project } = db;
const { ValidationError, DatabaseError, Op } = Sequelize;
// TODO: Importáld a modelleket
// const { /* modellek importálása itt */ } = db;
const { faker } = require("@faker-js/faker");
const date = require("date-and-time");

module.exports = {
    Query: {
        project: async (_, { id }) => await Project.findByPk(id),
        codeGenerator: async() => faker.string.alphanumeric({ length: 6, casing: 'upper' }),
        statistics: async() => {
//projectsPairTasks: azon projektek száma, amelyekhez páros számú feladat tartozik
//expiredTasks: azon feladatok száma, amelyeknek a határideje már lejárt
//employeesWithoutTasks: azon alkalmazottak száma, akikhez egyetlen feladat sincs hozzárendelve
            
            const projects = await Project.findAll();
            let projectsPairTasks = 0;
            for(const project of projects){
                const cunt = await Task.count({
                    where:{
                        ProjectId: project.id
                    }
                })
                
                if(cunt % 2 == 0){
                    ++projectsPairTasks;
                }
            }

            const tasks = await Task.findAll();
            let expiredTasks = 0;
            const now = new Date();
            date.format(now, "YYYY-MM-DD");
            for(const task of tasks){
                const deadline = date.format(task.deadline, "YYYY-MM-DD")
                if(deadline < now){
                    ++expiredTasks;
                }
            }

            const employees = await Employee.findAll();
            let employeesWithoutTasks = 0;
            for(const employee of employees){
                let tasks = await employee.getTasks();
                if(tasks.length == 0){
                    ++employeesWithoutTasks
                }
            }

            return {"projectsPairTasks": projectsPairTasks, "expiredTasks": expiredTasks, "employeesWithoutTasks": employeesWithoutTasks }
        }
    },

    Project: {
        //Itt a paraméter a parent objektuma a tasks-nak, vagyis egy projekt
        tasks: async (project) => {
            const tasks = await Task.findAll({
                where: { ProjectId: project.id },
                order: [["weight", "DESC"]],
            });
            return tasks;
        },

        progress: async (project) => {
            const tasks = await Task.findAll({
                where: { ProjectId: project.id },
            });

            if(tasks.length == 0){
                return 0
            }

            let sumWeights = 0;
            let sumWeightedProgresses = 0;

            for(const task of tasks){
                const taskId = task.id;
                const progressData = await Progress.findAll({
                    where: { TaskId: taskId },
                    order: [["createdAt", "DESC"]],
                    limit: 1, // Csak az első, vagyis legújabb előrehaladásra van szükségünk
                });

                const progress = progressData.length > 0 ? progressData[0].progress : 0;
                const weight = task.weight;

                sumWeights+= weight;
                sumWeightedProgresses += (weight * progress);
            }

            return sumWeightedProgresses / sumWeights;
        },

        employees: async (project) => {
            const tasks = await Task.findAll({
                where: { ProjectId: project.id },
            });

            const employees = [];

            for(const task of tasks){
                const taskEmployees = await task.getEmployees();
                for(const employee of taskEmployees){
                    let includes = false;

                    for(const emp of employees){
                        if(employee.id == emp.id){
                            includes = true;
                            break;
                        }
                    }

                    if(!includes){
                        employees.push(employee)
                    }                   
                }
            }

            return employees
        }
    },

    Task: {
        progress: async (task) => {
            const taskId = task.id;
            const progressData = await Progress.findAll({
                where: { TaskId: taskId },
                order: [["createdAt", "DESC"]],
                limit: 1, // Csak az első, vagyis legújabb előrehaladásra van szükségünk
            });

            // Ha van előrehaladás, visszaadjuk annak a progress mezőjét, különben 0-t
            return progressData.length > 0 ? progressData[0].progress : 0;
        },
    },

    Mutation: {
        createEmployee: auth(async (parent, { employee }, context, info) => {
            if(context.user.email != "projectmanager@example.com"){
                throw new Error('You are not authorized to create employees');
            }

            const {name, email } = employee;

            if(name.length < 3){
                throw new Error('Invalid name');
            }

            if(email.substring(0,8) != "employee" || email.split("@")[1] != "example.com"){
                throw new Error('Invalid email');
            }

            const emp = await Employee.findOne({
                where: { email: email },
            })

            if(emp){
                throw new Error('This email is already in use');
            }

            const newEmployee = await Employee.create({
                name: name,
                email: email
            });

            return newEmployee;
        }),

        deleteEmployees: auth(async (parent,  {emails} , context, info) => {
            if(context.user.email != "projectmanager@example.com"){
                throw new Error('You are not authorized to delete employees');
            }
        
            const invalid = [];
            const deleted = [];

            for(const email of emails){
                const employifasz = await Employee.findOne({
                    where: { email: email }
                }) 

                if(!employifasz){
                    invalid.push(email)
                }else{
                    deleted.push(email)
                    employifasz.destroy()
                }
            }

            return {invalid, deleted}
        }),
    },

};

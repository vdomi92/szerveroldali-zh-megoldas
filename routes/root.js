const { StatusCodes } = require("http-status-codes");
const S = require("fluent-json-schema");
const db = require("../models");
const { Sequelize, sequelize } = db;
const { ValidationError, DatabaseError, Op } = Sequelize;
// TODO: Importáld a modelleket
// const { /* modellek importálása itt */ } = db;
const { Employee, Progress, Task, Project } = db;
const date = require("date-and-time");

module.exports = function (fastify, opts, next) {
    // http://127.0.0.1:4000/
    fastify.get("/", async (request, reply) => {
        reply.send({ message: "Gyökér végpont" });

        // NOTE: A send alapból 200 OK állapotkódot küld, vagyis az előző sor ugyanaz, mint a következő:
        // reply.status(200).send({ message: "Gyökér végpont" });

        // A 200 helyett használhatsz StatusCodes.OK-ot is (így szemantikusabb):
        // reply.status(StatusCodes.OK).send({ message: "Gyökér végpont" });
    });

    // II. rész: REST API (20 pont, min. 8 pont elérése szükséges!)
    // 3. feladat: GET /projects (3 pont)
    // Lekéri az összes projektet a hozzájuk tartozó feladatok számával együtt (tasks). Fontos, hogy más mezőket ne tartalmazzon a válasz, csak a példában felsoroltakat!
    fastify.get("/projects", async (request, reply) => {
        try {
            const projects = await Project.findAll({
                attributes: ["id", "name", "description", "deadline", "createdAt", "updatedAt"],
                include: [
                    {
                        model: Task,
                        attributes: [[sequelize.fn("COUNT", sequelize.col("tasks.id")), "tasks"]],
                    },
                ],
                group: ["Project.id"],
                raw: true,
            });

            const renamedProjects = projects.map((project) => {
                return {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    deadline: project.deadline,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,
                    tasks: project["Tasks.tasks"],
                };
            });

            // Send the response
            reply.send(renamedProjects);
        } catch (error) {
            // Handle errors and return an appropriate response
            reply.code(500).send({ error: "Internal Server Error", message: error.message });
        }
    });

    // 4. feladat: GET /tasks/:id/progress (3 pont)
    fastify.get(
        "/tasks/:id/progress",
        {
            schema: {
                params: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const taskId = parseInt(request.params.id);

                // Ellenőrizd, hogy létezik-e a megadott id-vel feladat
                const task = await Task.findByPk(taskId);
                if (!task) {
                    reply.code(404).send();
                    return;
                }

                // Keresd meg a feladathoz tartozó utolsó előrehaladást
                const latestProgress = await Progress.findOne({
                    where: { TaskId: taskId },
                    order: [["progress", "DESC"]],
                });

                // Ha nincs előrehaladás, akkor progress = 0, egyébként az utolsó előrehaladás értéke
                const progressValue = latestProgress ? latestProgress.progress : 0;

                // Válasz küldése
                reply.send({ progress: progressValue });
            } catch (error) {
                // Hiba kezelése és megfelelő válasz küldése
                reply.code(500).send({ error: "Internal Server Error", message: error.message });
            }
        }
    );

    // 5. feladat: POST /create-project (3 pont)
    fastify.post(
        "/create-project",
        {
            onRequest: [fastify.auth, fastify.isPm],
            schema: {
                body: {
                    type: "object",
                    required: ["name", "description", "code", "deadline"],
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        code: {
                            type: "string",
                            minLength: 6,
                            maxLength: 6,
                        },
                        deadline: {
                            type: "string",
                        },
                        // deadline: { type: "string", pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                // const userEmail = request.user.email;
                const { name, code, description, deadline } = request.body;

                // Validáció
                if (!name || !code || !description || !deadline) {
                    reply.code(400).send({ error: "Bad Request", message: "Missing required fields." });
                    return;
                }

                //Dátum formátum ellenőrzése
                // https://github.com/knowledgecode/date-and-time#formatdateobj-arg-utc
                if (!date.isValid(deadline, "YYYY-MM-DD")) {
                    reply.code(400).send({ error: "Bad Request", message: "Bad date format." });
                    return;
                }

                // Validálás és projekt létrehozása
                let createdProject;
                try {
                    createdProject = await Project.create({
                        name,
                        code,
                        description,
                        deadline,
                    });
                } catch (err) {
                    // Ha a kód mező már létezik, akkor 409 Conflict
                    if (err.name === "SequelizeUniqueConstraintError" && err.fields.includes("code")) {
                        reply
                            .code(409)
                            .send({ error: "Conflict", message: "Project with the same code already exists." });
                        return;
                    }

                    // Egyéb adatbázis hibák esetén 500 Internal Server Error
                    reply.code(500).send({ error: "Internal Server Error", message: err.message });
                    return;
                }

                // Válasz küldése
                reply.code(201).send({
                    name: createdProject.name,
                    deadline: deadline,
                });
            } catch (error) {
                // Hiba kezelése
                reply.code(500).send({ error: "Internal Server Error", message: error.message });
            }
        }
    );

    // 6. feladat: POST /projects/:id/create-task (3 pont)
    fastify.post(
        "/projects/:id/create-task",
        {
            onRequest: [fastify.auth, fastify.isPm],
            schema: {
                params: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                    },
                },
                body: {
                    type: "object",
                    required: ["name", "weight", "description", "deadline"],
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        deadline: { type: "string" },
                        weight: { type: "number", format: "float", minimum: 0, maximum: 1 },
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const { name, weight, description, deadline } = request.body;

                //deadline: dátum, kötelező, és a következő formátumban kell megadni: ÉÉÉÉ-HH-NN (pl. 2023-05-31)
                if (!date.isValid(deadline, "YYYY-MM-DD")) {
                    reply.code(400).send({ error: "Bad Request", message: "Bad date format." });
                    return;
                }

                const projectId = parseInt(request.params.id);
                //Válasz, ha az id paraméter hiányzik vagy nem egész szám: 400 BAD REQUEST
                // if (isNaN(projectId) || !Number.isInteger(projectId)) {
                //     reply.code(400).send({ error: "BAD REQUEST", message: "Wrong id" });
                // }

                const project = await Project.findByPk(projectId);
                if (!project) {
                    reply.code(404).send();
                }

                let task = await Task.create({
                    name: name,
                    weight: weight,
                    description: description,
                    deadline: deadline,
                    ProjectId: projectId,
                });

                reply.code(201).send({
                    id: task.id,
                    name: task.name,
                    weight: task.weight,
                    description: task.description,
                    deadline: date.format(task.deadline, "YYYY-MM-DD"), //https://github.com/knowledgecode/date-and-time#formatdateobj-arg-utc
                });
            } catch (error) {
                reply.code(500).send({ error: "Internal Server Error", message: error.message });
            }
        }
    );

    // 7. feladat: POST /tasks/:id/assign-employees (5 pont)
    fastify.post(
        "/tasks/:id/assign-employees",
        {
            onRequest: [fastify.auth, fastify.isPm],
            schema: {
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: {
                            type: "integer",
                            minimum: 1,
                        },
                    },
                },
                body: {
                    type: "object",
                    required: ["employees"],
                    properties: {
                        employees: { type: "array", items: { type: "string" } },
                        // minItems(1) // Minimum egy elemnek kell lennie a tömbben
                        // maxItems(10), // Maximum tíz elemet engedélyezünk a tömbben,
                        mode: { type: "string", enum: ["add", "remove"], default: "add" },
                    },
                },
            },
        },
        async (request, reply) => {
            try {
                const { employees, mode } = request.body;

                const taskId = parseInt(request.params.id);

                const task = await Task.findByPk(taskId);
                if (!task) {
                    reply.code(404).send();
                }

                const previouslyAdded = await task.getEmployees();

                let invalid = [];
                let added = [];
                let removed = [];
                let current = [];

                for (const employee of previouslyAdded) {
                    current.push(employee.email);
                }

                for (const employeeEmail of employees) {
                    const employee = await Employee.findOne({
                        where: {
                            email: employeeEmail,
                        },
                    });

                    if (!employee) {
                        invalid.push(employeeEmail);
                        continue;
                    }

                    if (mode == "add" && !current.includes(employeeEmail)) {
                        added.push(employeeEmail);
                        task.addEmployee(employee);
                        continue;
                    }

                    if (mode == "remove" && current.includes(employeeEmail)) {
                        removed.push(employeeEmail);
                        task.removeEmployee(employee);
                        continue;
                    }
                }

                if (mode == "add") {
                    current = [...current, ...added];
                }

                if (mode == "remove") {
                    current = current.filter((val) => !removed.includes(val)); //current tömbben szerepel, de removed tömbben nem
                }

                const resp = {
                    invalid: invalid,
                    current: current,
                };

                mode == "add" ? (resp.added = added) : (resp.removed = removed);

                reply.code(200).send(resp);
            } catch (error) {
                // Hiba kezelése
                reply.code(500).send({ error: "Internal Server Error", message: error.message });
            }
        }
    );

    // http://127.0.0.1:4000/auth-protected
    fastify.get("/auth-protected", { onRequest: [fastify.auth] }, async (request, reply) => {
        reply.send({ user: request.user });
    });

    next();
};

module.exports.autoPrefix = "/";

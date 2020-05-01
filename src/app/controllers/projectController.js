
const express = require('express');
const authMiddleware = require('../middlewares/auth');

const Project = require('../models/Project');
const Task = require('../models/Task');

const router = express.Router();

router.use(authMiddleware);

//Listar todos os projetos

router.get('/', async (req, res) => {

    try {
        const projects = await Project.find().populate(['user', 'tasks']);

        return res.send({ projects });
    } catch (err) {
        res.status(400).send({ error: 'Error loading projects' });
    }
});

//Mostrar detalhes do projeto

router.get('/:projectId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate(['user', 'tasks']);

        return res.send({ project });
    } catch (err) {
        res.status(400).send({ error: 'Error loading project' });
    }
});

//Criar projeto

router.post('/', async (req, res) => {
    try {
        const { title, description, tasks } = req.body;

        const project = await Project.create({ title, description, user: req.userId });

        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({ ...task, project: project._id });

            await projectTask.save();

            project.tasks.push(projectTask);
        }));

        await project.save();

        return res.send({ project });
    } catch (err) {
        res.status(400).send({ error: 'Error creating new project' });
    }
});

//Alterar projeto

router.put('/:projectId', async (req, res) => {
    try {
        const { title, description, tasks } = req.body;

        const project = await Project.findByIdAndUpdate(req.params.projectId, {
            title,
            description,
        }, { new: true });

        project.tasks = [];
        await Task.remove({ project: project._id });

        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({ ...task, project: project._id });

            await projectTask.save();

            project.tasks.push(projectTask);
        }));

        await project.save();

        return res.send({ project });
    } catch (err) {
        res.status(400).send({ error: 'Error updating project' });
    }
});

//Deletar projeto

router.delete('/:projectId', async (req, res) => {
    try {
        await Project.findByIdAndRemove(req.params.projectId).populate('user');

        return res.send();
    } catch (err) {
        res.status(400).send({ error: 'Error deleting project' });
    }
});
module.exports = app => app.use('/projects', router);
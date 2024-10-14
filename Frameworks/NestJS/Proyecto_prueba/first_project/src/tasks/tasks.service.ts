import { Injectable } from '@nestjs/common';
import { Task } from "./interfaces/tasks";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { createTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {

    constructor(@InjectModel('task') private taskModel: Model<Task>){}

    async getTasks(){
        return await this.taskModel.find();
    }

    async getTask(id: string){
        return await this.taskModel.findById(id);
    }

    async createTask(task: createTaskDto){
        const newTask = new this.taskModel(task);
        return await newTask.save();
    }
    /* tasks: Task[] = [
        //simulacion localmente con arreglo, pero deberia provenir de bd
        {
            id: 1,
            title: "Testing1",
            description: "testing description",
            done: true
        },
        {
            id: 2,
            title: "Testing2",
            description: "testing description",
            done: true
        },
        {
            id: 3,
            title: "Testing3",
            description: "testing description",
            done: true
        }

    ];
    //Métodos de servicio
    getTasks(): Task[] {
        return this.tasks;
    }

    getTask(id: number): Task {
        return this.tasks.find(task => task.id === id);
    } */


}
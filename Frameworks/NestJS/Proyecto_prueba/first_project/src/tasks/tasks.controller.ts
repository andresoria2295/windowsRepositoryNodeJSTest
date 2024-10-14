import { Controller, Get, Post, Put, Delete, Body, Param, Req, Res} from '@nestjs/common';

import {createTaskDto} from "./dto/create-task.dto";
import { Request, Response } from "express";
import { TasksService } from "./tasks.service";
import { Task } from "./interfaces/tasks";
import { promises } from 'readline';

@Controller('tasks')
export class TasksController {

    constructor(private taskService: TasksService){}

    /* @Get()
    getTasks(): Task[] {
        return this.taskService.getTasks();
        //return "creando tasks";
    } */

    @Get()
    getTasks(): Promise<Task[]>{
        return this.taskService.getTasks();
        //return "creando tasks";
    }

    /* @Get(':taskId')
    getTask(@Param('taskId') taskId: string)  {
        return this.taskService.getTask(parseInt(taskId));
        //return "creando tasks";
    } */

    @Get(':taskId')
    getTask(@Param('taskId') taskId: string)  {
        return this.taskService.getTask(taskId);
        //return "creando tasks";
    }

    @Get('/test')
    getTest(){
        return "creando test dentro de tasks";
    }

    /* @Get()
    getTasks(): {hello: string}{
        return {"hello": "saludo"};
    } */

    //formato con express
    /* @Get()
    getTasks(@Req() req, @Res() res): Response{
        return res.send('Hello World')
    } */
   
    /* @Post()
    posTasks(@Body() mensaje):string{
        console.log(mensaje);
        return "metodo POST funcionando";
    } */

    /* @Post()
    posTasks(@Body() mensaje: createTaskDto):string{
        console.log(mensaje.title, mensaje.description, mensaje.done);
        return "metodo POST funcionando"; */

    @Post()
    createTask(@Body() task: createTaskDto):Promise<task>{
        return this.taskService.createTask(task);
    }
    @Put(':id')
    updateTasks(@Body() task: createTaskDto, @Param('id') taskID):string{
        console.log(task)
        console.log(taskID)
        return "metodo Put funcionando y actualiza";
    }

    @Delete(':id')
    deleteTasks(@Param('id') taskID):string{
        console.log(taskID)
        return `metodo Delete funcionando. Eliminando task N°:${taskID}`;
    }
}

import { Document } from "mongoose";

export interface Task extends Document{
    id?: number;
    title: string;
    description: string;
    done: boolean;
}


//Esto es para manejo de codigo interno
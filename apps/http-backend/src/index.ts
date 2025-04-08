import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from './middleware';
import {CreateRoomSchema, CreateUserSchema, SignInSchema} from '@repo/common/types';
import {primsaClient} from '@repo/db/client';

const app = express();

app.post("/signup", async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ error: parsedData.error });
        return
    }
    try{
        await primsaClient.user.create({
            data:{
                email:parsedData.data?.username,
                name:parsedData.data.name,
                password:parsedData.data.password,
            }
        })
        res.json({ message: "User created" });
    }catch(e){
        console.log(e)
        res.status(411).json({ error: "User already exists" });
        return
    }
})

app.post("/signin", async (req, res) => {
    const data = SignInSchema.safeParse(req.body);
    if (!data.success) {
        res.status(400).json({ error: data.error });
        return
    }

    const user = await primsaClient.user.findFirst({
        where:{
            email:data.data.username,
            password:data.data.password,
        }
    })
    if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return
    }

    const token = jwt.sign({ userId:user.id }, JWT_SECRET);
    res.json({ token });
})

app.post("/room", middleware,async (req, res) => {
 
    const data = CreateRoomSchema.safeParse(req.body);
    if (!data.success) {
        res.status(400).json({ error: data.error });
        return
    }

    // @ts-ignore
    const userId = req.userId;
    const room = await primsaClient.room.create({
        data:{
            slug:data.data.name,
            adminId:userId,
        }
    })

    res.json({ roomId: room.id });
})

app.listen(3001)
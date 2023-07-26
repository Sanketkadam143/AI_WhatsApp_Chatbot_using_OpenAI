import express from 'express';
import {createEmbeddings,queryEmbeddings} from '../controllers/webBot.js';
import upload from '../middleware/multer.js';
// import auth from '../middleware/auth.js';

const  router=express.Router();

router.post('/train-gpt',upload.single("file"),createEmbeddings);
router.post('/query-train-gpt',queryEmbeddings);

export default router;
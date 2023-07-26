import express from 'express';
import {createEmbeddings,queryEmbeddings} from '../controllers/webBot.js';
import upload from '../middleware/multer.js';
// import auth from '../middleware/auth.js';

const  router=express.Router();

router.post('/',upload.single("file"),createEmbeddings);
router.get('/',queryEmbeddings);

export default router;
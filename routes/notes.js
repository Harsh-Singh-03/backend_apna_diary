const express = require('express')
const Notes = require('../models/Notes')
const fetchUser = require('../middleware/fetchUser')
const { body, validationResult } = require('express-validator');
const nodemon = require('nodemon');
const router = express.Router()
// get all the notes of logged in user
router.get('/fetchallnotes',fetchUser, async (req,res)=>{
    try {
        // search by user id which define in notes schema or fetchuser function and fetching that id wise notes
        const notes = await Notes.find({user: req.user.id})
        console.log(notes)
        res.json(notes)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("some error occured")
    }

})
// push all notes from loged in user
router.post('/addnotes',fetchUser,[
    // define validation for titl and description
    body('title', 'Enter valid title').isLength({ min: 5 }),
    body('description', "Enter a something more in description").isLength({ min: 8 })
], async (req,res)=>{
    // if not valid showing error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        // getting title des and tag from req body and save it to database and also send it to a response json
        const {title, description, tag} =req.body;
        const note = new Notes({
            title,description,tag, user: req.user.id
        })
        const savedNote = await note.save(); 
        res.json(savedNote)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("some error occured")
    }
})
//  upating a existing notes  for the logged in user

router.put('/updatenotes/:id',fetchUser,[
    // define validation for titl and description
    body('title', 'Enter valid title').isLength({ min: 5 }),
    body('description', "Enter a something more in description").isLength({ min: 8 })
], async (req,res)=>{
    // if not valid throw error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        // here we start updated but first we check user can update only his notes and also update specific that he wants
        const {title, description, tag} =req.body;
        //  create new note
        const newNote = {};
        if(title){newNote.title = title}
        if(description){newNote.description = description}
        if(tag){newNote.tag = tag}
        // find the node to be updated and update it
        let note = await Notes.findById(req.params.id)
        if(!note){
           return res.status(404).send({error: "not found"})
        }
        // this i cant understood the logic for user verification
        if(note.user.toString() !== req.user.id){
           return res.status(401).send({error: "not allowed"})
        }
        note = await Notes.findByIdAndUpdate(req.params.id, {$set:newNote}, {new:true})
        res.json({note})

    }catch (error) {
        console.error(error.message);
        res.status(500).send("some error occured")
    }
})

// endpoint for deletion of note using delete
router.delete('/deletenotes/:id',fetchUser, async (req,res)=>{
    try {
        // here we start deleting but first we check user can delete only his notes
        // find the note to be deleted and delete it
        let note = await Notes.findById(req.params.id)
        if(!note){
           return res.status(404).send({error: "not found"})
        }
        // this i cant understood the logic for user verification
        if(note.user.toString() !== req.user.id){
           return res.status(401).send({error: "not allowed"})
        }
        note = await Notes.findByIdAndDelete(req.params.id)
        res.json({"success": "your note has been deleted ", note: note})

    }catch (error) {
        console.error(error.message);
        res.status(500).send("some error occured")
    }
})
module.exports = router
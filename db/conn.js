const mongoose=require('mongoose');

const DB='mongodb+srv://jhadeepali2610:deepa2610@cluster0.pfnfdgm.mongodb.net/cloud_project?retryWrites=true&w=majority';

mongoose.connect(DB).then(()=>{console.log(`connection successful`);}).catch((err)=>console.log(`no connection`));
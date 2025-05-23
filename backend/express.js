const express = require('express');
const bodyParser=require('body-parser')
const faceapi=require("@vladmandic/face-api")
const canvas=require("fs")
const {MongoClient}=require('mongodb')
const fs = require('fs');
const {Canvas,Image,ImageData}=canvas;
faceapi.env.monkeyPatch({Canvas,Image,ImageData})
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
const mongoUri = "mongodb://localhost:27017";
const dbName="attendance";
const collectionName="classseven";

const MODEL_URL='./models'

async function loadModels(){
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
}

app.post('/upload', async (req, res) => {

  

  try {





    
const {image}=req.body;

  const base64Image = image.replace(/^data:image\/png;base64,/, '');

fs.writeFileSync('selfie.png',base64Data,"base64");

const img=await canvas.loadImage("selfie.png")

const detections=await faceapi.detectAllFaces(img)
const outDir="./faces";
if(!fs.existsSync(outDir)) fs.mkdir(outDir)


  const faceCanvas=canvas.createCanvas();
  const ctx=faceCanvas.getContext("2d");


  detections.forEach((det,i)=>{
    const {x,y,width,height}=det.box
    faceCanvas.width=width;
    faceCanvas.height=height
    ctx.clearRect(0,0,width,height);
    ctx.drawImage(img,x,y,width,height,0,0,width,height);
    const out=fs.createWriteStream(`${outDir}/face_${i+1}.png`)
    const stream=faceCanvas.createPNGStream()
    stream.pipe(out)
  })
res.send(`Detected and saved ${detections.length} face(s)`);

} catch (err) {
    console.error(err);
    res.status(500).send('Failed to process image');
  }
  const client = await MongoClient.connect(mongoUri);
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    
  await collection.insertOne({
      Image, // base64 image string
      timestamp: new Date(),
    });

    client.close();
});
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

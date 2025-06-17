const express = require('express');
const ExcelJS = require('exceljs');
const bodyParser=require('body-parser')
const faceapi=require("@vladmandic/face-api")
const canvas=require("canvas")
require('dotenv').config();
const fs = require('fs');
const {Canvas,Image,ImageData,loadImage,createCanvas}=canvas;
faceapi.env.monkeyPatch({Canvas,Image,ImageData})
const path = require('path');
const cors = require('cors');
const app = express();

const corsOptions = {
  origin: ' https://aietsharath.github.io',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));



const { MongoClient, ServerApiVersion } = require('mongodb');
const { loadGraphModelSync } = require('@tensorflow/tfjs');

const url=process.env.URI;
console.log(url);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function loadModels() {
  const modelPath = path.join(__dirname, 'models'); 
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);        
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);     
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);      
  await faceapi.nets.tinyYolov2.loadFromDisk(modelPath);  
}

loadModels().then(() => {
  console.log('Face-api models loaded');
});



// app.post('/upload', async (req, res) => {
//   const { image ,standard} = req.body;
//   console.log(req.body);
  

//   const base64Image = image.replace(/^data:image\/png;base64,/, '');
//    fs.writeFileSync('selfie.png', base64Image, "base64");

//   const img = await loadImage("selfie.png");
//   const detections = await faceapi.detectAllFaces(img,new faceapi.TinyFaceDetectorOptions({inputSize:512,scoreThreshold:0.5}))
//   .withFaceLandmarks().withFaceDescriptors();
//   console.log(detections,"detection");
  
//   const outDir = "./faces";
//   if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

//   if (detections.length === 0) {
//     return res.status(400).send('No faces detected');
//   }

//   await client.connect();
//   const db = client.db("Kempu");
//   const collection = db.collection("classfirst");

// const knownFaces=await collection.find({},{projection:{descriptor:1}}).toArray();



//   const savedFaces = [];
// const threshold=0.6;

// for(const detection of detections)  {
//  const descriptor=Array.from(detection.descriptor); 


//   // for (let i = 0; i < detections.length; i++) {
//   //   const { sx, y, width, height } = detections[i].box;

//     // ✅ Create a fresh canvas per face
//     let isRecognized=false;
//     for(const known of knownFaces){
//       if(!known.descriptor|| !Array.isArray(known.descriptor)) continue;
//     const distance =faceapi.euclideanDistance(descriptor,known.descriptor);
//     if(distance<threshold){
//       isRecognized=true;
//       break;
//     }
//   }
//      if (isRecognized) {
//       console.log('Face already recognized. Access granted.');
//       continue; // Skip storing duplicate
//     }
//        const { x, y, width, height } = detection.detection.box;
//     const faceCanvas = createCanvas(width, height);
//     const ctx = faceCanvas.getContext("2d");

//     // ✅ Draw cropped face onto canvas
//     ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

//     let index=0;
//     // ✅ Save to local file
//     for (const detection of detections){
//       index++;
//     const out = fs.createWriteStream(`${outDir}/face_${index}.png`);
//     const stream = faceCanvas.createPNGStream();
//     stream.pipe(out);
//     }
//     // ✅ Convert to buffer and insert into MongoDB
//     const buffer = faceCanvas.toBuffer('image/png');
//     const now = new Date();
// const dateStr = now.toISOString().split("T")[0];
// const timeStr = now.toTimeString().split(" ")[0];

// const faceDoc = {
//   image: buffer,
//   timestamp: now,
//   descriptor: descriptor,
//   standard,
//   attendance: [
//     {
//       date: dateStr,
//       time: timeStr
//     }
//   ]
// };

//     await collection.insertOne(faceDoc);
//     savedFaces.push(faceDoc);
//   }

//   await client.close();
//     if (savedFaces.length === 0) {
//     return res.send("Face already recognized. No new entries saved.");
//   }

//   res.send(`Detected and saved ${savedFaces.length} face(s) to MongoDB`);
// });
// app.put("/update-attendance",async (req,res)=>{
//   const {descriptor}=req.body;
//   if (!descriptor||!Array.isArray(descriptor)) {
//     return res.status(400).json({eroor:"Descriptor is required and must be an array"})
//   }
//   const now=new Date();
//   const dateStr=now.toISOString().split("T")[0];
//   const timeStr=now.toTimeString().split("")[0]



//   try{
//     await client.connect();
//     const db=client.db("kempu")
//     const collection=db.collection("classfirst")


//     const result=await collection.updateOne({
//       descriptor:descriptor,
//       "attendance.dat4":{$ne:dateStr}
//     },{
//       $push:{
//         attendance:{
//           date:dateStr,
//           time:timeStr
//         }
//       }
//     });
//     if(result.matchedCount===0){
//       return res.status(404).json({message:"No Matching face fond or attendnce already marked for today"})
//     }
//     res.status(200).json({message:"Attendance updated successfully"})
//   }catch(error){
//     console.error("Error updating attendance:", error);
//     res.status(500).json({error:"Internal Server Error"})
    
//   }finally{
//     await client.close()
//   }
//   })



app.post('/upload', async (req, res) => {
  const { image, standard } = req.body;

  const base64Image = image.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('selfie.png', base64Image, "base64");

  const img = await loadImage("selfie.png");
  const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 }))
    .withFaceLandmarks().withFaceDescriptors();

  if (detections.length === 0) {
    return res.status(400).send('No faces detected');
  }

  await client.connect();
  const db = client.db("Kempu");
  const collection = db.collection("classfirst");
  const knownFaces = await collection.find({}, { projection: { descriptor: 1 } }).toArray();

  const outDir = "./faces";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const threshold = 0.6;
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0];

  const savedFaces = [];
  let attendanceMarked = false;

  for (const detection of detections) {
    const descriptor = Array.from(detection.descriptor);
    let matchedFace = null;

    for (const known of knownFaces) {
      if (!known.descriptor || !Array.isArray(known.descriptor)) continue;
      const distance = faceapi.euclideanDistance(descriptor, known.descriptor);
      if (distance < threshold) {
        matchedFace = known;
        break;
      }
    }

    if (matchedFace) {
      // Existing face → Update attendance
      const updateResult = await collection.updateOne(
        {
          descriptor: matchedFace.descriptor,
          "attendance.date": { $ne: dateStr }
        },
        {
          $push: {
            attendance: {
              date: dateStr,
              time: timeStr
            }
          }
        }
      );

      if (updateResult.modifiedCount > 0) {
        attendanceMarked = true;
        console.log('Attendance updated for recognized face.');
      } else {
        console.log('Attendance already marked today for this face.');
      }

      continue; // Skip adding duplicate face
    }

    // New face → Save face with attendance
    const { x, y, width, height } = detection.detection.box;
    const faceCanvas = createCanvas(width, height);
    const ctx = faceCanvas.getContext("2d");
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

    const buffer = faceCanvas.toBuffer('image/png');
    const faceDoc = {
      image: buffer,
      timestamp: now,
      descriptor: descriptor,
      standard,
      attendance: [
        {
          date: dateStr,
          time: timeStr
        }
      ]
    };

    await collection.insertOne(faceDoc);
    savedFaces.push(faceDoc);
  }

  await client.close();

  if (savedFaces.length === 0 && !attendanceMarked) {
    return res.send("Face already recognized and today's attendance already marked.");
  } else if (savedFaces.length === 0 && attendanceMarked) {
    return res.send("Face recognized. Attendance marked for today.");
  } else {
    return res.send(`Saved ${savedFaces.length} new face(s) and attendance.`);
  }
});


const getAttendanceDataByClassId = async (classId) => {

try{  await client.connect();
  const db=client.db("Kempu")
  const collection=db.collection("classfirst")
  const query = { standard: classId };

    const data = await collection.find(query).toArray();

    // Format the data if needed
    return data.map(doc => ({
      image: doc.image,
      timestamp: doc.timestamp,
      descriptor: doc.descriptor,
      standard: doc.standard,
      attendance: (doc.attendance || []).map(a => ({
        time: a.time,
        date: a.date
      }))
    }));
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    return [];
  } finally {
    await client.close();
  } 
}


app.get("/download/:classId",async (req,res)=>{
  const classId=req.params.classId;
  const attendanceData=await getAttendanceDataByClassId(classId)
  const workbook=new ExcelJS.Workbook()
  const worksheet=workbook.addWorksheet("Attendance")
   worksheet.columns = [
      { header: 'Student Image', key: 'image', width: 30 },
      { header: 'Timestamp', key: 'timestamp', width: 25 },
      { header: 'Standard', key: 'standard', width: 10 },
      { header: 'Descriptor', key: 'descriptor', width: 50 },
      { header: 'Attendance Time', key: 'time', width: 15 },
      { header: 'Attendance Date', key: 'date', width: 15 },
    ];
  worksheet.addRows(attendanceData)
    res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=attendance-class-${classId}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
})
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
}); 

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import Fs from 'fs'
import csv from 'csv-parser';


const app = express();


// let inputStream = Fs.createReadStream('my_data.csv', 'utf8');


//file upload handle
const csvFilter = function(req, file, cb) {
  if (!file.originalname.match(/\.(csv)$/)) {
    return cb(new Error('Please upload a CSV file.'));
  }
  cb(null, true);
};

const upload = multer({ 
  dest: 'uploads/', 
  fileFilter: csvFilter
});


app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

let errors = []
const data = [];

// Create a stream to read the CSV file
app.post("/add", upload.single('csvFile'), (req, res) => {
    console.log(errors)
    if (!req.file) {
        return res.status(400).send('Please upload a CSV file.');
    }else{
        const csvFilePath = req.file.path;
        
        const results = [];
        console.log(csvFilePath)
        let inputStream = Fs.createReadStream(csvFilePath, 'utf8');
        inputStream
        .pipe(csv()/*new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true })*/)
        .on('data', (row) => {
            
        const missingFields = [];
        for (const key in row) {
          if (row.hasOwnProperty(key) && (!row[key] || row[key] === '-')) {
            missingFields.push(key);
          }
        }
        if (missingFields.length > 0) {
        //   console.log(`Missing fields "${missingFields.join(', ')}" in row ${row['No.']}`);
          errors.push({error: `Missing fields "${missingFields.join(', ')}" in row ${row['No.']}`})
        }else {
            const obj = {};
            for (const [key, value] of Object.entries(row)) {
              obj[key] = value;
            }
            // Push the object to the data array
            data.push(obj);
        }
        
         // Create a new object for the row, with header fields as keys
        // jrr.push(row)
        // results.push(row);
	    // console.log('A row arrived: ', row);
	})
	.on('end', () => {
        if(errors.length > 0) {
            Fs.unlink(csvFilePath, (err => {
                if (err) console.log(err);
                else {
                  console.log(`\nDeleted file: ${csvFilePath}`);
                
                  // Get the files in current directory
                  // after deletion
                //   getFilesInDirectory();
            }
        }
        ));
        let jrr = errors;
        errors = []
        res.send(jrr)
        }else if(data.length == 0){
          res.send({error: "Empty CSV file uploaded"})
        }else {
          console.log(data);
          res.send(data)

        }

	    // console.log('No more rows!');
        // let abc = [];
        // // console.log(results)
        // console.log(results[0])
        // for(var i = 1 ;i< results.length;i++){
        //     abc.push({'No':results[i][0], 'Name': results[i][1], 'PAN': results[i][2], 'Address': results[i][3], 'Landmark': results[i][4], 'City': results[i][5], 'State': results[i][6], 'Country': results[i][7], 'Primary_Phone': results[i][8], 'Secondary_Phone': results[i][9], 'Primary_Email': results[i][10]})
        // }

        // for(var i = 0 ;i< abc.length;i++){
        //     if(abc[i].No === ('-' || ' ') ){

        //     }
        // }
        // res.send(data)
	});
}
})

app.listen(8080);

mongoose.connect('mongodb+srv://admin:admin@cluster0.2uwunxf.mongodb.net/?retryWrites=true&w=majority', {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }).then(() => {
    console.log(`Server is running on port 8080`)
  })
  .catch((error) => {
    console.error({ message: error.message });
  });

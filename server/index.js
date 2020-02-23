const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors()); // so that app can access

const path = './server/bookings.json';
let bookings = JSON.parse(fs.readFileSync('./server/bookings.json'))
  .map((bookingRecord) => ({
    time: Date.parse(bookingRecord.time),
    duration: bookingRecord.duration * 60 * 1000, // mins into ms
    userId: bookingRecord.user_id,
  }))

app.get('/bookings', (_, res) => {
  res.json(bookings);
});

app.use(function(_, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(require("body-parser").json());

app.post('/bookings', (req, res) => {
  fs.readFile(path, 'utf8', function (err, data) {
    if(err){
      console.log(err)
      res.sendStatus(err)
    }
    else {
      let newBookings = req.body
      let oldBookings = JSON.parse(data)
      let hasOverlaps = false;

      function sortFunction(a, b) {
        let x = a.time; let y = b.time;
        if (x < y)
        {
          return -1
        }
        if (x > y)
        {
          return 1
        }
        else
        {
          return (a.duration < b.duration) ? -1 : ((a.duration > b.duration) ? 1 : 0)
        }
      }

      newBookings.sort(sortFunction);

      // check that the new bookings are all valid, in case a post
      // request is made that bypassed the checks in App.js
      let allowedBookings = newBookings.filter( function(newBooking, index) { 
        let startTimeA = Date.parse(newBooking.time)
        let endTimeA = startTimeA + newBooking.duration * 60 * 1000

        if(index > 0)
        {
          let startPrev = Date.parse(newBookings[lastAllowedInx].time)
          let endPrior = startPrev + newBookings[lastAllowedInx].duration * 60 * 1000

          if(endPrior > startTimeA)
          {
            // overlap within two entries in the csv file
            hasOverlaps = true
          }
        }

        for(let oldInx in oldBookings)
        {
          let startTimeB = Date.parse(oldBookings[oldInx].time)
          let endTimeB = startTimeB + oldBookings[oldInx].duration * 60 * 1000

          if(Math.min(endTimeA, endTimeB) - Math.max(startTimeA, startTimeB) > 0)
          {
            // bookings overlap
            hasOverlaps = true
            break
          }
        }
        
        lastAllowedInx = index
        return true
      })
      if(!hasOverlaps)
      {
        // No overlaps were found, add the bookings and write to file
        let nextBookings = oldBookings.concat(allowedBookings)
        nextBookings.sort(sortFunction);
        fs.writeFile(path, JSON.stringify(nextBookings), (error) => {
          if(error != null) 
          {
            console.log(error)
          }
        })
        bookings = nextBookings.map((bookingRecord) => ({
          time: Date.parse(bookingRecord.time),
          duration: bookingRecord.duration * 60 * 1000,
          userId: bookingRecord.user_id,
        }))
        res.sendStatus(200)
      }
      else{
        // Send an error back to client
        res.sendStatus(409)
      }
    }
  })
  
});

app.listen(3001);

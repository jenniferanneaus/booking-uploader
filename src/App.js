import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import Papa from 'papaparse';
import './App.css';

const apiUrl = 'http://localhost:3001'

class App extends Component {

  constructor()
  {
    super()
    this.state = {bookings:[], addedBookings:[], failedBookings:[]}
    this.onDrop = this.onDrop.bind(this)
  }
  //state = {}

  componentWillMount() {
    fetch(`${apiUrl}/bookings`)
      .then((response) => response.json())
      .then((bookings) => {
        this.setState({ bookings })
      })
  }

  onDrop(files) {
    const addBookings = _addBookings.bind(this)

    Papa.parse(files[0], {
      complete: function(results) {
        // trim whitespace from data
        let bookingsData = results.data.map( function(row) {
          return row.map( function(element) {
            return element.trim();
          })
        });
        // remove empty items
        bookingsData = bookingsData.filter( function(el) { return el[0] !== ""; })

        let timeInd = bookingsData[0].indexOf("time");
        let durationInd = bookingsData[0].indexOf("duration");
        let userInd = bookingsData[0].indexOf("userId");

        if (timeInd === -1 || durationInd === -1 || userInd === -1)
        {
          // this data didn't have a header row with time, duration, userId.
          // assume 'standard' order of time, duration, userId
          timeInd = 0;
          durationInd = 1;
          userInd = 2;
        }
        else
        {
          // remove the header row
          bookingsData.shift();
        }

        // map bookings
        let bookings = bookingsData.map((bookingRecord) => ({
          time: bookingRecord[timeInd], 
          duration: Number(bookingRecord[durationInd]), 
          user_id: bookingRecord[userInd],
        }))

        addBookings(bookings)
      }
    })
        
    function _addBookings(newBookings)
    {
      let oldBookings = this.state.bookings;
      let allowedBookings;

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

      newBookings.sort(sortFunction)

      // filter the data (remove overlapping entries) before sending to the server,
      // in order to minimise the amount of data sent.
      let lastAllowedInx = 0;
      allowedBookings = newBookings.filter( function(newBooking, index) { 
        let startTimeA = Date.parse(newBooking.time)
        let endTimeA = startTimeA + newBooking.duration * 60 * 1000

        if(index > 0)
        {
          let startPrev = Date.parse(newBookings[lastAllowedInx].time)
          let endPrior = startPrev + newBookings[lastAllowedInx].duration * 60 * 1000

          if(endPrior > startTimeA)
          {
            // overlap within two entries in the csv file
            newBooking.status = "fail";
            return false
          }
        }

        for(let oldInx in oldBookings)
        {
          let startTimeB = oldBookings[oldInx].time
          let endTimeB = startTimeB + oldBookings[oldInx].duration

          if(Math.min(endTimeA, endTimeB) - Math.max(startTimeA, startTimeB) > 0)
          {
            // bookings overlap
            newBooking.status = "fail";
            return false
          }
        }

        newBooking.status = "success";
        
        lastAllowedInx = index
        return true
      })

      fetch(`${apiUrl}/bookings`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(allowedBookings),
      }).then(response => {
        if(response.status === 200)
        {
          this.setState(
            { addedBookings: newBookings }
            )
            
          console.log('state', this.state)
        }
        else
        {
          this.setState(
            { failedBookings : [1] }
          )
        }
      })
    }
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <Dropzone
            accept=".csv"
            onDrop={this.onDrop}
          >
            Drag files here
          </Dropzone>
        </div>
        <div className="App-main">

          <p style={{display: this.state.failedBookings.length===0 && "none"}} className="App-error-text">An error occurred when trying to add new bookings. Please try again.</p>

          <p className="App-add-booking-title" style={{display: this.state.addedBookings.length===0 && "none"}}>Attempted to add the following bookings. Entries in blue were successfully added, entries in red overlap with existing bookings so could not be added.</p>
          <div className="App-booking-container" style={{display: this.state.addedBookings.length===0 && "none"}}>
            {
              (this.state.addedBookings || []).map((booking, i) => {
              const date = new Date(booking.time);
              const endTime = Date.parse(booking.time) + booking.duration * 60 * 1000;
              const width = booking.duration * 1.25;
              console.log('endTime: ', endTime, ' type: ', typeof endTime)
              const endDate = new Date(endTime)
              const format = {hour: 'numeric', minute: '2-digit'}
              let prevDate;
              let isSameDate = false;
              if(i===0 && this.state.addedBookings.length > 0)
              {
                prevDate = new Date(0);
              }
              else
              {
                prevDate = new Date(this.state.addedBookings[i-1].time)
              }
              if(prevDate.toLocaleDateString() === date.toLocaleDateString())
              {
                isSameDate = true;
              }
              return (
                <div key={i} className="App-booking-date">
                  <h3 className="App-booking-date-title" style={{display: isSameDate && "none"}}>{date.toDateString()}</h3>
                  <div className={booking.status === "success" ? "App-booking" : "App-booking App-booking-error"} style={{width: width}}>
                    <p className="App-booking-time">{date.toLocaleString('en-AU', format) + ' - ' + endDate.toLocaleString('en-AU', format)}</p>
                    <p className="App-booking-user">{'User: ' + booking.user_id}</p>
                  </div>
                </div>
              )
            })
          }
          </div>

          <h2>Existing Bookings:</h2>
            <div className="App-booking-container">
            {
              (this.state.bookings || []).map((booking, i) => {
                const date = new Date(booking.time);
                const width = booking.duration / (60 * 1000) * 1.25;
                const endDate = new Date(booking.time + booking.duration);
                const format = {hour: 'numeric', minute: '2-digit'};
                let prevDate;
                let isSameDate = false;
                if(i===0)
                {
                  prevDate = new Date(0);
                }
                else
                {
                  prevDate = new Date(this.state.bookings[i-1].time);
                }
                if(prevDate.toLocaleDateString() === date.toLocaleDateString())
                {
                  isSameDate = true;
                }
                return (
                  <div key={i} className="App-booking-date">
                    <h3 className="App-booking-date-title" style={{display: isSameDate && "none"}}>{date.toDateString()}</h3>
                    <div className="App-booking" style={{width: width}}>
                      <p className="App-booking-time">{date.toLocaleString('en-AU', format) + ' - ' + endDate.toLocaleString('en-AU', format)}</p>
                      <p className="App-booking-user">{'User: ' + booking.userId}</p>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    );
  }
}

export default App;

# Booking Uploader

A web app for uploading bookings from `.csv` files. 

## Existing code

### Overview

Existing functionality:
- ExpressJS server with `GET` endpoint `/bookings` which responds with existing bookings (from a hard-coded json file that is read in). Bookings have a time, duration, and user ID. 
- ReactJS app which fetches and shows existing bookings in a list and has a file input for bookings files (`.csv` only). 
- A `.csv` file with entries corresponding to bookings that is to be uploaded but which contains bookings that overlap with some of the existing bookings. 

### Instructions for use

- To install dependencies: `yarn install`
- To run ExpressJS server: `yarn run server`
- To run ReactJS app: `yarn start`

Note: This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

## Assumptions

Assumes that the given `.csv` file contains valid entries, and that it either:

+ Has first line with entries `time`, `duration` and `userId` in any order, indicating the order in which the properties appear in each entry, or
+ Has each entry in the order `time`, `duration`, `userId`.

Assumes that the existing entries are in chronological order. When adding new entries, the code ensures they are placed in chronological order.
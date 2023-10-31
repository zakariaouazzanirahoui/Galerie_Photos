const axios = require('axios');

const flaskApiUrl = 'http://127.0.0.1:5000';

const getFlaskData = (req, res) => {

    axios.get(`${flaskApiUrl}/`)
        .then((response) => {
            // Send the response from Flask to the client
            res.send(response.data);
        })
        .catch((error) => {
            console.error('GET Request Error:', error);
            res.status(500).send('Internal Server Error');
        });

}


// Making a POST request to your Flask API with data
const postData = {
    key1: 'value1',
    key2: 'value2',
};

axios.post(`${flaskApiUrl}/endpoint2`, postData)
    .then((response) => {
        console.log('POST Request Response:', response.data);
    })
    .catch((error) => {
        console.error('POST Request Error:', error);
    });

module.exports = {
    getFlaskData,
};
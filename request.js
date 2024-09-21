const requestData = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: "dominicditanna1@gmail.com",
        password: "nineteen47",
        grant_type: "password"
    })
};

fetch('https://brickell-watch-new.herokuapp.com/oauth/token', requestData)
    .then(response => response.json()) // Parses the response as JSON
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Error:', error));

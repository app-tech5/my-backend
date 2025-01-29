const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://cabliveer:WjRuzCqNOkQXPs33@cluster0.9feaq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connecté'))
  .catch(err => console.error(err));

module.exports = mongoose;

const mongoose = require("mongoose");
const conn = mongoose.createConnection("mongodb://localhost/hotel");
 
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    rTime: {
        type: Number,
        default: Date.now()
    }
})


const HotelSchema = new mongoose.Schema({
    hotel_name: {
        type: String,
        required: true
    },
    street: {
        type: String,
        required: true
    },

    city: {
        type: String,
        required: true
    },  

    postal_code: {
        type: String,
        required: true
    },

    price: {
        type: String,
        required: true
    }, 
    
    email: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    }, 
    image: {
        type: String,
        required: true
    }, 

    cTime: {
        type: Number,
        default: Date.now()
    }
})

const BookSchema = new mongoose.Schema({
    hotel_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    booking_start: {
        type: String,
        default: Date.now()
    },
    booking_end: {
        type: String,
        default: Date.now()
    },
    booking_date: {
        type: Number,
        default: Date.now()
    }
})

 
const User = conn.model("User", UserSchema);

const Hotel = conn.model("Hotel", HotelSchema);

const Book = conn.model("Book", BookSchema);
 
const model = { User, Hotel, Book};

module.exports = function (modelName) {
    return model[modelName];
}

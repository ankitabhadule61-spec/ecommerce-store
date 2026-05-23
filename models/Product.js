const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    imageUrl: {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    category: {
        type: String,
        required: [true, 'Please specify a category']
    },
    countInStock: {
        type: Number,
        required: [true, 'Stock count is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
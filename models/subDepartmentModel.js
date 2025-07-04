const mongoose = require('mongoose');

const SubDepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a sub department name'],
        unique: true,
    },
    subDepartmentId: {
        type: String,
        required: true,
        unique: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('SubDepartment', SubDepartmentSchema);

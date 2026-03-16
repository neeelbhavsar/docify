import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    resetPasswordToken: string;
    resetPasswordExpires: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getResetPasswordToken(): string;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Generate reset password token
userSchema.methods.getResetPasswordToken = function (): string {
    const crypto = require('crypto');
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire field to 15 minutes
    this.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    return resetToken;
};

// Remove password from JSON output
userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete (ret as unknown as Record<string, unknown>).password;
        delete (ret as unknown as Record<string, unknown>).resetPasswordToken;
        delete (ret as unknown as Record<string, unknown>).resetPasswordExpires;
        return ret;
    },
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;

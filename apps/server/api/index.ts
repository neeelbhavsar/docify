import app from '../src/app';
import connectDB from '../src/config/database';

// Connect to the database before handling requests
connectDB();

export default app;

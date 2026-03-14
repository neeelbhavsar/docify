import 'dotenv/config';
import app from './app';
import connectDB from './config/database';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`
🚀 DevVault API Server
   ━━━━━━━━━━━━━━━━━━
   Port     : ${PORT}
   Env      : ${process.env.NODE_ENV || 'development'}
   Health   : http://localhost:${PORT}/health
    `);
    });
};

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

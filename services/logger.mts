import winston from "winston";
import 'winston-daily-rotate-file';

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(info => {
                    return `[${info.timestamp}] ${info.level}: ${info.message}`;
                })
            ),
        }),
        new winston.transports.DailyRotateFile({
            level: 'info',
            filename: 'instances/logs/app-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxFiles: '30d',
            maxSize: '20m',
        }),
    ],
});

export default logger;

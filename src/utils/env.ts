import dotenv from 'dotenv';

dotenv.config();

type EnvironmentSchema = {
  LOG_LEVEL: string;
};

const environments: EnvironmentSchema = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};

export default environments;

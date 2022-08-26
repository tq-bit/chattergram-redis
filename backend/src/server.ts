import app from './app/app';
import AppSocketServer from './app/base/Socket';
import * as mongooseConfig from './app/config/mongoose.config';
import * as redisProvider from './app/redis/redis.provider';
import * as redisSync from './app/redis/redis.sync';

const host: string = process.env.BACKEND_HOST || '0.0.0.0';
const appPort: string = process.env.BACKEND_PORT || '8080';
const socketPort: string = process.env.SOCKET_PORT || '9090';

const main = async () => {
  try {
    new AppSocketServer(+socketPort).listen();

    await mongooseConfig.connect();
    await redisProvider.createRedisIndexes();
    await redisSync.performFullSynchronization();

    await app.listen(+appPort, host);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

main();

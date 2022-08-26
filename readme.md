# Chattergram + Redis

A chat application that transcribes voice messages to text - powered by the [Redis Stack](https://redis.io/docs/stack/)

Chattergram runs on two separate applications - a frontend and a backend. You need to create an account to access the chat. All of your data will be stored on a local Redis (& MongoDB) instance.

![](https://raw.githubusercontent.com/tq-bit/chattergram-redis/master/assets/chattergram_signup.gif)

Once signed up, you can start chatting with other users. If you decide to send them a voice message, Deepgram will try and transcribe the message for you and your sender. You can still listen to the recorded message if you like.

![](https://raw.githubusercontent.com/tq-bit/chattergram-redis/master/assets/chattergram_transcribe.gif)

I've created Chattergram-Redis as a POC project for the [Redis Hackathon on dev.to](https://dev.to/devteam/announcing-the-redis-hackathon-on-dev-3248). Please do not use it in a productive environment

## How it works

### How the data is stored:

- This app uses two primary data types: `User` and `Chat` entities created with [`redis-om`](https://redis.com/blog/introducing-redis-om-client-libraries/)
- It also uses a secondary `Security` entity used to handle registering and login & a `File` entity to handle fileuploads (this is relevant for MongoDB only).
- In the following, I'll describe both primary data types, their entities and their repositories, in detail

#### 1. The `User` - entity

Defined in [/src/app/redis/User.schema.ts](https://github.com/tq-bit/chattergram-redis/blob/master/backend/src/app/redis/User.schema.ts)

- When a user registers, their data get stored in MongoDB and Redis.
- Mongoose uses one entity for `User`, one for `Security`.
- Fist, a `Security` entity is created. It includes the login data (User+PW-hash)
- This entity is replicated into Redis' `User` entity.
- It includes three relevant properties
  - A unique ID - (converted from MongoDB's ObjectId, `string`)
  - The username - `(string)`
  - The online status - `(bool)`
- The replication happens from MongoDB into Redis when
  - A new user is created (partial)
  - The app is (re)-started (completely)
- In Redis, the online status is updated using a [Redis Event Queue](https://redis.com/redis-best-practices/communication-patterns/event-queue/) & propagated to connected [Websockets](https://www.npmjs.com/package/ws) whenever
  - an authenticated user connects their client's websocket to port 9090 (= Set to online=true)
  - a user sends a message to another user
  - the user's Websocket client disconnects

#### 2. The `Chat` - entity

Defined in [/src/app/redis/Chat.schema.ts](https://github.com/tq-bit/chattergram-redis/blob/master/backend/src/app/redis/Chat.schema.ts)

- When a chat message is created, it's stored in Redis
- It may include a transcribed chat message, given a user has uploaded it previously and sends the receiving `fileId` from the frontend to the `chat` POST - endpoint
- When a user sends such a message, a `Chat` entity is created.
- It includes a few relevant properties:
  - The userIDs of the sender and receiver, `senderId` and `receiverId` respectively
  - The (transcribed) chat's `text` - `(string)`
  - A reference to the uploaded audiofile named, if available - `(string)`

- It's stored in Redis and published into an `Event Queue` [(see: redisPublisher|SubscriberClient)](https://github.com/tq-bit/chattergram-redis/blob/master/backend/src/app/config/redis.config.ts) on the channel `application:messages`
- Finally, the message is propagated to connected Websocket clients
- The replication from MongoDB into Redis (and vice-versa) happens when the application is restarted and works like this (see [redis.sync.ts](https://github.com/tq-bit/chattergram-redis/blob/master/backend/src/app/redis/redis.sync.ts)):
  - From Redis to MongoDB
    - The app checks whether this is the first time chat messages have been synced
    - If so, it will simply move all messages from Redis to MongoDB with `insertMany` (because there are no older chat entries)
    - If not, it'll use [`RediSearch`](https://redis.io/docs/stack/search/) to find all entries in Redis that have been created since the last sync

```ts
ChatRepository.search()
  .where('dateSent')
  .gt(lastSync)
  .return.all();
```

  - Then, I insert the messages from Redis to MongoDB with `inserMany`
  - From MongoDB to Redis
    - First, I execute `FLUSHALL` on the DB to get rid of older Chat & User entries
    - Mongoose then looks up all chat entries that have been created within the last three months
    - I'm then looping through these and create a single Redis entity for each entry
    - These entries are written into the Redis DB.
    - Finally, I use `createIndex` to rebuild the index for the `Chat` repository
    - I'm also setting the `lastSync` timestamp to the current time so the next replication works properly

The same way (without the date - restriction), I'm also synchronizing `User` entities from MongoDB into Redis.

> You might wonder why I didn't use Redis gears for this. I'll be frank - I couldn't get a working Python script up & running in my environment that would do the replication like I wanted to. If you're reading this, I'd be super happy about a few tips on how to properly set up an implementation for my use case.

### How the data is accessed:

I'm heavily relying on `redis-om` to access db data. Below, I'll give a few code examples with different use cases, based on the entity that's accessed

#### 1. The `User` entity

##### 1.1. Get the active user based on their userID

File: [User.handler.ts](https://github.com/tq-bit/chattergram-redis/blob/master/backend/src/app/handler/User.handler.ts#L23)

Code:

```ts
const user = await UserRepository.search()
  .where('_id')
  .eq(userId)
  .return.first();
```

##### 1.2. Get a list of registered users

File: [User.handler.ts](https://github.com/tq-bit/chattergram-redis/blob/master/backend/src/app/handler/User.handler.ts#L12)

Code:

```ts
public getUserList = async (req: AppRequest, reply: FastifyReply) => {
  const users = await UserRepository.search().return.all();
  return reply.send(users);
};
```

#### 2: The `Chat` entity

##### 2.1. Get a list of chat entries for a pair of `sender` & `receiver`

This method is called whenever a user loads their chat history for a specific contact.

File: [Chat.handler.ts](https://github.com/tq-bit/chattergram-redis/blob/5568f86f56bffdc0a7d116acfa9591ec0ce2f2ff/backend/src/app/handler/Chat.handler.ts#L188)

Code:

```ts
private async getChatHistoryFromRedis(userId: string, partnerId: string) {
  return !!userId && !!partnerId
    ? await this.chatRepository
        .search()
        .where('senderId')
        .equals(userId)
        .and('receiverId')
        .equals(partnerId)
        .or((search) => {
          return search
            .where('senderId')
            .equals(partnerId)
            .and('receiverId')
            .equals(userId);
        })
        .sortAsc('dateSent')
        .return.all()
    : [];
}
```

##### 2.2. Find the last redis entry for a pair of `sender` and `receiver`

This method is used to determine how many entries to skip in MongoDB when loading more history items.

File: [Chat.handler.ts](https://github.com/tq-bit/chattergram-redis/blob/5568f86f56bffdc0a7d116acfa9591ec0ce2f2ff/backend/src/app/handler/Chat.handler.ts#L222)

Code:

```ts
const lastRedisEntry = await this.chatRepository
  .search()
  .where('senderId')
  .equals(userId)
  .and('receiverId')
  .equals(partnerId)
  .or((search) => {
    return search
      .where('senderId')
      .equals(partnerId)
      .and('receiverId')
      .equals(userId);
  })
  .sortAsc('dateSent')
  .return.first();
```

#### 3: Search `Chat` and `User`

This is a new feature compared to the old app. I wanted to see how well `redis-om` implements fulltext search. It did not disappoint:

File: [Search.handler.ts](https://github.com/tq-bit/chattergram-redis/blob/master/backend/src/app/handler/Search.handler.ts#L12)

Code:

```ts
public async queryRedisStore(req: SearchRequest, reply: FastifyReply) {
  const { q } = req.query;

  const chatResults = await ChatRepository.search()
    .where('text')
    .match(q)
    .return.all();
  const userResults = await UserRepository.search()
    .where('username')
    .match(q)
    .return.all();

  const chatResponse = chatResults.map((result) => ({
    type: 'chat',
    _id: result._id,
    text: result.text,
  }));
  const userResponse = userResults.map((result) => ({
    type: 'user',
    _id: result._id,
    text: result.username,
  }));

  reply.send([...userResponse, ...chatResponse]);
}

```

### Performance Benchmarks

> I'm benchmarking the new Chattergram version vs. its precursor. Check out [this repos](https://github.com/tq-bit/chattergram) if you would like to recreate the test case.

**Performance indicators**

- the amount of throughput the app is able to process
- the number of reqeusts a single app instance is able to serve under pressure

**Test Params**:

- *Number of Threads*: `1000`
- *Ramp-up period*: `5s`
- *Loop count*: `10`
- *Same user on each iteration*: `true`

For I did not change underlying CRUD logic*, the only bottleneck left is the database. The comparison below was created with [Jmeter](https://jmeter.apache.org/), an open source load testing tool. It uses the HTTP protocol to send POST requests to the API and create new chat messages.

I also disabled Pino logger in `app.ts` to ensure there's nothing going on during the test case that's not really necessary.

> \* What I did change was to replace the handler event listener's logic to a Redis pub/sub mode. In this case, I figured that's just another perk added by using a common Redis feature. You can find this change highlighted in the architecture diagram.


#### Sending a POST request to create a new message (text-only)

Payload (JSON):

```json
{
  "senderId": "6307cffcc3a0365d7358f665",   // or any valid senderId
  "receiverId": "6307cffcc3a0365d7358f665", // or any valid receiverId
  "text": "Sent with Apache JMeter"
}
```

##### Results with Chattergram w/o Redis (PostgreSQL)

Prerequisutes:

- Created a user with the ID of `1` before starting the test
- Deleted all entries from PostgreSQL before starting the bm

Results:

- The test ran for **~21 seconds**
- The average response time was **~1690ms (median: ~1805ms)**
- The average throughput was **~455 transactions/s**

Statistics:

![](https://github.com/tq-bit/chattergram-redis/blob/master/.github/benchmark/respose-time-with-postgres.png)

Response distribution:

![](https://github.com/tq-bit/chattergram-redis/blob/master/.github/benchmark/response-time-distro-with-postgres.png)

##### Results with Chattergram + Redis

Prerequisites:

- Created a user with the ID of `6307cffcc3a0365d7358f665` before starting the test
- Deleted all entries from Redis and MongoDB before starting the bm
- Started the application and created indexes for `User` and `Chat` repositories

Results:

- The test ran for **~14 seconds**
- The average response time was **~1106ms (median: ~1033ms)**
- The average throughput was **~685 transactions/s**

Statistics:

![](https://github.com/tq-bit/chattergram-redis/blob/master/.github/benchmark/respose-time-with-redis.png)

Response distribution:

![](https://github.com/tq-bit/chattergram-redis/blob/master/.github/benchmark/response-time-distro-with-redis.png)

#### Conclusion

In a nutshell: Adding Redis to Chattergram

- **decreased** the total **processing time under pressure** by more than **30%** (from 21 seconds to 14 seconds)
- **reduced** the **average response time** of one request by about **half a second** (from 1690ms to 1106ms)
- **increased** the **amount of transactions** that to be processed by about **50%** (from 445 transactions/s to 685 transactions/ms)

I'll be frank here - Chattergram was my first fullstack Typescript project & many parts are far from optimal. If I was to rewrite it (or any other app, that is) from scratch for a productive environment, I'd always choose Redis again. And if it's only as a frontend database.

## How to run it locally?

### Prerequisites

At a bare minimum, you need to have a working version of Docker and docker-compose installed on your machine. Please follow the official docs to set these up:

* [Install Docker](https://docs.docker.com/engine/install/)
* [Install Docker Compose](https://docs.docker.com/compose/install/)

For development, you will also need a working version of node & npm.

* [Install Nodejs & NPM](https://nodejs.org/en/download/)
* Install with apt (Linux Ubuntu):
  ```sh
  $ sudo apt update
  $ sudo apt install nodejs
  $ node -v # output: vX.Y.Z
  ```

### Local installation

Chattergram uses the Deepgram API for STT. So register and grab an API key.

1. Create an account at [https://console.deepgram.com/signup](https://console.deepgram.com/signup)
2. Create a new API key (permission: Member is sufficient)
3. Clone the repo
   ```sh
   git clone git@github.com:tq-bit/chattergram-redis.git
   ```
4. Make the setup & start scripts executable
  ```sh
  chmod +x bin/start.sh bin/setup.sh
  ```
6. Run `sh bin/setup` and pass in your API key OR
7. Create a `.env` file in the root directory (you can use the .env.example file for templating) + enter your API key under `DEEPGRAM_KEY`
8. In the project's root directory, run `sudo bin/start.sh -d`

> Note: If you change global variables in this file, you have to adjust the respective docker-compose.(d|p).yaml file as well

## Deployment

Unfortunatly, I haven't originally built this app with serverless hosting in mind. You can, however, run and deploy Chattergram in any container environment with a few tweaks. Please check out the [original readme](https://github.com/tq-bit/chattergram-redis/blob/master/readme_legacy.md#run-the-app) for this project for further information or contact me (e.g. using an issue) if you'd like some help with a setup.

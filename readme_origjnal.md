<div id="top"></div>



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/tq-bit/chattergram">
    <img src="assets/logo.gif" alt="Logo" width="120px" height="120px">
  </a>

  <h3 align="center">Chattergram + Redis</h3>

  <p align="center">
    A chat application that transcribes voice messages to text
  </p>
  <div align="center">
    <a href=""></a>
    <img alt="GitHub" src="https://img.shields.io/github/license/tq-bit/chattergram?style=plastic&logo=apache"/>
    <a href="https://chat.q-bit.me">
      <img alt="Demo" src="https://img.shields.io/badge/Demo-Hosted%20on%20DO-blue?style=plastic&logo=digitalocean"/>
    </a>
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/tq-bit/chattergram?style=plastic&logo=git"/>
    <a href="https://chat.q-bit.me/api/docs/static/index.html">
      <img alt="Swagger Validator" src="https://img.shields.io/swagger/valid/3.0?specUrl=https%3A%2F%2Fchat.q-bit.me%2Fapi%2Fdocs%2Fjson&style=plastic&logo=swagger"/>
    </a>
  </div>
</div>


<!-- ABOUT THE PROJECT -->
## About The Project

Chattergram is a full-stack Typescript chat application. With a particular extra:

> It transcribes other people's (english) voice messages into written text for you

[![Chattergram landingpage][product-screenshot]](#)

I've created Chattergram for the [Dev.to & Deepgram Hackathon](https://dev.to/devteam/join-us-for-a-new-kind-of-hackathon-on-dev-brought-to-you-by-deepgram-2bjd). **It stands in no affiliation to the Android app ['Chattergram for Android'](https://apkpure.com/chattergram/com.wChattergram_5331914).**

[![Chattergram audio recording][example-screenshot-I]](#)
<div align="center">Recorded voice messages are automatically transcribed by <a href="https://developers.deepgram.com/api-reference/">Deepgram's Audio API.</a>.  </div>

### Features
- Above all: Voice message transcription from recorded audiofiles
- User authentication
- Persistent chats
- Swift deployment with docker & docker-compose
- Typed data structures & OpenAPI specification under `/api/docs`
- Accurate user login stati
- Last but not least: Light & darkmode

### Non-features
- User profiling
- Chat rooms

### Demo

You can try chattergram under https://chat.q-bit.me/.

> The demo will remain up till the 31. of October or until my free Deepgram credit expires. It runs on a 2GB DO Droplet.

<p align="right">(<a href="#top">back to top</a>)</p>

### Built With

All application components of Chattergram are written in Typescript. In the following, you can see the foundation modules it uses:

#### Frontend

* [Vue 3](https://vuejs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Nginx](https://www.nginx.com/) (production only)

#### Backend
* [Fastify + Plugins](https://www.fastify.io/)
* [WS for realtime websockets](https://github.com/websockets/ws)
* [Redis Stack](https://redis.io/docs/stack/)
* [Mongoose](https://mongoosejs.com/) & [MongoDB](https://www.mongodb.com/)

#### External Services
* [Deepgram Speech-To-Text SAAS](https://deepgram.com/)

#### Development & deployment
* [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
* [Vite](https://vitejs.dev/) (development only)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

Chattergram can be used in `production` and `development` mode. Before running any, you must follow the following, few steps:

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

### Installation

Chattergram uses the Deepgram API for STT. So register and grab an API key.

1. Create an account at [https://console.deepgram.com/signup](https://console.deepgram.com/signup)
2. Create a new API key (persmission: Member is sufficient)
3. Clone the repo
   ```sh
   git clone https://github.com/tq-bit/chattergram.git
   ```
4. Run `sh bin/setup` and pass in your API key OR
5. Create a `.env` file in the root directory (you can use the .env.example file for templating) + enter your API key under `DEEPGRAM_KEY`

> Note: If you change global variables in this file, you have to adjust the respective docker-compose.(d|p).yaml file as well

### Run the app

There are two docker-compose files in the root directory. Each runs a few simple steps to build and run the application in an appropriate setup.

> Please note: I had problems running the app on a 1GB droplet on DO, Vite had problems with the allocated memory to Node.

**Run in dev mode**

After cloning the repos, run:

```bash
sudo bin/start.sh -d
```

**Run in prod mode**

If you would like to run chattergram in your own environment, there are a few prerequisites.

- You must have a valid domainname
- In the frontend, you must adjust the constants `BASE_URL` for axios and `WS_BASE_URL` for the websocket connection to match your domain. (You can do a quick `CTRL+SHIFT+F` to search & replace `chat.q-bit.me`)
- You must configure your server to use TLS for a `wss://` connection.
- You must configure your server to connect to the backend app via websocket

<details>
  <summary>If you're using nginx, a config as follows will do the trick. </summary>
<pre>
# In a dedicated file under /etc/nginx/sites-enabled/<your-domain>
location /ws/ {
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "Upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 86400s; # Prevents the WS connection from breaking after ~ 60secs
  proxy_send_timeout 86400s;
  proxy_pass http://localhost:9090/;
}
</pre>
</details>

Finally, you can start the app by using:

```bash
# Make the script executable
sudo chmod +x bin/start.sh
sudo bin/start.sh -p
```

You can restart the app to incorporate your latest changes by running `sudo bin/restart`.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

 After starting the app, open a browser at `localhost:3000/` (dev) or your domain name (production) & create a new account.

> All your information will be stored in a local PostgreSQL database

[![Chattergram signup gif][onboarding-screenshot-I]](#)

Select another user and start using STT. You can also use Chattergram for good-ol text chats.


[![Chattergram transcription gif][onboarding-screenshot-II]](#)


<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->
## License

Apache License, Version 2.0 See `LICENSE` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Please tell me how you liked the submission. You can reach me on Twitter or on [dev.to](https://dev.to/tqbit) (or via. Chattergram ;-))

> Please note that I will not actively develop this app. If you find a breaking bug, please open an issue and I'll look into it .

Mail: [tobi@q-bit.me](mailto:tobi@q-bit.me) - Twitter: [@qbitme](https://twitter.com/qbitme)

Project Link: [https://github.com/tq-bit/chattergram](https://github.com/tq-bit/chattergram)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

Use this space to list resources you find helpful and would like to give credit to. I've included a few of my favorites to kick things off!

* [Tsvetomira Dichevska](https://www.linkedin.com/in/tsvetomira-dichevska/) thank you for creating my Logo and help me figure out this idea
* [Othneildrew's Best-README-Template](https://github.com/othneildrew/Best-README-Template) which was used to write this template
* [Heroicons](https://heroicons.com/) which are used throughout the application
* [@sinclair/typebox](https://www.npmjs.com/package/@sinclair/typebox) for saving me the headache of typing twice

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/tq-bit/chattergram.svg??style=plastic&logo=appveyor
[contributors-url]: https://github.com/tq-bit/chattergram/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/tq-bit/chattergram.svg??style=plastic&logo=appveyor
[forks-url]: https://github.com/tq-bit/chattergram/network/members
[stars-shield]: https://img.shields.io/github/stars/tq-bit/chattergram.svg??style=plastic&logo=appveyor
[stars-url]: https://github.com/tq-bit/chattergram/stargazers
[issues-shield]: https://img.shields.io/github/issues/tq-bit/chattergram.svg??style=plastic&logo=appveyor
[issues-url]: https://github.com/tq-bit/chattergram/issues
[license-shield]: https://img.shields.io/github/license/tq-bit/chattergram.svg??style=plastic&logo=appveyor
[license-url]: https://github.com/tq-bit/chattergram/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg??style=social&logo=appveyor&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/tobias-quante-764aa1140/
[product-logo]: assets/logo.gif
[product-screenshot]: assets/chattergram_landingpage.png
[example-screenshot-I]: assets/chattergram_chat_I.png
[example-screenshot-II]: assets/chattergram_chat_II.png
[onboarding-screenshot-I]: assets/chattergram_signup.gif
[onboarding-screenshot-II]: assets/chattergram_transcribe.gif

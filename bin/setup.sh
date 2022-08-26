#!/bin/bash

# Create the .env file and add a valid API key
read -p "Enter your deepgram API key: " DEEPGRAM_KEY

echo "Attempting to connect to deepgram..."
response=$(curl --write-out %{http_code} --silent --output /dev/null -X GET -H "Authorization: Token $DEEPGRAM_KEY" https://api.deepgram.com/v1/projects/)

if [[ $response == "200" ]]; then
  echo "Success. Creating .env file"
  cat .env.example >.env
  sed -i "s/DEEPGRAM_KEY=.*/DEEPGRAM_KEY=$DEEPGRAM_KEY/g" .env
else
  echo "Failed to connect to Deepgram!  $response"
  echo "If this error persists, please manually copy your Deepgram API key into the .env.example file and rename it to '.env'"
  exit 1
fi

echo "Installing backend NPM dependencies"
cd ./backend
npm install
cd ..

echo "Installing frontend NPM dependencies"
cd ./frontend
npm install
cd ..

exit 0

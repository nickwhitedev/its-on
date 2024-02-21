# its-on

It's On is a social app that allows people to signal to groups of their friends or followers that something is happening.

## Dev Setup

1. Install [Node.js v18](https://nodejs.org/en/blog/release/v18.12.0)

- Use [Node Version Manager](https://github.com/nvm-sh/nvm) to manage node versions if you already have a different version of node.js installed

2. Install the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) (Stands for Amazon Web Services Serverless Application Model Command Line Interface)

3. Install dependencies (Must be done from backend and frontend directories, not the root directory)
   `yarn`

### Frontend

- Start in the frontend directory
  `cd frontend`
- Start the Vite dev server
  `yarn dev`
- Lint
  `yarn lint`
- Run typescript compiler
  `tsc`
- Run unit tests
  `yarn test`

## Backend

- Start in the backend directory
  `cd backend`
- Lint
  `yarn lint`
- Run typescript compiler
  `tsc`
- Run unit tests
  `yarn test`

## Run API Locally

AWS SAM has a way to run the backend on your computer.

`sam local start-api`

Once the api is running on your machine, you can use the api locally with the given port. For example,

`curl http://localhost:3000/`

TODO: Add instructions for using authentication (or getting around it) for development

## Related Docs

[Generated project outline by AWS SAM](docs/SAM.md)
[Generated project outline by create-react-app](docs/REACT.md)

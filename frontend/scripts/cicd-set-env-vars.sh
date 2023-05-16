#!/bin/bash
#
# Used to set environment variables during github actions
# Meant to be run from the frontend directory
echo "REACT_APP_COGNITO_CLIENT_ID=\"${{needs.build-and-deploy-feature-api.outputs.CognitoClientID}}\"" >> .env.production
echo "REACT_APP_BASE_URL=\"${{needs.build-and-deploy-feature-api.outputs.WebEndpoint}}\"" >> .env.production
echo "REACT_APP_AUTH_URL=\"${{needs.build-and-deploy-feature-api.outputs.AuthEndpoint}}\"" >> .env.production
echo "REACT_APP_API_URL=\"${{needs.build-and-deploy-feature-api.outputs.ApiEndpoint}}\"" >> .env.production

# MeetMind AI – Architecture Overview

## Components
- Amazon S3: Stores transcripts and audio files
- AWS Lambda: Event-driven processing
- AWS Bedrock: AI-powered summarization and analysis
- DynamoDB: Stores processed insights
- CloudWatch: Logs and monitoring

## Design Principles
- Serverless-first
- Event-driven
- Scalable and cost-efficient
- Secure by default (IAM least privilege)

## Future Enhancements
- Step Functions for orchestration
- API Gateway for public APIs
- Authentication using Cognito

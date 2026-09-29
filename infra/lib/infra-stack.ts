import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'HotelVpc', { maxAzs: 2 });

    // RDS Database
    const db = new rds.DatabaseInstance(this, 'HotelDB', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15 }),
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      multiAz: false, // Save cost for dev, change for prod
      databaseName: 'hotel_portal',
      publiclyAccessible: false,
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'HotelUsers', {
      userPoolName: 'hotel-users',
      signInAliases: { email: true },
      autoVerify: { email: true },
      customAttributes: {
        'organization_id': new cognito.StringAttribute({ mutable: true }),
      },
    });
    
    new cognito.CfnUserPoolGroup(this, 'SuperAdminGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'super_admin',
    });
    
    new cognito.CfnUserPoolGroup(this, 'ClientAdminGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'client_admin',
    });

    // S3 Bucket for Media
    const mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName: `hotel-portal-media-${this.account}-${this.region}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // CloudFront for Media
    new cloudfront.Distribution(this, 'MediaDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(mediaBucket) },
    });

    // Fargate API Service
    const cluster = new ecs.Cluster(this, 'AppCluster', { vpc });
    
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ApiService', {
      cluster,
      memoryLimitMiB: 512,
      cpu: 256,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../apps/api'), // Assumes Dockerfile in apps/api
        environment: {
          NODE_ENV: 'production',
          DB_HOST: db.dbInstanceEndpointAddress,
          DB_PORT: db.dbInstanceEndpointPort,
          // POSTGRES_DB, DB_USER, etc should be injected via Secrets Manager
        },
      },
    });
    
    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
  }
}

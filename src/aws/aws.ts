import AwsSdk = require("aws-sdk");

import LambdaDeployer from "./lambda-deployer";
import LambdaScheduler from "./lambda-scheduler";
import RoleCreator from "./role-creator";

export interface AwsCredentials {
    accessKeyId: string;
    secretAccessKey: string;
}

// Here we inject the SDK into each AWS component we have. They don't depend on it directly just
// so that we can manage testing sensibly, rather than having to hack around with rewire/etc.
export var lambdaDeployer = new LambdaDeployer(AwsSdk);
export var lambdaScheduler = new LambdaScheduler(AwsSdk);
export var roleCreator = new RoleCreator(AwsSdk);

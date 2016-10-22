import { IAM, Lambda, CloudWatchEvents, Endpoint } from "aws-sdk";
import promisify = require("es6-promisify");

/*
 * This bit's a little crazy and nasty. We go through an entire given Lambda object, and wrap
 * every method dynamically with promisify(x.bind(lambda)), so we can promise everything.
 *
 * This code is terrible and sad, but it makes the rest of the code delightful to work with.
 * Should be able to delete this once the AWS Lambda API supports promises properly.
 */

// Taken straight from DefinitelyTyped's AWS Lambda class definition, transformed to Promises.
export interface PromisifiedLambda {
    endpoint: Endpoint;
    addPermission(params: Lambda.AddPermissionParams): Promise<any>;
    createAlias(params: Lambda.CreateAliasParams): Promise<any>;
    createEventSourceMapping(params: Lambda.CreateEventSourceMappingParams): Promise<any>;
    createFunction(params: Lambda.CreateFunctionParams): Promise<any>;
    deleteAlias(params: Lambda.DeleteAliasParams): Promise<any>;
    deleteEventSourceMapping(params: Lambda.DeleteEventSourceMappingParams): Promise<any>;
    deleteFunction(params: Lambda.DeleteFunctionParams): Promise<any>;
    getAlias(params: Lambda.GetAliasParams): Promise<any>;
    getEventSourceMapping(params: Lambda.GetEventSourceMappingParams): Promise<any>;
    getFunction(params: Lambda.GetFunctionParams): Promise<any>;
    getFunctionConfiguration(params: Lambda.GetFunctionConfigurationParams): Promise<any>;
    getPolicy(params: Lambda.GetPolicyParams): Promise<any>;
    invoke(params: Lambda.InvokeParams): Promise<any>;
    listAliases(params: Lambda.ListAliasesParams): Promise<any>;
    listEventSourceMappings(params: Lambda.ListEventSourceMappingsParams): Promise<any>;
    listFunctions(params: Lambda.ListFunctionsParams): Promise<any>;
    listVersionsByFunction(params: Lambda.ListVersionsByFunctionParams): Promise<any>;
    publishVersion(params: Lambda.PublishVersionParams): Promise<any>;
    removePermission(params: Lambda.RemovePermissionParams): Promise<any>;
    updateAlias(params: Lambda.UpdateAliasParams): Promise<any>;
    updateEventSourceMapping(params: Lambda.UpdateEventSourceMappingParams): Promise<any>;
    updateFunctionCode(params: Lambda.UpdateFunctionCodeParams): Promise<any>;
    updateFunctionConfiguration(params: Lambda.UpdateFunctionConfigurationParams): Promise<any>;
}

export interface PromisifiedIam {
    getRole(params: IAM.GetRoleParams): Promise<any>;
    createRole(params: IAM.CreateRoleParams): Promise<any>;
    putRolePolicy(params: IAM.PutRolePolicyParams): Promise<any>;
}

export interface PromisifiedCloudWatchEvents {
    putRule(params: CloudWatchEvents.PutRuleParams): Promise<any>;
    putTargets(params: CloudWatchEvents.PutTargetsParams): Promise<any>;
    listRuleNamesByTarget(params: CloudWatchEvents.ListRuleNamesByTargetParams): Promise<any>;
}

function boundPromisify<T>(input: {}): T {
    let output = {};
    for (let prop in input) {
        if (input[prop].bind) {
            output[prop] = promisify(input[prop].bind(input));
        } else {
            output[prop] = input[prop];
        }
    }
    return <T> output;
}

export var promisifyEvents = <(lambda: CloudWatchEvents) => PromisifiedCloudWatchEvents> boundPromisify;
export var promisifyLambda = <(lambda: Lambda) => PromisifiedLambda> boundPromisify;
export var promisifyIam = <(iam: IAM) => PromisifiedIam> boundPromisify;

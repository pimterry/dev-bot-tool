import HttpServerMock = require("http-server-mock");

export class IamMock {
    private IAM_URL = "https://iam.amazonaws.com/";

    constructor(private server: HttpServerMock) { }

    onGetRole(name: string) {
        let request = this.server.post(this.IAM_URL).withForm({
            Action: "GetRole",
            RoleName: name
        });

        return {
            findRole: () => request.thenReply(200,
                `<GetRoleResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
                	<GetRoleResult>
                		<Role>
                			<Path>/</Path>
                			<AssumeRolePolicyDocument>%7B%22Version%22%3A%222008-10-17%22%2C%22Statement%22%3A%5B%5D%7D</AssumeRolePolicyDocument>
                			<RoleId>ABCABCABCABCABCABCABC</RoleId>
                			<RoleName>${name}</RoleName>
                			<Arn>arn:aws:iam::111111111111:role/${name}</Arn>
                			<CreateDate>2016-09-12T14:07:00Z</CreateDate>
                		</Role>
                	</GetRoleResult>
                	<ResponseMetadata>
                		<RequestId>8fd468de-95f4-11e6-80dd-8b0e8971750d</RequestId>
                	</ResponseMetadata>
                </GetRoleResponse>`
            )
        };
    }
}

export class LambdaMock {
    private LAMBDA_URL = "https://lambda.eu-west-1.amazonaws.com/";
    private url(path: string) {
        return `${this.LAMBDA_URL}${path}`;
    }

    constructor(private server: HttpServerMock) { }

    onGetFunction(name: string) {
        let request = this.server.get(this.url(`2015-03-31/functions/${name}`));

        return {
            findFunction: (arn: string) => request.thenReply(200,
                JSON.stringify({
                    "Code": {
                        "Location": `https://awslambda-eu-west-1-tasks.s3-eu-west-1.amazonaws.com/snapshots/123123123123/${name}`,
                        "RepositoryType": "S3"
                    },
                    "Configuration": this.functionConfiguration({
                        "FunctionName": name,
                        "FunctionArn": arn
                    })
                })
            ),
            dontFindFunction: () => request.thenReply(404,
                JSON.stringify({
                	"Message": "Function not found: arn:mock-arn",
                	"Type": "User"
                })
            )
        };
    }

    onCreateFunction(name: string) {
        // TODO: Validate arguments
        let request = this.server.post(this.url(`2015-03-31/functions`));

        return {
            succeedWithArn: (arn: string) => request.thenReply(201,
                JSON.stringify(this.functionConfiguration({"FunctionArn": arn})))
        };
    }

    onUpdateFunctionCode(name: string) {
        let request = this.server.put(this.url(`2015-03-31/functions/${name}/code`));

        return {
            succeed: () => request.thenReply(200,
                JSON.stringify(this.functionConfiguration({"FunctionName": name})))
        };
    }

    onAddPermission(lambdaArn: string, lambdaAction: string, principal: string) {
        // TODO: Validate arguments
        let encodedArn = encodeURIComponent(lambdaArn);
        let request = this.server.post(this.url(`2015-03-31/functions/${encodedArn}/policy`));

        return {
            succeed: () => request.thenReply(200)
        }
    }

    private functionConfiguration(overrides: { [key: string]: any }) {
        return Object.assign({
            "CodeSha256": "OPx5wn0xkdm1cWqf9WdllCZQNGKQ3o5LD/Xu1pJTQiY=",
            "CodeSize": 1554,
            "Description": "Mock function",
            "Environment": null,
            "FunctionArn": `arn:aws:lambda:eu-west-1:123123123123:function:mockfunction`,
            "FunctionName": "mockfunction",
            "Handler": "mock-function.handler",
            "KMSKeyArn": null,
            "LastModified": "2016-10-19T12:07:11.145+0000",
            "MemorySize": 128,
            "RedrivePolicy": null,
            "Role": "arn:aws:iam::111111111111:role/mock-role",
            "Runtime": "nodejs4.3",
            "Timeout": 3,
            "Version": "$LATEST",
            "VpcConfig": null
        }, overrides);
    }
}

export class CloudWatchEventsMock {
    private EVENTS_URL = "https://events.eu-west-1.amazonaws.com/";

    constructor(private server: HttpServerMock) { }

    onListRuleNamesByTarget(targetArn: string) {
        // TODO: Validate arguments
        let request = this.server.post(this.EVENTS_URL).withHeaders({
            "X-Amz-Target": "AWSEvents.ListRuleNamesByTarget"
        });

        return {
            findRuleNames: (names: string[]) => request.thenReply(200, JSON.stringify({
                RuleNames: names
            })),
            findNoRuleNames: () => request.thenReply(200, JSON.stringify({
                RuleNames: []
            }))
        }
    }

    onPutRule(name: string, rule: { [key: string]: any }) {
        // TODO: Validate arguments
        let request = this.server.post(this.EVENTS_URL).withHeaders({
            "X-Amz-Target": "AWSEvents.PutRule"
        });

        return {
            succeedWithArn(arn: string) {
                request.thenReply(200, JSON.stringify({
                    "RuleArn": arn
                }));
            }
        }
    }

    onPutTargets(ruleName: string, ...targets: { Arn: string }[]) {
        // TODO: Validate arguments
        let request = this.server.post(this.EVENTS_URL).withHeaders({
            "X-Amz-Target": "AWSEvents.PutTargets"
        });

        return {
            succeed: () => request.thenReply(200)
        }
    }
}

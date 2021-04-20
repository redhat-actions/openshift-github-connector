export enum ScriptTypes {
  Shell = "sh",
  Batch = "batch"
}

export function getCreateSACodeBlock(
  scriptType: ScriptTypes, saName: string, saRole: string, namespace: string
): string {

  // these scripts are copied from
  // https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions#creating-the-service-account
  // with slight modification (add namespace arg, remove comments and echos for brevity)

  if (scriptType === "sh") {
    return `export SA=${saName}
oc -n ${namespace} create sa $SA
oc -n ${namespace} policy add-role-to-user ${saRole} -z $SA
export SECRETS=$(oc -n ${namespace} get sa $SA -o jsonpath='{.secrets[*].name}{"\\n"}')
export SECRET_NAME=$(printf "%s\\n" $SECRETS | grep "token")
export ENCODED_TOKEN=$(oc -n ${namespace} get secret $SECRET_NAME -o jsonpath='{.data.token}{"\\n"}')
export TOKEN=$(echo $ENCODED_TOKEN | base64 -d) && echo "Token is:" && echo $TOKEN;
`;
  }

  return `@echo off
set SA=${saName}
oc -n ${namespace} create sa %SA%
oc -n ${namespace} policy add-role-to-user ${saRole} -z %SA%

oc -n ${namespace} get sa %SA% -o jsonpath='{.secrets[*].name}' >tmp.secret
set /P SECRETSQ=< tmp.secret
set SECRETS=%SECRETSQ:'=%
echo NOMATCH >tmp.per_line
for %%a in (%SECRETS%) do echo %%a >>tmp.per_line
grep  "token" tmp.per_line > tmp.secret_name
set /P SECRET_NAMEQ=< tmp.secret_name
set SECRET_NAME=%SECRET_NAMEQ:'=%

oc -n ${namespace} get secret %SECRET_NAME%  -o jsonpath='{.data.token}' > tmp.token
set /P ENCODED_TOKENQ=< tmp.token
set ENCODED_TOKEN=%ENCODED_TOKENQ:'=%
echo %ENCODED_TOKEN% > tmp.token
certutil -decode tmp.token tmp.data > nul
set /P TOKEN=< tmp.data

del tmp.secret tmp.per_line tmp.secret_name tmp.secret_name tmp.token tmp.data
echo TOKEN is %TOKEN% and is in your clipboard
echo|set /p=%TOKEN%| clip`;
}

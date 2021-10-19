import { useContext, useState, useRef } from "react";
import classNames from "classnames";
import {
  Card, CardBody, CardTitle, Checkbox,
  Form, FormGroup, Button, TextInput, FormSelect,
} from "@patternfly/react-core";
import { Table } from "@patternfly/react-table";
import { v4 as uuid } from "uuid";

import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import ImageRegistry from "../../common/types/image-registries";
import { NewTabLink } from "../components/external-link";
import { TooltipIcon } from "../components/tooltip-icon";
import ApiResponses from "../../common/api-responses";
import MyBanner from "../components/banner";
import BtnBody from "../components/btn-body";
import { fetchJSON } from "../util/client-util";
import ApiEndpoints from "../../common/api-endpoints";
import ApiRequests from "../../common/api-requests";
import DataFetcher from "../components/data-fetcher";
import { containsBannedCharacters } from "../../common/common-util";
import { CommonIcons } from "../util/icons";
import { PushAlertContext } from "../contexts";

export default function ImageRegistriesPage(): JSX.Element {

  return (
    <>
      <DataFetcher type="api" endpoint={ApiEndpoints.User.ImageRegistries} loadingDisplay="card">{
        (registriesRes: ApiResponses.ImageRegistryListResult, reload) => {

          return (
            <>
              <Card>
                <CardTitle>
                  <div>
                  Container Image Registries
                  </div>
                  <div className="ms-auto">

                    <Button variant="primary"
                      onClick={reload}
                    >
                      <BtnBody icon={CommonIcons.Reload} text="Reload"/>
                    </Button>
                  </div>
                </CardTitle>
                <CardBody>
                  {
                    (() => {
                      if (!registriesRes.success) {
                        return (
                          <MyBanner
                            severity="danger"
                            title={"Failed to get image registries: " + registriesRes.message}
                          />
                        );
                      }

                      if (registriesRes.registries.length === 0) {
                        return (
                          <p>
                          No image registries are set up. Create an image registry below.
                          </p>
                        );
                      }

                      return (
                        <Table borders={true}>
                          <thead className="">
                            <tr className="">
                              {/* <th scope="col" className="">Hostname</th>
                              <th scope="col" className="">Namespace</th> */}
                              <th scope="col" className="">Registry Path</th>
                              <th scope="col" className="">Username</th>
                              <th scope="col" className="" style={{ width: "8ch" }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {
                              registriesRes.registries.map((reg) => <ImageRegistryRow key={reg.id} registry={reg} onChange={reload} />)
                            }
                          </tbody>
                        </Table>
                      );
                    })()
                  }
                </CardBody>
              </Card>

              <CreateImageRegistryCard onChange={reload}/>
            </>
          );
        }
      }
      </DataFetcher>

    </>
  );
}

function ImageRegistryRow({ registry, onChange }: { registry: ImageRegistry.Info, onChange: () => Promise<void> }): JSX.Element {
  const pushAlert = useContext(PushAlertContext);
  const [ isDeleting, setIsDeleting ] = useState(false);

  return (
    <tr>
      {/* <td>{registry.type}</td> */}
      {/* <td>{registry.hostname}</td>
      <td>{registry.namespace}</td> */}
      {/* <td className="h-100 center-y justify-content-between"> */}
      <td>
        <div className="w-100">
          {registry.fullPath}
        </div>
        <div className="text-right">
          <NewTabLink href={"https://" + registry.fullPath} icon={{ position: "right", Icon: ExternalLinkAltIcon }} />
        </div>
      </td>
      <td>{registry.username}</td>
      <td className="text-right">
        <Button variant="danger" disabled={isDeleting} onClick={async () => {
          setIsDeleting(true);
          try {
            await fetchJSON<ApiRequests.DeleteImageRegistry, ApiResponses.Result>("DELETE", ApiEndpoints.User.ImageRegistries, {
              id: registry.id,
            });

            await onChange();
          }
          catch (err) {
            pushAlert({ severity: "warning", title: `Error deleting ${registry.fullPath}`, body: err.toString() });
          }
          finally {
            setIsDeleting(false);
          }
        }}>
          <BtnBody icon={CommonIcons.Delete} title="Remove" isLoading={isDeleting}/>
        </Button>
      </td>
    </tr>
  );
}

function CreateImageRegistryCard({ onChange }: { onChange: () => Promise<void> }): JSX.Element {
  const bannerId = useRef(() => uuid()).current;

  const defaultRegistryType: ImageRegistry.Type = "GHCR";
  const defaultRegistryInfo = ImageRegistry.Registries[defaultRegistryType];

  const [ registryInfo, setRegistryInfo_ ] = useState<ApiRequests.AddImageRegistry>({
    type: defaultRegistryType,
    hostname: defaultRegistryInfo.hostname,
    namespace: "",
    passwordOrToken: "",
    username: "",
  });

  // helper function to set partial registry info and maintain the rest
  const setRegistryInfo = (reg: Partial<typeof registryInfo>) => {
    setRegistryInfo_({
      ...registryInfo,
      ...reg,
    });
  };

  const [ showHostnameInput, setShowHostnameInput ] = useState(false);
  const [ userNameIsNamespace, setUserNameIsNamespace ] = useState(true);

  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const [ submissionResult, setSubmissionResult ] = useState<ApiResponses.ImageRegistryCreationResult | undefined>();

  return (
    <Card>
      <CardTitle>
        Add an Image Registry
      </CardTitle>
      <CardBody>
        <p>
          The starter workflow requires a Container Image Registry to push built images to, and pull images from.
        </p>
        <p>
          You can use the <NewTabLink href="https://docs.github.com/en/packages/guides/about-github-container-registry">
            GitHub container registry
          </NewTabLink>, the <NewTabLink
            href="https://docs.openshift.com/container-platform/4.7/registry/architecture-component-ImageRegistries.html">
            OpenShift Integrated Registry
          </NewTabLink>,
          or another image registry such
          as <NewTabLink href="https://quay.io">quay.io</NewTabLink> or <NewTabLink href="https://www.docker.com/products/docker-hub">
            DockerHub
          </NewTabLink>.
        </p>

        <div>
          <Form className="my-4" onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            setIsSubmitting(true);

            const valid = e.currentTarget.checkValidity();

            if (!valid) {
              return;
            }

            try {
              const createResponse = await fetchJSON<
              ApiRequests.AddImageRegistry,
              ApiResponses.ImageRegistryCreationResult
              >("POST", ApiEndpoints.User.ImageRegistries, registryInfo);

              setSubmissionResult(createResponse);

              await onChange();
            }
            catch (err) {
              setSubmissionResult({
                message: err.message,
                status: err.status,
                statusMessage: err.statusMessage,
                success: false,
                severity: "danger",
              });
            }
            finally {
              setIsSubmitting(false);
            }
          }}>
            <FormGroup fieldId="registry" label="Registry">
              <FormSelect
                aria-label="Registry"
                value={registryInfo.type}
                onChange={(value) => {
                  const type = value as ImageRegistry.Type;
                  const reg = ImageRegistry.Registries[type];

                  const isGhcr = type === "GHCR";
                  const ghcrUseGitHubToken = registryInfo.ghcrUseGitHubToken && isGhcr;
                  // setRegistryType(type);

                  if (!reg.hostname) {
                    setShowHostnameInput(true);
                    setRegistryInfo({ type, hostname: "", ghcrUseGitHubToken });
                  }
                  else {
                    setShowHostnameInput(false);
                    setRegistryInfo({ type, hostname: reg.hostname, ghcrUseGitHubToken });
                  }
                }}
              >
                {
                  Object.entries(ImageRegistry.Registries).map(([ type, reg ]) => {
                    return (
                      <option
                        value={type}
                        key={type}
                        title={reg.description}
                      >
                        {reg.description} {reg.hostname ? `(${reg.hostname})` : ""}
                      </option>
                    );
                  })
                }
              </FormSelect>
            </FormGroup>

            <FormGroup
              fieldId="namespace"
              label="Namespace"
              labelIcon={
                <TooltipIcon title="Registry Namespace" body={(
                  <>
                    <p>
                      The namespace is the first segment of the registry path, between the first and second slashes.
                    </p>
                    <p>
                      For example, for the image path<br/>&quot;
                      <span className="">ghcr.io/</span>
                      <span className="b">redhat-actions</span>/my-image:latest&quot;,
                      <br/>
                      the registry hostname is &quot;ghcr.io&quot;, and
                      the namespace is <span className="b">&quot;redhat-actions&quot;</span>.
                    </p>
                  </>
                )}
                />
              }
              validated={validateNoBannedCharacters(registryInfo.namespace)}
              helperTextInvalid={registryInfo.namespace.length > 0 ? "The namespace contains illegal characters." : undefined}
            >
              <TextInput
                aria-label="Namespace"
                defaultValue={registryInfo.namespace}
                onChange={(value) => {
                  const namespace = value;
                  const username = userNameIsNamespace ? namespace : registryInfo.username;
                  setRegistryInfo({ namespace, username });
                }}
              />
            </FormGroup>

            <div className={classNames({ "d-none": !showHostnameInput })}>
              <FormGroup fieldId="hostname" label="Hostname" validated={validateNoBannedCharacters(registryInfo.hostname)}>
                <TextInput
                  aria-label="Hostname"
                  onChange={(value) => {
                    setRegistryInfo({ hostname: value });
                  }}
                />
              </FormGroup>
            </div>

            <div>
              <FormGroup fieldId="registry-path" label="Registry Path" labelIcon={
                <TooltipIcon body={(
                  <>
                    <p>Registry Path is the Registry plus the Namespace, separated by a slash.</p>
                    <p>Use the fields above to change the Registry Path.</p>
                  </>
                )}
                />
              }>
                <TextInput
                  aria-label="Registry Path"
                  isReadOnly
                  value={registryInfo.hostname ? `${registryInfo.hostname}/${registryInfo.namespace}` : ""}
                />
              </FormGroup>
            </div>

            <FormGroup
              label="Username"
              fieldId="username"
              validated={validateNoBannedCharacters(registryInfo.username)}
            >
              <Checkbox
                className="mb-2"
                id="username-same-as-namespace"
                label="Username same as namespace"
                isChecked={userNameIsNamespace}
                onChange={(checked) => { setUserNameIsNamespace(checked); }}
              />

              <TextInput
                value={userNameIsNamespace ? registryInfo.namespace : registryInfo.username}
                isReadOnly={userNameIsNamespace}
                title={userNameIsNamespace ? "Disabled: Username is same as namespace" : ""}
                onChange={(value) => { setRegistryInfo({ username: value }); }}
              />
            </FormGroup>

            <FormGroup
              fieldId="password-or-token"
              label="Password or Token"
            >
              <Checkbox
                label={
                  <div className="center-y">
                    Use built-in Actions workflow token
                    <NewTabLink
                      className="mx-2"
                      href="https://docs.github.com/en/actions/reference/authentication-in-a-workflow"
                    >
                      <TooltipIcon body="Click to open GitHub Documentation" />
                    </NewTabLink>
                  </div>
                }
                id="use-github-token"
                isChecked={registryInfo.ghcrUseGitHubToken ?? false}
                className={classNames({ "d-none": registryInfo.type !== "GHCR" })}
                onChange={(checked) => { setRegistryInfo({ ghcrUseGitHubToken: checked, passwordOrToken: "" }); }}
              />

              <TextInput
                className="col-6"
                type="password"
                isReadOnly={registryInfo.ghcrUseGitHubToken}
                value={registryInfo.passwordOrToken}
                onChange={(value) => { setRegistryInfo({ passwordOrToken: value }); }}
              />
            </FormGroup>

            <div className="mt-3 center-x align-items-center">
              <Button type="submit">
                <BtnBody text="Add Image Registry" icon={CommonIcons.Add} />
              </Button>
            </div>
          </Form>
        </div>

        <SubmissionStatusBanner bannerId={bannerId()} isSubmitting={isSubmitting} submissionResult={submissionResult}/>
      </CardBody>
    </Card>
  );
}

function validateNoBannedCharacters(s: string | undefined): "success" | "default" | "error" {
  if (s == null || s.length === 0) {
    return "default";
  }
  return containsBannedCharacters(s) ? "error" : "success";
}

function SubmissionStatusBanner(props: {
  bannerId: string,
  isSubmitting: boolean,
  submissionResult?: ApiResponses.ImageRegistryCreationResult,
}): JSX.Element {

  if (props.isSubmitting) {
    return (
      <MyBanner id={props.bannerId}
        className="my-3"
        display={props.isSubmitting}
        severity={"info"}
        loading={props.isSubmitting}
        title={"Creating image registry..."}
      />
    );
  }
  else if (!props.submissionResult) {
    return <MyBanner id={props.bannerId} display={false} />;
  }

  return (
    <>
      <MyBanner
        className="my-3"
        id={props.bannerId}
        display={true}
        severity={props.submissionResult.severity}
        title={props.submissionResult.message}
      />

      {/* {
        props.submissionResult.success ? (

        ) : ("")
      } */}
    </>
  );
}

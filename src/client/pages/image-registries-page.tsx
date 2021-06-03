import React, { useState, useRef } from "react";
import classNames from "classnames";
import {
  Card, CardBody, CardTitle, Checkbox,
  Form, FormGroup, Button, TextInput, FormSelect,
} from "@patternfly/react-core";
import { Table } from "@patternfly/react-table";
import { v4 as uuid } from "uuid";

import {
  ExternalLinkAltIcon, PlusIcon, QuestionCircleIcon, SyncAltIcon, TimesIcon,
} from "@patternfly/react-icons";
import ImageRegistry from "../../common/types/image-registries";
import { ExternalLink } from "../components/external-link";
import { TooltipIcon } from "../components/tooltip-icon";
import ApiResponses from "../../common/api-responses";
import Banner from "../components/banner";
import BtnBody from "../components/btn-body";
import { fetchJSON } from "../util/client-util";
import ApiEndpoints from "../../common/api-endpoints";
import ApiRequests from "../../common/api-requests";
import SetupPageHeader from "./setup/setup-header";
import DataFetcher from "../components/data-fetcher";
import { containsBannedCharacters } from "../../common/common-util";

export default function ImageRegistriesPage(): JSX.Element {

  return (
    <React.Fragment>
      <SetupPageHeader pageIndex={4} canProceed={true} />

      <DataFetcher type="api" endpoint={ApiEndpoints.User.ImageRegistries} loadingDisplay="card">{
        (registriesRes: ApiResponses.ImageRegistryListResult, reload) => {

          return (
            <React.Fragment>
              <Card>
                <CardTitle>
                  <div>
                  Container Image Registries
                  </div>
                  <div className="ml-auto">

                    <Button variant="primary"
                      onClick={reload}
                    >
                      <BtnBody icon={SyncAltIcon} text="Reload"/>
                    </Button>
                  </div>
                </CardTitle>
                <CardBody>
                  {
                    (() => {
                      if (!registriesRes.success) {
                        return (
                          <Banner
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
                            {/* <colgroup className="row">
                              <col className="col-2"></col>
                              <col className="col-2"></col>
                              <col className="col-3"></col>
                              <col className="col-3"></col>
                              <col className="col-2"></col>
                            </colgroup> */}
                            {/* <tr className="d-flex">
                              <th className="col-3">Hostname</th>
                              <th className="col-2">Namespace</th>
                              <th className="col-3">Full Path</th>
                              <th className="col-3">Username</th>
                              <th className="col-2"></th>
                            </tr> */}
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
            </React.Fragment>
          );
        }
      }
      </DataFetcher>

    </React.Fragment>
  );
}

function ImageRegistryRow({ registry, onChange }: { registry: ImageRegistry.Info, onChange: () => Promise<void> }): JSX.Element {
  const [ isDeleting, setIsDeleting ] = useState(false);

  return (
    <tr>
      {/* <td>{registry.type}</td> */}
      {/* <td>{registry.hostname}</td>
      <td>{registry.namespace}</td> */}
      {/* <td className="h-100 d-flex align-items-center justify-content-between"> */}
      <td>
        <div className="w-100">
          {registry.fullPath}
        </div>
        <div className="text-right">
          <ExternalLink href={"https://" + registry.fullPath} icon={{ position: "right", icon: ExternalLinkAltIcon }} />
        </div>
      </td>
      <td >{registry.username}</td>
      <td className="text-right">
        <Button variant="danger" disabled={isDeleting} onClick={async () => {
          setIsDeleting(true);
          try {
            await fetchJSON<ApiRequests.DeleteImageRegistry, ApiResponses.Result>("DELETE", ApiEndpoints.User.ImageRegistries, {
              id: registry.id,
            });

            void onChange();
          }
          catch (err) {
            console.error(err);
          }
          finally {
            setIsDeleting(false);
          }
        }}>
          <BtnBody icon={TimesIcon} title="Remove" isLoading={isDeleting}/>
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
          You can use the <ExternalLink href="https://docs.github.com/en/packages/guides/about-github-container-registry">
            GitHub container registry
          </ExternalLink>, the <ExternalLink
            href="https://docs.openshift.com/container-platform/4.7/registry/architecture-component-ImageRegistries.html">
            OpenShift Integrated Registry
          </ExternalLink>,
          or another image registry such
          as <ExternalLink href="https://quay.io">quay.io</ExternalLink> or <ExternalLink href="https://www.docker.com/products/docker-hub">
            DockerHub
          </ExternalLink>.
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

              void onChange();
            }
            catch (err) {
              setSubmissionResult({
                message: err.message,
                success: false,
                severity: "danger",
              });
            }
            finally {
              setIsSubmitting(false);
            }
          }}>
            <div>
              <FormGroup fieldId="registry" label="Registry">
                <FormSelect onChange={(value) => {
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
                          title=""
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
                    <React.Fragment>
                      <p>
                       The namespace is the first segment of the registry path, between the first and second slashes.
                      </p>
                      <p>
                       For example, for the image path <br/>
                        <span className="">ghcr.io/</span>
                        <span className="font-weight-bold">redhat-actions</span>/my-image:latest
                      </p>
                      <p>
                       The registry hostname is {`"ghcr.io"`}.
                      </p>
                      <p>
                       The namespace is <span className="font-weight-bold">{`"redhat-actions"`}</span>.
                      </p>
                    </React.Fragment>
                  )}
                  />
                }
                validated={validateNoBannedCharacters(registryInfo.namespace)}
                helperTextInvalid={registryInfo.namespace.length > 0 ? "The namespace contains illegal characters." : undefined}
              >
                <TextInput
                  defaultValue={registryInfo.namespace}
                  onChange={(value) => {
                    const namespace = value;
                    const username = userNameIsNamespace ? namespace : registryInfo.username;
                    setRegistryInfo({ namespace, username });
                  }}
                />
              </FormGroup>
            </div>

            <div className={classNames({ "d-none": !showHostnameInput })}>
              <FormGroup fieldId="hostname" label="Hostname" validated={validateNoBannedCharacters(registryInfo.hostname)}>
                <TextInput
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
                  readOnly
                  value={registryInfo.hostname ? `${registryInfo.hostname}/${registryInfo.namespace}` : ""}
                />
              </FormGroup>
            </div>

            <hr/>

            <div className="d-flex align-items-center">
              <FormGroup
                fieldId="username"
                label="Username"
                validated={validateNoBannedCharacters(registryInfo.username)}
              >
                <TextInput
                  defaultValue={userNameIsNamespace ? registryInfo.namespace : registryInfo.username}
                  readOnly={userNameIsNamespace}
                  title={userNameIsNamespace ? "Username is same as namespace" : ""}
                  onChange={(value) => { setRegistryInfo({ username: value }); }}
                />
              </FormGroup>
              <FormGroup
                fieldId="username-same-as-namespace"
                label="Username same as namespace"
                className="pl-3 b"
              >
                <Checkbox
                  id="username-is-namespace"
                  checked={userNameIsNamespace}
                  onChange={(checked) => { setUserNameIsNamespace(checked); }}
                />
              </FormGroup>
            </div>

            <div>
              <FormGroup label="Password or Token" fieldId="password-or-token">
                <TextInput
                  type="password"
                  readOnly={registryInfo.ghcrUseGitHubToken}
                  value={registryInfo.passwordOrToken}
                  onChange={(value) => { setRegistryInfo({ passwordOrToken: value }); }}
                />
              </FormGroup>

              <FormGroup
                className={classNames("pl-3 b", { "d-none": registryInfo.type !== "GHCR" })}
                fieldId="use-github-token"
              >
                <Checkbox
                  id="use-github-token-cb"
                  checked={registryInfo.ghcrUseGitHubToken ?? false}
                  onChange={(checked) => { setRegistryInfo({ ghcrUseGitHubToken: checked, passwordOrToken: "" }); }}
                />
                <div>
                  Use built-in Actions workflow token
                  <ExternalLink
                    className="mx-2"
                    href="https://docs.github.com/en/actions/reference/authentication-in-a-workflow"
                  >
                    <QuestionCircleIcon size="lg" />
                  </ExternalLink>
                </div>
              </FormGroup>
            </div>

            <div className="mt-3 d-flex justify-content-center align-items-center">
              <Button isLarge type="submit">
                <BtnBody text="Add Image Registry" icon={PlusIcon} />
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
      <Banner id={props.bannerId}
        className="my-3"
        display={props.isSubmitting}
        severity={"info"}
        loading={props.isSubmitting}
        title={"Creating image registry..."}
      />
    );
  }
  else if (!props.submissionResult) {
    return <Banner id={props.bannerId} display={false} />;
  }

  return (
    <React.Fragment>
      <Banner
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
    </React.Fragment>
  );
}

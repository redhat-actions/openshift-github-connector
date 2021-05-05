import React, { useState, useRef } from "react";
import classNames from "classnames";
import {
  Card, Form, Col, Button, Table,
} from "react-bootstrap";
import { v4 as uuid } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ImageRegistry from "../../common/types/image-registries";
import { ExternalLink } from "../components/external-link";
import { TooltipIcon } from "../components/tooltip-icon";
import ApiResponses from "../../common/api-responses";
import Banner from "../components/banner";
import BtnBody from "../components/fa-btn-body";
import { fetchJSON } from "../util/client-util";
import ApiEndpoints from "../../common/api-endpoints";
import ApiRequests from "../../common/api-requests";
import SetupPageHeader from "./setup/setup-header";
import DataFetcher from "../components/data-fetcher";
import { containsBannedCharacters } from "../../common/common-util";
import FormInputCheck from "../components/form-input-check";

export default function ImageRegistriesPage(): JSX.Element {

  return (
    <React.Fragment>
      <SetupPageHeader pageIndex={4} canProceed={true} />

      <DataFetcher type="api" endpoint={ApiEndpoints.User.ImageRegistries} loadingDisplay="card">{
        (registriesRes: ApiResponses.ImageRegistryListResult, reload) => {

          return (
            <React.Fragment>
              <Card>
                <Card.Title>
                  <div>
                  Container Image Registries
                  </div>
                  <div className="ml-auto">

                    <Button variant="primary"
                      onClick={reload}
                    >
                      <BtnBody icon="sync-alt" text="Reload"/>
                    </Button>
                  </div>
                </Card.Title>
                <Card.Body>
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
                        <Table striped bordered variant="dark">
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
                </Card.Body>
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
          <ExternalLink href={"https://" + registry.fullPath} icon={{ position: "right", icon: "external-link-alt" }} />
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
          <BtnBody icon="times" title="Remove" isLoading={isDeleting}/>
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
      <Card.Title>
        Add an Image Registry
      </Card.Title>
      <Card.Body>
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
            <Form.Row>
              <Form.Group as={Col}>
                <Form.Label>
                  Registry
                </Form.Label>
                <Form.Control as="select" onChange={(e) => {
                  const type = e.currentTarget.value as ImageRegistry.Type;
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
                </Form.Control>
              </Form.Group>

              <Form.Group as={Col}>
                <Form.Label>
                  Namespace
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
                  )} />
                </Form.Label>
                <Form.Control type="text"
                  isValid={registryInfo.namespace.length > 0 && !containsBannedCharacters(registryInfo.namespace)}
                  isInvalid={containsBannedCharacters(registryInfo.namespace)}
                  defaultValue={registryInfo.namespace}
                  onChange={(e) => {
                    const namespace = e.currentTarget.value;
                    const username = userNameIsNamespace ? namespace : registryInfo.username;
                    setRegistryInfo({ namespace, username });
                  }}
                />
                <Form.Control.Feedback type="invalid">
                  The namespace contains illegal characters.
                </Form.Control.Feedback>
              </Form.Group>
            </Form.Row>

            <Form.Row className={classNames({ "d-none": !showHostnameInput })}>
              <Form.Group as={Col} className="col-6">
                <Form.Label>
                  Hostname
                </Form.Label>
                <Form.Control
                  type="text"
                  onChange={(e) => {
                    setRegistryInfo({ hostname: e.currentTarget.value });
                  }}
                  isValid={validateHostname(registryInfo.hostname)}
                />
                <Form.Control.Feedback type="invalid">
                  Enter the {"registry's"} hostname.
                </Form.Control.Feedback>
              </Form.Group>
            </Form.Row>

            <Form.Row>
              <Form.Group as={Col} className="col-6">
                <Form.Label>
                  Registry Path
                  <TooltipIcon body={(
                    <React.Fragment>
                      <p>Registry Path is the Registry plus the Namespace, separated by a slash.</p>
                      <p>Use the fields above to change the Registry Path.</p>
                    </React.Fragment>
                  )}/>
                </Form.Label>
                <Form.Control
                  readOnly={true}
                  value={registryInfo.hostname ? `${registryInfo.hostname}/${registryInfo.namespace}` : ""}
                />
              </Form.Group>
            </Form.Row>

            <hr/>

            <Form.Row className="d-flex align-items-center">
              <Form.Group as={Col} className="col-6">
                <Form.Label>
                  Username
                </Form.Label>
                <Form.Control type="text"
                  isValid={registryInfo.username.length > 0 && !containsBannedCharacters(registryInfo.username, true)}
                  isInvalid={containsBannedCharacters(registryInfo.username, true)}
                  defaultValue={userNameIsNamespace ? registryInfo.namespace : registryInfo.username}
                  readOnly={userNameIsNamespace}
                  title={userNameIsNamespace ? "Username is same as namespace" : ""}
                  onChange={(e) => { setRegistryInfo({ username: e.currentTarget.value }); }}
                />
              </Form.Group>
              <Form.Group className="pl-3 b">
                <Form.Label>
                  &nbsp;  {/* eh */}
                </Form.Label>
                <FormInputCheck
                  type="checkbox"
                  checked={userNameIsNamespace}
                  onChange={(checked) => { setUserNameIsNamespace(checked); }}
                >
                  Username same as namespace
                </FormInputCheck>
              </Form.Group>

            </Form.Row>

            <Form.Row>
              <Form.Group as={Col} className="col-6">
                <Form.Label>
                  Password or Token
                </Form.Label>
                <Form.Control type="password"
                  isValid={undefined}
                  isInvalid={undefined}
                  readOnly={registryInfo.ghcrUseGitHubToken}
                  value={registryInfo.passwordOrToken}
                  onChange={(e) => { setRegistryInfo({ passwordOrToken: e.currentTarget.value }); }}
                />

              </Form.Group>

              <Form.Group className={classNames("pl-3 b", { "d-none": registryInfo.type !== "GHCR" })}>
                <Form.Label>
                  &nbsp;  {/* eh */}
                </Form.Label>

                <FormInputCheck
                  type="checkbox"
                  checked={registryInfo.ghcrUseGitHubToken ?? false}
                  onChange={(checked) => { setRegistryInfo({ ghcrUseGitHubToken: checked, passwordOrToken: "" }); }}
                >
                  <React.Fragment>
                    Use built-in Actions workflow token
                    <ExternalLink
                      className="mx-2"
                      href="https://docs.github.com/en/actions/reference/authentication-in-a-workflow"
                    >
                      <FontAwesomeIcon icon="question-circle" size="lg" />
                    </ExternalLink>
                  </React.Fragment>
                </FormInputCheck>
              </Form.Group>
            </Form.Row>

            <div className="mt-3 d-flex justify-content-center align-items-center">
              <Button size="lg" type="submit">
                <BtnBody text="Add Image Registry" icon="plus" />
              </Button>
            </div>
          </Form>
        </div>

        <SubmissionStatusBanner bannerId={bannerId()} isSubmitting={isSubmitting} submissionResult={submissionResult}/>
      </Card.Body>
    </Card>
  );
}

function validateHostname(hostname: string | undefined): boolean {
  return hostname != null && hostname.length > 0 && !containsBannedCharacters(hostname);
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

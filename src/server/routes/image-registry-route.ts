import express from "express";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import ApiRequests from "common/api-requests";
import { DEFAULT_SECRET_NAMES } from "common/default-secret-names";
import { send405 } from "server/express-extends";

const router = express.Router();

router.route(ApiEndpoints.User.ImageRegistries.path)
  .get(async (req, res: express.Response<ApiResponses.ImageRegistryListResult>, next) => {

    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const registries = user.imageRegistries.getAll();

    return res.json({
      success: true,
      message: `${registries.length} image registries are set up`,
      severity: "success",
      registries,
      registryPasswordSecretName: DEFAULT_SECRET_NAMES.registryPassword,
    });
  })
  .post(async (
    req: express.Request<any, any, ApiRequests.AddImageRegistry>,
    res: express.Response<ApiResponses.ImageRegistryCreationResult>,
    next,
  ) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const registry = await user.imageRegistries.add(req.body);

    return res.json({
      success: true,
      message: `Saved registry ${registry.fullPath}`,
      severity: "success",
      registry,
    });
  })
  .delete(async (
    req: express.Request<any, any, ApiRequests.DeleteImageRegistry>,
    res: express.Response<ApiResponses.Result>,
    next,
  ) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const deleteResult = await user.imageRegistries.delete(req.body.id);

    if (!deleteResult) {
      return res.status(404).json({
        message: `Image registry with id ${req.body.id} not found`,
        success: false,
      });
    }

    return res.json({
      message: `Deleted image registry ${req.body.id}`,
      success: true,
    });
  })
  .all(send405([ "GET", "POST", "DELETE" ]));

export default router;

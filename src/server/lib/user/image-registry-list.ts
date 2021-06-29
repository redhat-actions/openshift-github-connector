import { v4 as uuid } from "uuid";
import ImageRegistry from "common/types/image-registries";
import Log from "server/logger";

export default class ImageRegistryListWrapper {

  private readonly imageRegistries: ImageRegistry.List;

  public constructor(
    private readonly onChange: () => Promise<void>,
    imageRegistriesStringified: string | undefined,
  ) {
    if (imageRegistriesStringified) {
      this.imageRegistries = JSON.parse(imageRegistriesStringified);
    }
    else {
      this.imageRegistries = [];
    }
  }

  // public static async create(ids: string[]): Promise<ImageRegistryList> {

  //   const imageRegistries = await SecretUtil.getSecretsMatchingSelector()
  // }

  public getById(id: string): ImageRegistry.List[number] | undefined {
    return this.imageRegistries.find((reg) => reg.id === id);
  }

  public getAll(): ImageRegistry.List {
    return this.imageRegistries;
  }

  public async add(info: ImageRegistry.Inputs): Promise<ImageRegistry.List[number]> {
    const id = uuid();

    this.imageRegistries.push({
      id,
      fullPath: info.hostname + "/" + info.namespace,
      ...info,
    });

    const newRegistry = this.imageRegistries[this.imageRegistries.length - 1];

    Log.info(`Added image registry with ID ${newRegistry.id} and hostname ${newRegistry.hostname}`);
    await this.onChange();

    return newRegistry
  }

  public async delete(id: string): Promise<boolean> {
    const regIndex = this.imageRegistries.findIndex((reg) => reg.id === id);
    if (regIndex === -1) {
      return false;
    }

    Log.info(`Removed image registry with ID ${id}`);
    this.imageRegistries.splice(regIndex, 1);
    await this.onChange();
    return true;
  }

  public toString(): string {
    return JSON.stringify(this.imageRegistries);
  }
}

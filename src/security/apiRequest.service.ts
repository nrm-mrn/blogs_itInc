import { ObjectId } from "mongodb";
import { ApiRequest } from "./apiRequest.entity";
import { apiRequestsRepository } from "./apiRequest.repository";
import { CreateRequestDto } from "./apiRequest.types";

export const apiRequestService = {
  async saveRequest(req: CreateRequestDto): Promise<ObjectId> {
    const reqInput: ApiRequest = new ApiRequest(
      req.ip,
      req.URL,
    )
    return await apiRequestsRepository.saveRequest(reqInput);
  },

  async getDocsCountForPeriod(ip: string, url: string, seconds: number): Promise<number> {
    const reqs = await apiRequestsRepository.getRequestsForPeriod(
      ip,
      url,
      seconds
    )

    return reqs.length
  }
}
